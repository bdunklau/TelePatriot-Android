'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')

var style = "font-family:Arial;font-size:12px"
var tableheading = style + ';background-color:#ededed'


// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();



exports.twilioCallback = functions.https.onRequest((req, res) => {


    // ref:  https://www.twilio.com/docs/api/video/status-callbacks
    var accountSid = check(req.body.AccountSid)
    var roomName = check(req.body.RoomName)
    var roomSid = check(req.body.RoomSid)
    var roomStatus = check(req.body.RoomStatus)
    var statusCallbackEvent = check(req.body.StatusCallbackEvent)
    var timestamp = check(req.body.Timestamp)
    var participantSid = check(req.body.ParticipantSid)
    var participantStatus = check(req.body.ParticipantStatus)
    var participantDuration = check(req.body.ParticipantDuration)
    var participantIdentity = check(req.body.ParticipantIdentity)
    var roomDuration = check(req.body.RoomDuration)
    var trackSid = check(req.body.TrackSid)


    console.log('twilioCallback:  got this far')


    var twilioEvent = {body: req.body,
                        query: req.query,
                        accountSid: accountSid,
                       roomName: roomName,
                       roomSid: roomSid,
                       roomStatus: roomStatus,
                       statusCallbackEvent: statusCallbackEvent,
                       timestamp: timestamp,
                       participantSid: participantSid,
                       participantStatus: participantStatus,
                       participantDuration: participantDuration,
                       participantIdentity: participantIdentity,
                       roomDuration: roomDuration,
                       trackSid: trackSid }

    return db.ref().child(`twilio_events`).push().set(twilioEvent).then(snapshot => {
        return res.status(200).send('OK')
    })

})


var check = function(val) {
    if(!val) return "n/a"
    else return val
}
