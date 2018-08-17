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
firebase deploy --only functions:onTwilioEvent,functions:testViewVideoEvents,functions:onConnectRequest,functions:onDisconnectRequest,functions:onStartRecordingRequest,functions:onStopRecordingRequest,functions:onParticipantDisconnected
***/

exports.onConnectRequest = functions.database.ref('video/video_events/{key}').onCreate(event => {
    if(!event.data.val().request_type)
        return false //ignore malformed

    if(event.data.val().request_type != 'connect request') return false //ignore, not a connect request

    return connect(event.params.key, event.data.val().video_node_key, event.data.val().uid, event.data.val().name, event.data.val().room_id)
})

var connect = function(video_event_key, video_node_key, uid, name, room_id) {
    var updates = {}
    updates['video/video_events/'+video_event_key+'/date'] = date.asCentralTime()
    updates['video/video_events/'+video_event_key+'/date_ms'] = date.asMillis()
    updates['video/list/'+video_node_key+'/video_participants/'+uid+'/connect_date'] = date.asCentralTime()
    updates['video/list/'+video_node_key+'/video_participants/'+uid+'/connect_date_ms'] = date.asMillis()
    updates['video/list/'+video_node_key+'/video_participants/'+uid+'/disconnect_date'] = null
    updates['video/list/'+video_node_key+'/video_participants/'+uid+'/disconnect_date_ms'] = null

    var stuff = {name: name,
                room_id: room_id}

    return twilio_telepatriot.generateTwilioToken(stuff).then(token => {
        return db.ref('administration/hosts').orderByChild('type').equalTo('firebase functions').once('value').then(snapshot => {
            var host
            snapshot.forEach(function(child) { // should only be one child
                host = child.val().host
            })
            return twilio_telepatriot.createRoom(room_id, host).then(() => {
                updates['video/list/'+video_node_key+'/video_participants/'+uid+'/twilio_token'] = token
                return db.ref('/').update(updates)
            })

        })


    })

}


/***************
"start recording" = disconnect from the current twilio room (that doesn't have recording enabled) and connect
to a room that DOES have recording enabled.

NOTE: You can't reuse the connect() / disconnect() functions because they rely on triggers to disconnect
all the participants and 'complete' the current room.  When recording, we HAVE to make sure that the everyone
is out of the pre-interview room before we 'complete' it.  If tried to reuse connect() and disconnect(), we
would end up 'complete'-ing both the pre-interview room AND the recorded interview room.  <-- This is based
on observations I made of the video/video_events table.  I actually saw both rooms closed one right on top of
the other.
***************/
exports.onStartRecordingRequest = functions.database.ref('video/video_events/{key}').onCreate(event => {
    if(event.data.val().request_type && event.data.val().request_type == "start recording") {



        return disconnect(event.params.key, event.data.val().video_node_key, event.data.val().uid, event.data.val().room_id).then(() => {
            var newroom_id = 'record'+event.data.val().room_id
            return event.data.adminRef.root.child('video/list/'+event.data.val().video_node_key+'/room_id').set(newroom_id).then(() => {

                return connect(event.params.key, event.data.val().video_node_key, event.data.val().uid, event.data.val().name, newroom_id)
            })
        })

    }

    else return false
})


// "stop recording" = disconnect all participants from the current room and RE-connect them
// to the room they were in before the recording started.
exports.onStopRecordingRequest = functions.database.ref('video/video_events/{key}').onCreate(event => {
    if(event.data.val().request_type && event.data.val().request_type == "stop recording") {

        return disconnect(event.params.key, event.data.val().video_node_key, event.data.val().uid, event.data.val().room_id).then(() => {
            var newroom_id = event.data.val().room_id.substring('record'.length)
            return event.data.adminRef.root.child('video/list/'+event.data.val().video_node_key+'/room_id').set(newroom_id).then(() => {

                return connect(event.params.key, event.data.val().video_node_key, event.data.val().uid, event.data.val().name, newroom_id)
            })
        })

    }

    else return false
})



exports.onDisconnectRequest = functions.database.ref('video/video_events/{key}').onCreate(event => {
    if(!event.data.val().request_type) return false //ignore malformed
    if(event.data.val().request_type != 'disconnect request') return false //ignore, not a connect request
    return disconnect(event.params.key, event.data.val().video_node_key, event.data.val().uid, event.data.val().room_id)
})

var disconnect = function(video_event_key, video_node_key, uid, room_id) {
    var updates = {}
    updates['video/video_events/'+video_event_key+'/date'] = date.asCentralTime()
    updates['video/video_events/'+video_event_key+'/date_ms'] = date.asMillis()
    updates['video/list/'+video_node_key+'/video_participants/'+uid+'/disconnect_date'] = date.asCentralTime()
    updates['video/list/'+video_node_key+'/video_participants/'+uid+'/disconnect_date_ms'] = date.asMillis()
    // the mobile client will detect 'disconnect_date' which causes the client to actually disconnect from the room
    // Disconnect causes twilio to fire back with StatusCallbackEvent=participant-disconnected which gets written
    // to video/video_events.  And we have a trigger in this file onParticipantDisconnected() that examines how many
    // participants are left.  If none are left, that trigger 'completes' the room
    return db.ref('/').update(updates)
}


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
    var stuff = {limit: limit}
    return twilio_telepatriot.videoEvents(stuff).then(html => res.status(200).send(html))
})


// when one participant disconnects, see if there any connected participants left
// if there aren't any, then 'complete' the room
exports.onParticipantDisconnected = functions.database.ref('video/video_events/{key}').onCreate(event => {
    if(event.data.val().RoomSid && event.data.val().StatusCallbackEvent && event.data.val().StatusCallbackEvent == 'participant-disconnected') {
        // see if any participants are left...
        // ref:  https://www.twilio.com/docs/video/api/participants
        var callback = function(totals) {
            db.ref('templog2').remove()
            db.ref('templog2').push().set({participants_connected: totals.connected, expecting: 0})
            if(totals.connected == 0) {
                // mark all other participants as disconnected (this will actually cause mobile clients to
                // execute their doDisconnect() methods...
                var video_node_key = event.data.val().RoomName
                if(video_node_key.startsWith('record'))
                    video_node_key = video_node_key.substring('record'.length)
                // Have to query for the other pariticipants uid because uid doesn't exist
                // on the video_events node containing the 'participant-disconnected'
                db.ref('templog2').push().set({querying: '/video_participants', expecting: 'one other person'})
                return event.data.adminRef.root.child('video/list/'+video_node_key+'/video_participants').once('value').then(snapshot => {
                    var updates = {}
                    snapshot.forEach(function(child) {
                        if(!child.val().disconnect_date) { // this a participant that needs to be disconnected
                            updates['video/list/'+video_node_key+'/video_participants/'+child.val().uid+'/disconnect_date'] = date.asCentralTime()
                            updates['video/list/'+video_node_key+'/video_participants/'+child.val().uid+'/disconnect_date_ms'] = date.asMillis()
                        }
                    })
                    db.ref('templog2').push().set({updates: 'geeez', expecting: 'two nodes under updates'})
                    return db.ref('/').update(updates).then(() => {
                        // then 'complete' the room...
                        db.ref('templog2').push().set({event: 'completeRoom'})
                        twilio_telepatriot.completeRoom(event.data.val().RoomSid, function(stuff) {/*do anything?*/})
                    })
                })

            }
        }
        return twilio_telepatriot.getParticipants(event.data.val().RoomSid, callback)
    }

    else return false

})