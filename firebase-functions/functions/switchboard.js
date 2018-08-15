'use strict';

/********************************************************************************
See:  https://cloud.google.com/nodejs/docs/reference/compute/0.10.x/
********************************************************************************/

// external dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const twilio_telepatriot = require('./twilio-telepatriot')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database()

/***
paste this on the command line...
firebase deploy --only functions:onTwilioEvent,functions:testViewVideoEvents,functions:onConnectRequest,functions:onDisconnectRequest
***/

exports.onConnectRequest = functions.database.ref('video/video_events/{key}').onCreate(event => {
    if(!event.data.val().request_type)
        return false //ignore malformed

    if(event.data.val().request_type != 'connect request') return false //ignore, not a connect request
    var video_event_key = event.params.key
    var updates = {}
    updates['video/video_events/'+video_event_key+'/date'] = date.asCentralTime()
    updates['video/video_events/'+video_event_key+'/date_ms'] = date.asMillis()
    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+event.data.val().uid+'/connect_date'] = date.asCentralTime()
    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+event.data.val().uid+'/connect_date_ms'] = date.asMillis()
    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+event.data.val().uid+'/disconnect_date'] = null
    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+event.data.val().uid+'/disconnect_date_ms'] = null

    var stuff = {name: event.data.val().name,
                room_id: event.data.val().room_id}

    return twilio_telepatriot.generateTwilioToken(stuff).then(token => {
        updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+event.data.val().uid+'/twilio_token'] = token
        return event.data.adminRef.root.child('/').update(updates)
    })

})

exports.onDisconnectRequest = functions.database.ref('video/video_events/{key}').onCreate(event => {
    if(!event.data.val().request_type) return false //ignore malformed
    if(event.data.val().request_type != 'disconnect request') return false //ignore, not a connect request
    var video_event_key = event.params.key

    var updates = {}
    updates['video/video_events/'+video_event_key+'/date'] = date.asCentralTime()
    updates['video/video_events/'+video_event_key+'/date_ms'] = date.asMillis()
    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+event.data.val().uid+'/disconnect_date'] = date.asCentralTime()
    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+event.data.val().uid+'/disconnect_date_ms'] = date.asMillis()
    return event.data.adminRef.root.child('/').update(updates)
})


exports.onTwilioEvent = functions.database.ref('video/video_events/{key}').onCreate(event => {
    if(!event.data.val().StatusCallbackEvent)
        return false //ignore malformed

    var updates = {}
    updates['video/video_events/'+event.params.key+'/date'] = date.asCentralTime()
    updates['video/video_events/'+event.params.key+'/date_ms'] = date.asMillis()
    return event.data.adminRef.root.child('/').update(updates)
})


exports.testViewVideoEvents = functions.https.onRequest((req, res) => {
    var limit = 25
    if(req.query.limit) limit = parseInt(req.query.limit)

    return db.ref('video/video_events').orderByChild('date_ms').limitToLast(limit).once('value').then(snapshot => {
        var html = ''
        html += '<html><head></head><body>'
        html += '<h3>video/video_events</h3>'
        html += '<table border="1" cellspacing="0" cellpadding="2">'
        html +=     '<tr>'
        html +=         '<th>date</th>'
        html +=         '<th>name</th>'
        html +=         '<th>request_type</th>'
        html +=         '<th>room_id</th>'
        html +=         '<th>uid</th>'
        html +=         '<th>video_node_key</th>'
        html +=         '<th>AccountSid</th>'
        html +=         '<th>RoomName</th>'
        html +=         '<th>RoomSid</th>'
        html +=         '<th>RoomStatus</th>'
        html +=         '<th>StatusCallbackEvent</th>'
        html +=         '<th>Timestamp</th>'
        html +=         '<th>ParticipantSid</th>'
        html +=         '<th>ParticipantStatus</th>'
        html +=         '<th>ParticipantDuration</th>'
        html +=         '<th>ParticipantIdentity</th>'
        html +=         '<th>RoomDuration</th>'
        html +=         '<th>TrackSid</th>'
        html +=     '</tr>'
        snapshot.forEach(function(child) {
            html += '<tr>'
            html +=     '<td nowrap>'+(child.val()['date'] ? child.val()['date'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['name'] ? child.val()['name'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['request_type'] ? child.val()['request_type'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['room_id'] ? child.val()['room_id'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['uid'] ? child.val()['uid'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['video_node_key'] ? child.val()['video_node_key'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['AccountSid'] ? child.val()['AccountSid'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['RoomName'] ? child.val()['RoomName'] : "")+'</td>'
            if(child.val()['RoomSid']) {
                html += '<td nowrap>'
                html +=     '[<a href="/testCompleteRoom?room_sid='+child.val()['RoomSid']+'">complete</a>] '
                html +=     '[<a href="/testListParticipants?room_sid='+child.val()['RoomSid']+'">participants</a>] '
                html +=     '<a href="/testRetrieveRoom?room_sid='+child.val()['RoomSid']+'">'+child.val()['RoomSid']+'</a>'
                html += '</td>'
            }
            else {
                html += '<td> </td>'
            }
            html +=     '<td nowrap>'+(child.val()['RoomStatus'] ? child.val()['RoomStatus'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['StatusCallbackEvent'] ? child.val()['StatusCallbackEvent'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['Timestamp'] ? child.val()['Timestamp'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['ParticipantSid'] ? child.val()['ParticipantSid'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['ParticipantStatus'] ? child.val()['ParticipantStatus'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['ParticipantDuration'] ? child.val()['ParticipantDuration'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['ParticipantIdentity'] ? child.val()['ParticipantIdentity'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['RoomDuration'] ? child.val()['RoomDuration'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['TrackSid'] ? child.val()['TrackSid'] : "")+'</td>'
            html += '</tr>'
        })
        html += '</table>'
        html += '</body></html>'
        return res.status(200).send(html)
    })
})