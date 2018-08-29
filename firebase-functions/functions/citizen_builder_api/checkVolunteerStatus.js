'use strict';

const admin = require('firebase-admin')
const functions = require('firebase-functions')
const date = require('../dateformat')

// for calling CitizenBuilder API
var request = require('request')

// create reference to root of the database
const db = admin.database()


/***
paste this on the command line...
firebase deploy --only functions:checkLegal,functions:timestampCbApiEvent,functions:onResponseFromLegal
***/


/*****************************
Tells us if a person (email) has satisfied the requirements to see COS volunteer info
The requirements are: petition signed, conf agreement signed, and not banned
*****************************/
exports.checkVolunteerStatus = function(email, allowed, notAllowed) {

    // as long as there's an email address, call the CB API endpoint to see if this person
    // has satisfied the legal requirements
    var endpoint = 'https://api.conventionofstates.com/api/ios/v1/volunteer_validation/check?email='+email

    db.ref('api_tokens').once('value').then(snapshot => {
        var apiKeyName = snapshot.val().citizen_builder_api_key_name
        var apiKeyValue = snapshot.val().citizen_builder_api_key_value


        var headers = {}
        headers[apiKeyName] = apiKeyValue

        var options = {
            url: endpoint,
            headers: headers
        };

        // see above:   var request = require('request')
        request.get(options, function(error, response, body){
            //console.log(body);
            var obj = JSON.parse(body)
            var ok = ''
            if(obj.volunteer) {
                allowed()
            }
            else {
                notAllowed()
            }
        })

    })
}

exports.checkLegal = functions.database.ref('cb_api_events/{key}').onCreate(event => {
    if(event.data.val().event_type != 'check legal')
        return false

    var f = function(valid) {
        db.ref('cb_api_events').push().set({uid: event.data.val().uid, name: event.data.val().name, email: event.data.val().email,
                                        event_type: 'check legal response', valid: valid})
    }

    // now check legal status...
    var allowed = function() {
        f(true)
    }
    var notAllowed = function() {
        f(false)
    }
    exports.checkVolunteerStatus(event.data.val().email, allowed, notAllowed)
    return true
})

// update the petition, conf agreement and banned flags on the user record...
exports.onResponseFromLegal = functions.database.ref('cb_api_events/{key}').onCreate(event => {
    if(event.data.val().event_type != 'check legal response')
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

exports.grantAccess = function(updates, uid, name, email) {

    // called when the user HAS satisfied the legal requirements for access
    // In this case, set these attributes on the user's node
    updates['users/'+uid+'/account_disposition'] = "enabled"
    updates['users/'+uid+'/has_signed_petition'] = true
    updates['users/'+uid+'/has_signed_confidentiality_agreement'] = true
    updates['users/'+uid+'/is_banned'] = false
    updates['users/'+uid+'/roles/Volunteer'] = "true" // TODO not a boolean - geez
    return db.ref('/administration/newusers/assign_to_team').once('value').then(snapshot => {
        var team_name = snapshot.val()
        updates['teams/'+team_name+'/members/'+uid+'/name'] = name
        updates['teams/'+team_name+'/members/'+uid+'/email'] = email
        updates['teams/'+team_name+'/members/'+uid+'/date_added'] = date.asCentralTime()
        updates['users/'+uid+'/teams/'+team_name+'/team_name'] = team_name
        updates['users/'+uid+'/teams/'+team_name+'/date_added'] = date.asCentralTime()
        return db.ref('/').update(updates)
    })
}

// just housekeeping - always timestamp the event
exports.timestampCbApiEvent = functions.database.ref('cb_api_events/{key}').onCreate(event => {
    return event.data.ref.update({date: date.asCentralTime(), date_ms: date.asMillis()})
})