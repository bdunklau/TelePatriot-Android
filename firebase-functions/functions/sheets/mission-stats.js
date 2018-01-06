'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


// update the percent_complete each time a row is completed
exports.percentComplete = functions.database.ref("teams/{team}/missions/{missionId}/total_rows_completed").onWrite(
    event => {

    // if mission was deleted, just return
    if(!event.data.exists() && event.data.previous.exists()) {
        return false
    }

    var team = event.params.team
    var missionId = event.params.missionId
    var total_rows_completed = event.data.val()


    // have to know how many rows in the spreadsheet have phone numbers
    return event.data.adminRef.root.child(`teams/${team}/missions/${missionId}/total_rows_in_spreadsheet_with_phone`).once('value').then(snapshot => {
        var total_rows_in_spreadsheet_with_phone = snapshot.val()
        if(!total_rows_in_spreadsheet_with_phone || !total_rows_completed) {
            return 0
        }
        else if(total_rows_in_spreadsheet_with_phone == 0) {
            return 0
        }
        else {
            var fraction = total_rows_completed / total_rows_in_spreadsheet_with_phone
            return Math.round(fraction * 100) // makes a nice round number betwee 0-100 with no decimal points
        }
    })
    .then(percent_complete => {
        event.data.adminRef.root.child(`teams/${team}/missions/${missionId}/percent_complete`).set(percent_complete)
    })
})
