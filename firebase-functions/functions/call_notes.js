'use strict';

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const request = require('request')

// create reference to root of the database
const db = admin.database().ref()

/**
firebase deploy --only functions:onCallNotesCreated
**/

exports.onCallNotesCreated = functions.database.ref('call_notes/{key}').onCreate(event => {

    var call_notes = event.data.val()
    var msg = '=============================\n'
        +'Mission ID '+call_notes.mission_id+': '+call_notes.mission_name+' is '+call_notes.percent_complete+'% Complete, '+call_notes.calls_made+' of '+call_notes.total+' calls made\n'
        +call_notes.outcome+': '+call_notes.author_name+' CB ID: '+call_notes.author_id+' just called '
        +call_notes.first_name+' '+call_notes.last_name+' CB ID: '+call_notes.person_id+' at '+call_notes.phone_number+'\n'

    if(call_notes.outcome == '3-way call' && call_notes.name2 && call_notes.phone2) {
        msg += 'included 3-way call with '+call_notes.name2+' at '+call_notes.phone2+'\n'
    }
    if(call_notes.notes) msg += 'Notes: '+call_notes.notes

    // Get rid of all ( and ) in the message because those get encoded on Slack as %28 and %29
    msg = msg.replace(/\(|\)/g, '')

    return db.child('administration/configuration').once('value').then(snapshot => {
        if(snapshot.val().on_call_notes == 'do_nothing')
            return false
        var url = snapshot.val().call_notes_webhook

        var formData = {"text": msg, "mrkdwn": true}

        request.post(
            {
                url: url,
                form: JSON.stringify(formData)
                ,headers: {'Content-type': 'application/json'}
            },
            function (err, httpResponse, body) {
                //log something here, see userCreated.js
            }
        );
    })
})