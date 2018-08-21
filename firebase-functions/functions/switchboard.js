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
firebase deploy --only functions:onTwilioEvent,functions:testViewVideoEvents,functions:onConnectRequest,functions:onDisconnectRequest,functions:onStartRecordingRequest,functions:onStopRecordingRequest,functions:onRoomCreated,functions:onRevokeInvitation
***/

exports.onConnectRequest = functions.database.ref('video/video_events/{key}').onCreate(event => {
    if(!event.data.val().request_type)
        return false //ignore malformed

    if(event.data.val().request_type != 'connect request') return false //ignore, not a connect request

    return connect(event.params.key, event.data.val().video_node_key, event.data.val().uid, event.data.val().name, event.data.val().room_id, event.data.val().RoomSid)
})

var connect = function(video_event_key, video_node_key, uid, name, room_id, RoomSid) {
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

            if(!RoomSid) {
                return twilio_telepatriot.createRoom(room_id, host).then(() => {
                    updates['video/list/'+video_node_key+'/video_participants/'+uid+'/twilio_token'] = token
                    return db.ref('/').update(updates)
                })
            }
            else {
                // room already exists. don't try to create again - that throws a js exception
                updates['video/list/'+video_node_key+'/video_participants/'+uid+'/twilio_token'] = token
                return db.ref('/').update(updates)
            }

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

        return disconnect(event.data.adminRef, event.params.key, event.data.val().video_node_key, event.data.val().uid, event.data.val().room_id).then(participants => {
            var newroom_id = event.data.val().room_id
            if(!newroom_id.startsWith('record'))
                newroom_id = 'record'+newroom_id
            return event.data.adminRef.root.child('video/list/'+event.data.val().video_node_key+'/room_id').set(newroom_id).then(() => {

                // connecting is a little different in this case, because we will automatically connect the participants...

                var updates = {}
                updates['video/video_events/'+event.params.key+'/date'] = date.asCentralTime()
                updates['video/video_events/'+event.params.key+'/date_ms'] = date.asMillis()
                updates['video/list/'+event.data.val().video_node_key+'/recording_started'] = date.asCentralTime()
                updates['video/list/'+event.data.val().video_node_key+'/recording_started_ms'] = date.asMillis()
                updates['video/list/'+event.data.val().video_node_key+'/recording_stopped'] = null
                updates['video/list/'+event.data.val().video_node_key+'/recording_stopped_ms'] = null
                updates['video/list/'+event.data.val().video_node_key+'/recording_completed'] = null // see also twilio-telepatriot.js:twilioCallback()
                _.each(participants, function(participant) {
                    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+participant.uid+'/connect_date'] = date.asCentralTime()
                    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+participant.uid+'/connect_date_ms'] = date.asMillis()
                    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+participant.uid+'/disconnect_date'] = null
                    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+participant.uid+'/disconnect_date_ms'] = null
                })


                var stuff = {name: event.data.val().name,
                            room_id: newroom_id}

                return twilio_telepatriot.generateTwilioToken(stuff).then(token => {
                    return db.ref('administration/hosts').orderByChild('type').equalTo('firebase functions').once('value').then(snapshot => {
                        var host
                        snapshot.forEach(function(child) { // should only be one child
                            host = child.val().host
                        })
                        return twilio_telepatriot.createRoom(stuff.room_id, host).then(() => {
                            _.each(participants, function(participant) {
                                updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+participant.uid+'/twilio_token'] = token
                            })
                            return db.ref('/').update(updates)
                        })

                    })
                })

            })
        })

    }

    else return false
})


