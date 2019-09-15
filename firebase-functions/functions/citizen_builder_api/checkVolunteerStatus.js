'use strict';

const admin = require('firebase-admin')
const functions = require('firebase-functions')
const date = require('../dateformat')
const email_js = require('../email')
const volunteers = require('./volunteers')

// for calling CitizenBuilder API
var request = require('request')

// create reference to root of the database
const db = admin.database()


/***
paste this on the command line...
firebase deploy --only functions:checkLegal,functions:timestampCbApiEvent,functions:onResponseFromLegal,functions:timestampLegalResponses,functions:timestampLoginResponses
***/


/*****************************
TODO phase out this function because it only returns a true or false.  It doesn't tell us
what attributes a user is missing if they don't meet all the legal requirements.
Instead, we should use the /volunteers endpoint because that endpoint returns the user's
CB ID, petition status, conf agreement status and other attributes that are useful.

Tells us if a person (email) has satisfied the requirements to see COS volunteer info
The requirements are: petition signed, conf agreement signed, and not banned
*****************************/
exports.checkVolunteerStatus = function(email, allowed, notAllowed) {

    db.ref('administration/configuration').once('value').then(snapshot => {
        var environment = 'cb_production_environment'
        if(snapshot.val().environment && snapshot.val().environment == 'cb_qa_environment') {
            environment = snapshot.val().environment
        }

        var apiKeyName = snapshot.val()[environment].citizen_builder_api_key_name
        var apiKeyValue = snapshot.val()[environment].citizen_builder_api_key_value
        var domain = snapshot.val()[environment].citizen_builder_domain
        // as long as there's an email address, call the CB API endpoint to see if this person
        // has satisfied the legal requirements
        var endpoint = 'https://'+domain+'/api/ios/v1/volunteer_validation/check?email='+email

//        console.log('email = ', email)
//        console.log('apiKeyName = ', apiKeyName)
//        console.log('apiKeyValue = ', apiKeyValue)

        var headers = {}
        headers[apiKeyName] = apiKeyValue

        var options = {
            url: endpoint,
            headers: headers
        };

        // see above:   var request = require('request')
        request.get(options, function(error, response, body) {
//            console.log('error: ', error)
//            console.log('body: ', body)
//            console.log('response: ', response)
            var obj = JSON.parse(body)
            console.log('JSON.parse(body) = ', JSON.parse(body));

            if(obj.volunteer) {
                allowed(obj.volunteer)
            }
            else {
                notAllowed(obj.volunteer)
            }
        })

    })
}

// See LimboActivity.clickDone().  That method writes to the database at this location
exports.checkLegal = functions.database.ref('cb_api_events/all-events/{key}').onCreate((snapshot, context) => {
    if(snapshot.val().event_type != 'check legal')
        return false

    var uid = snapshot.val().uid
    var email = snapshot.val().email
    var name = snapshot.val().name

    // We have to determine HOW to check the user's legal status.  We could check the user's legal status via
    // 1) /volunteer_validation/check?email= _______
    // 2) /volunteers?email= ______
    // The second way tells you what the user's petition signature status is and what the user's conf agreement signature status is
    // The first way only tells you true/false depending on whether the user has signed both docs
    // The second endpoint doesn't exist yet on the production server (Dec 2018).  But once this endpoint is published,
    // we won't need to use the first one.

    return db.ref('administration/configuration').once('value').then(snapshot => {
        var configuration = snapshot.val()
        var simulate_passing_legal = configuration.simulate_passing_legal
        if(configuration.on_user_created == "checkVolunteerStatus") {
            // use option 1
            var f = function(valid_actual) {
                var valid = valid_actual
                if(snapshot.val().simulate_passing_legal) {
                    valid = snapshot.val().simulate_passing_legal
                }
                console.log("checkLegal: valid_actual: ", valid_actual, " valid: ", valid)

                db.ref('cb_api_events/all-events').push().set({uid: snapshot.val().uid, name: snapshot.val().name, email: snapshot.val().email,
                                                event_type: 'check-legal-response', valid: valid})
                // for users from the Limbo screens.  There is a "Done" button on that page that they can click that
                // causes this event to get called.  The limbo screens monitor /cb_api_events/check-legal-responses
                // in order to tell the client whether they have in fact satisfied all the legal requirements now
                db.ref('cb_api_events/check-legal-responses/'+snapshot.val().uid)
                    .push()
                    .set({uid: snapshot.val().uid, name: snapshot.val().name, email: snapshot.val().email, valid: valid})
            }

            // now check legal status...
            var allowed = function(valid) {
                f(valid) // true under normal circumstances, set to false to simulate failing legal
            }
            var notAllowed = function(valid) {
                f(valid) // false under normal circumstances, set to true to simulate passing legal
            }
            exports.checkVolunteerStatus(snapshot.val().email, allowed, notAllowed)
        }
        else {
            // otherwise use option 2
            var returnFn = function(result) {
                if(result.error) {
                    // TODO what do we do with an error?
                    db.ref('cb_api_events/check-legal-responses/'+uid)
                        .push()
                        .set({uid: uid, name: name, email: email, valid: false})
                }
                else if(result.notFound) {
                    // TODO need to write a check-legal-response entry to the db indicating this person hasn't satisfied the legal requirements to use this app

                    db.ref('cb_api_events/check-legal-responses/'+uid)
                        .push()
                        .set({uid: uid, name: name, email: email, valid: false})
                }
                else if(result.vol) {
                    // This is what we want to happen: email was found in the CB db
                    volunteers.updateUser({uid: uid, result: result})
                }
                else return false
            }

            // "event" will be the name of some node under administration/configuration like
            // on_user_created or on_user_login.  Whatever attribute we care about, we are going to
            // check the value of the attribute to make sure the value is "volunteers".  Because
            // if the value isn't "volunteers" then this function should return false
            volunteers.getUserInfoFromCB_byEmail(email, returnFn, configuration)
        }
    })


    return true

//    This worked at one time. But now we need to know what the user's CB ID is (if it exists)
//    So we need to start calling the /volunteers endpoint

//    return true
})


