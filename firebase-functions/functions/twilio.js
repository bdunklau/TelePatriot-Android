'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const AccessToken = require('twilio').jwt.AccessToken
const VideoGrant = AccessToken.VideoGrant
const twilio = require('twilio')

var style = "font-family:Arial;font-size:12px"
var tableheading = style + ';background-color:#ededed'


// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


/****
deploy everything in this file...
firebase deploy --only functions:twilioCallback,functions:testTwilioToken,functions:testCreateRoom,functions:testListRooms
****/


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

    return db.ref().child('twilio_events').push().set(twilioEvent).then(snapshot => {
        return res.status(200).send('OK')
    })

})


exports.testTwilioToken = functions.https.onRequest((req, res) => {

    var stuff = {name:'testuser',
                room:'cool room'}

    return exports.generateTwilioToken(stuff).then(token => {
        res.status(200).send('Twilio token: <P/>'+token)
    })

})


exports.testListRooms = functions.https.onRequest((req, res) => {

    return db.ref('api_tokens').once('value').then(snapshot => {

        //var room_id = req.query.room_id

        const client = twilio(snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)

        client.video.rooms
                    .each({ /*see https://www.twilio.com/docs/video/api/rooms-resource#get-list-resource for parms*/
                        uniqueName: 'xxxxx'
                    },
                    function(rooms) {
                        console.log('rooms: ', rooms)
                        db.ref('templog2').set({rooms: rooms})
//                        var html = ''
//                        html += '<html><head></head><body>'
//                        html += '<table>'
//                        html += '<tr>'
//                        html +=     '<th>room.sid</th>'
//                        html +=     '<th>room.unique_name</th>'
//                        html +=     '<th>room.url</th>'
//                        html += '</tr>'
//                        _.each(rooms, function(room) {
//                            html += '<tr>'
//                            html +=     '<td>'+room.sid+'</td>'
//                            html +=     '<td>'+room.unique_name+'</td>'
//                            html +=     '<td>'+room.url+'</td>'
//                            html += '</tr>'
//                        })
//                        html += '</table>'
//                        html += '</body></html>'

                    })
        return res.status(200).send('done')
    })
})


// ref  https://www.twilio.com/docs/video/api/rooms-resource#post-list-resource
exports.testCreateRoom = functions.https.onRequest((req, res) => {

    if(!req.query.room_id)
        return res.status(200).send('Required:  room_id request parameter')

    return db.ref('api_tokens').once('value').then(snapshot => {

        var room_id = req.query.room_id

        const client = twilio(snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)

        client.video.rooms
                    .create({
                       recordParticipantsOnConnect: true,
                       statusCallback: 'https://'+req.get('host')+'/twilioCallback',
                       type: 'group-small',
                       uniqueName: room_id
                     })
                    .then(room => {
                        console.log(room.sid)
                        db.ref('templog2').set({room: room})
                    })
                    .done();

        return res.status(200).send('ok: don\'t know if we have a room or not')
    })
})


// ref:  https://www.twilio.com/docs/iam/access-tokens#creating-tokens
// We export this so we can call this function from switchboard.js  It's not meant to be a firebase function
exports.generateTwilioToken = function(stuff) {
    var identity = stuff.name
    return db.ref('api_tokens').once('value').then(snapshot => {

        // Used when generating any kind of tokens
        const twilioAccountSid = snapshot.val().twilio_account_sid
        const twilioApiKey = snapshot.val().twilio_api_key
        const twilioApiSecret = snapshot.val().twilio_secret

        // Create Video Grant
        const videoGrant = new VideoGrant({
          room: stuff.room_id,
        });

        // Create an access token which we will sign and return to the client,
        // containing the grant we just created
        const token = new AccessToken(twilioAccountSid, twilioApiKey, twilioApiSecret)
        token.addGrant(videoGrant)
        token.identity = identity

        return token.toJwt()
    })
}


var check = function(val) {
    if(!val) return "n/a"
    else return val
}
