'use strict';

const admin = require('firebase-admin')
const functions = require('firebase-functions')
const date = require('../dateformat')
const email_js = require('../email')

// for calling CitizenBuilder API
var request = require('request')

// create reference to root of the database
const db = admin.database()


/***
paste this on the command line...
firebase deploy --only functions:checkLegal,functions:timestampCbApiEvent,functions:onResponseFromLegal,functions:timestampLegalResponses,functions:timestampLoginResponses
***/


/*****************************
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

exports.checkLegal = functions.database.ref('cb_api_events/all-events/{key}').onCreate(event => {
    if(event.data.val().event_type != 'check legal')
        return false

    var f = function(valid_actual) {
        event.data.adminRef.root.child('administration/configuration/simulate_passing_legal').once('value').then(snapshot => {
            var valid = valid_actual
            if(snapshot.val()) {
                valid = snapshot.val()
            }
            console.log("checkLegal: valid_actual: ", valid_actual, " valid: ", valid)

            db.ref('cb_api_events/all-events').push().set({uid: event.data.val().uid, name: event.data.val().name, email: event.data.val().email,
                                            event_type: 'check-legal-response', valid: valid})
            // for users from the Limbo screens.  There is a "Done" button on that page that they can click that
            // causes this event to get called.  The limbo screens monitor /cb_api_events/check-legal-responses
            // in order to tell the client whether they have in fact satisfied all the legal requirements now
            db.ref('cb_api_events/check-legal-responses/'+event.data.val().uid)
                .push()
                .set({uid: event.data.val().uid, name: event.data.val().name, email: event.data.val().email, valid: valid})
        })
    }

    // now check legal status...
    var allowed = function(valid) {
        f(valid) // true under normal circumstances, set to false to simulate failing legal
    }
    var notAllowed = function(valid) {
        f(valid) // false under normal circumstances, set to true to simulate passing legal
    }
    exports.checkVolunteerStatus(event.data.val().email, allowed, notAllowed)
    return true
})

// update the petition, conf agreement and banned flags on the user record...
exports.onResponseFromLegal = functions.database.ref('cb_api_events/all-events/{key}').onCreate(event => {
    if(event.data.val().event_type != 'check-legal-response')
        return false
    var updates = {}
    if(event.data.val().valid) {
        return exports.grantAccess(updates, event.data.val().uid, event.data.val().name, event.data.val().email)
    }
    else {
        updates['users/'+event.data.val().uid+'/has_signed_petition'] = null
        updates['users/'+event.data.val().uid+'/has_signed_confidentiality_agreement'] = null
        updates['users/'+event.data.val().uid+'/is_banned'] = null
        return db.ref('/').update(updates)
    }
})

exports.denyAccess = function(updates, uid) {
    updates['users/'+event.data.val().uid+'/has_signed_petition'] = null
    updates['users/'+event.data.val().uid+'/has_signed_confidentiality_agreement'] = null
    updates['users/'+event.data.val().uid+'/is_banned'] = null
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
exports.timestampCbApiEvent = functions.database.ref('cb_api_events/all-events/{key}').onCreate(event => {
    return event.data.ref.update({date: date.asCentralTime(), date_ms: date.asMillis()})
})

// just housekeeping - always timestamp the event
exports.timestampLegalResponses = functions.database.ref('cb_api_events/check-legal-responses/{key1}/{key2}').onCreate(event => {
    return event.data.ref.update({date: date.asCentralTime(), date_ms: date.asMillis()})
})

// just housekeeping - always timestamp the event
exports.timestampLoginResponses = functions.database.ref('cb_api_events/login-responses/{key1}/{key2}').onCreate(event => {
    return event.data.ref.update({date: date.asCentralTime(), date_ms: date.asMillis()})
})