// update the petition, conf agreement and banned flags on the user record...
exports.onResponseFromLegal = functions.database.ref('cb_api_events/all-events/{key}').onCreate((snapshot, context) => {
    if(snapshot.val().event_type != 'check-legal-response')
        return false
    var updates = {}
    if(snapshot.val().valid) {
        return exports.grantAccess(updates, snapshot.val().uid, snapshot.val().name, snapshot.val().email)
    }
    else {
        updates['users/'+snapshot.val().uid+'/has_signed_petition'] = null
        updates['users/'+snapshot.val().uid+'/has_signed_confidentiality_agreement'] = null
        updates['users/'+snapshot.val().uid+'/is_banned'] = null
        return db.ref('/').update(updates)
    }
})

exports.denyAccess = function(updates, uid) {
    updates['users/'+snapshot.val().uid+'/has_signed_petition'] = null
    updates['users/'+snapshot.val().uid+'/has_signed_confidentiality_agreement'] = null
    updates['users/'+snapshot.val().uid+'/is_banned'] = null
    return db.ref('/').update(updates)
}


// TODO Need to rethink this.  Granting access is JUST setting these attribute:
// account_disposition, has_signed_petition, has_signed_confidentiality_agreement, and is_banned
// NOT assigned roles or teams.  We'll "grandfather" the legacy stuff and leave it alone
// if administration/configuration/get_teams_from = 'telepatriot' and administration/configuration/get_roles_from = 'telepatriot'
exports.grantAccess = function(updates, uid, name, email) {


    // called when the user HAS satisfied the legal requirements for access
    // In this case, set these attributes on the user's node
    updates['users/'+uid+'/account_disposition'] = "enabled"
    updates['users/'+uid+'/has_signed_petition'] = true
    updates['users/'+uid+'/has_signed_confidentiality_agreement'] = true
    updates['users/'+uid+'/is_banned'] = false

    return db.ref('administration/configuration').once('value').then(snap2 => {
        var get_roles_from = 'citizenbuilder'
        if(snap2.val().get_roles_from == 'telepatriot') get_roles_from = snap2.val().get_roles_from

        var get_teams_from = 'citizenbuilder'
        if(snap2.val().get_teams_from == 'telepatriot') get_teams_from = snap2.val().get_teams_from

        if(get_roles_from == 'telepatriot') updates['users/'+uid+'/roles/Volunteer'] = "true" // TODO not a boolean - geez

        // TODO If we're getting team list from CitizenBuilder, we don't know yet (11/17/18) what the default team will be
        if(get_teams_from == 'telepatriot') {

            return db.ref('/administration/newusers/assign_to_team').once('value').then(snapshot => {
                var team_name = snapshot.val()
                updates['teams/'+team_name+'/members/'+uid+'/name'] = name
                updates['teams/'+team_name+'/members/'+uid+'/email'] = email
                updates['teams/'+team_name+'/members/'+uid+'/date_added'] = date.asCentralTime()
                updates['users/'+uid+'/teams/'+team_name+'/team_name'] = team_name
                updates['users/'+uid+'/teams/'+team_name+'/date_added'] = date.asCentralTime()
                email_js.sendWelcomeEmail(email, name)
                return db.ref('/').update(updates)
            })
        }
        else {
            email_js.sendWelcomeEmail(email, name)
            return db.ref('/').update(updates)
        }

    })

}

// just housekeeping - always timestamp the event
exports.timestampCbApiEvent = functions.database.ref('cb_api_events/all-events/{key}').onCreate((snapshot, context) => {
    return snapshot.ref.update({date: date.asCentralTime(), date_ms: date.asMillis()})
})

// just housekeeping - always timestamp the event
exports.timestampLegalResponses = functions.database.ref('cb_api_events/check-legal-responses/{key1}/{key2}').onCreate((snapshot, context) => {
    return snapshot.ref.update({date: date.asCentralTime(), date_ms: date.asMillis()})
})

// just housekeeping - always timestamp the event
exports.timestampLoginResponses = functions.database.ref('cb_api_events/login-responses/{key1}/{key2}').onCreate((snapshot, context) => {
    return snapshot.ref.update({date: date.asCentralTime(), date_ms: date.asMillis()})
})