// "stop recording" = disconnect all participants from the current room and RE-connect them
// to the room they were in before the recording started.
exports.onStopRecordingRequest = functions.database.ref('video/video_events/{key}').onCreate(event => {
    if(event.data.val().request_type && event.data.val().request_type == "stop recording") {

        return disconnect(event.data.adminRef, event.params.key, event.data.val().video_node_key, event.data.val().uid, event.data.val().room_id).then(participants => {

            var newroom_id = event.data.val().room_id.substring('record'.length)

            return event.data.adminRef.root.child('video/list/'+event.data.val().video_node_key+'/room_id').set(newroom_id).then(() => {
                // connecting is a little different in this case, because we will automatically connect the participants...

                var updates = {}
                updates['video/video_events/'+event.params.key+'/date'] = date.asCentralTime()
                updates['video/video_events/'+event.params.key+'/date_ms'] = date.asMillis()
                updates['video/list/'+event.data.val().video_node_key+'/recording_stopped'] = date.asCentralTime()
                updates['video/list/'+event.data.val().video_node_key+'/recording_stopped_ms'] = date.asMillis()
                _.each(participants, function(participant) {
                    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+participant.uid+'/connect_date'] = date.asCentralTime()
                    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+participant.uid+'/connect_date_ms'] = date.asMillis()
                    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+participant.uid+'/disconnect_date'] = null
                    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+participant.uid+'/disconnect_date_ms'] = null
                })

                var stuff = {name: event.data.val().name,
                            room_id: newroom_id}

                return twilio_telepatriot.generateTwilioToken(stuff).then(token => {
                    return db.ref('administration/hosts').orderByChild('type').equalTo('firebase functions').once('value').then(snapshot => {
                        var host
                        snapshot.forEach(function(child) { // should only be one child
                            host = child.val().host
                        })
                        return twilio_telepatriot.createRoom(stuff.room_id, host).then(() => {
                            _.each(participants, function(participant) {
                                updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+participant.uid+'/twilio_token'] = token
                            })
                            return db.ref('/').update(updates)
                        })

                    })
                })

            })
        })

    }

    else return false
})


exports.onRevokeInvitation = functions.database.ref('video/video_events/{key}').onCreate(event => {
    if(event.data.val().request_type && event.data.val().request_type == "revoke invitation") {
        var updates = {}
        var guest_id = event.data.val().video_invitation_key.substring(event.data.val().video_invitation_key.indexOf('guest')+'guest'.length)
        updates['video/list/'+event.data.val().video_node_key+'/video_invitation_key'] = null
        updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+guest_id] = null
        updates['video/list/'+event.data.val().video_node_key+'/video_invitation_extended_to'] = null
        updates['video/invitations/'+event.data.val().video_invitation_key] = null
        updates['users/'+guest_id+'/current_video_node_key'] = null
        return event.data.adminRef.root.child('/').update(updates)
    }
    else return false
})



exports.onDisconnectRequest = functions.database.ref('video/video_events/{key}').onCreate(event => {
    if(!event.data.val().request_type) return false //ignore malformed
    if(event.data.val().request_type != 'disconnect request') return false //ignore, not a connect request
    return disconnect(event.data.adminRef, event.params.key, event.data.val().video_node_key, event.data.val().uid, event.data.val().room_id)
})

var disconnect = function(adminRef, video_event_key, video_node_key, uid, room_id) {
    var updates = {}
    updates['video/video_events/'+video_event_key+'/date'] = date.asCentralTime()
    updates['video/video_events/'+video_event_key+'/date_ms'] = date.asMillis()

    // first, query for all video_participants under the video_node_key.  We will disconnect them all right here
    return adminRef.root.child('video/list/'+video_node_key).once('value').then(snapshot => {
        _.each(snapshot.val().video_participants, function(child) {
            // child.key not available in this case because we're working with snapshot.val()
            updates['video/list/'+video_node_key+'/video_participants/'+child.uid+'/disconnect_date'] = date.asCentralTime()
            updates['video/list/'+video_node_key+'/video_participants/'+child.uid+'/disconnect_date_ms'] = date.asMillis()
        })
        // the mobile client will detect 'disconnect_date' which causes the client to actually disconnect from the room
        return adminRef.root.child('/').update(updates).then(() => {
            // now 'complete' the room...
            twilio_telepatriot.completeRoom(snapshot.val().room_sid, function(stuff) {/*do anything?*/})
            // return the participants because onStartRecording needs them so that function can automatically
            // connect them all the recording room
            return snapshot.val().video_participants
        })
    })

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


// WHENEVER A TWILIO ROOM IS CREATED, We have to associate our room_id with twilio's room_sid so that
// when we need to 'complete' the room later, we will be able to look up the room_sid having only the room_id available
exports.onRoomCreated = functions.database.ref('video/video_events/{key}/StatusCallbackEvent').onWrite(event => {
    if(event.data.val() && event.data.val() == 'room-created') {
        return event.data.adminRef.root.child('video/video_events/'+event.params.key).once('value').then(snapshot => {
            var room_id = snapshot.val().RoomName
            var room_sid = snapshot.val().RoomSid
            return event.data.adminRef.root.child('video/list').orderByChild('room_id').equalTo(room_id).once('value').then(snap2 => {
                var video_node_key
                snap2.forEach(function(child) { video_node_key = child.key })
                return snap2.child(video_node_key).child('room_sid').ref.set(room_sid)
            })
        })
    }
    else return false
})
