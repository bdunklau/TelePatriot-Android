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
firebase deploy --only functions:onTwilioEvent,functions:testViewVideoEvents,functions:onConnectRequest,functions:onDisconnectRequest,functions:onStartRecordingRequest,functions:onStopRecordingRequest,functions:onRoomCreated,functions:onRevokeInvitation,functions:onRoomIdChange
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

    var token_attr = room_id.startsWith('record') ? 'twilio_token_record' : 'twilio_token'
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
                    // needed by doConnect in VidyoChatFragment and VideoChatVC
                    updates['video/list/'+video_node_key+'/video_participants/'+uid+'/'+token_attr] = token
                    return db.ref('/').update(updates)
                })
            }
            else {
                // room already exists. don't try to create again - that throws a js exception
                // needed by doConnect in VidyoChatFragment and VideoChatVC
                updates['video/list/'+video_node_key+'/video_participants/'+uid+'/'+token_attr] = token
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

        var updates = {}
        updates['video/video_events/'+event.params.key+'/date'] = date.asCentralTime()  // housekeeping: timestamp the event
        updates['video/video_events/'+event.params.key+'/date_ms'] = date.asMillis()

        // disconnect all(both) clients, then 'complete' the room
        // then create the recordable room
        // then connect all(both) clients to the recordable room
        return event.data.adminRef.root.child('video/list/'+event.data.val().video_node_key).once('value').then(snapshot => {
            var participants = snapshot.val().video_participants
            _.each(participants, function(p) {
                updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+p.uid+'/disconnect_date'] = date.asCentralTime()
                updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+p.uid+'/disconnect_date_ms'] = date.asMillis()
            })
            return event.data.adminRef.root.child('/').update(updates).then(() => {
                return event.data.adminRef.root.child('administration/hosts').orderByChild('type').equalTo('firebase functions').once('value').then(snapshot => {
                    var host
                    snapshot.forEach(function(child) {host = child.val().host})
                    twilio_telepatriot.completeRoom(event.data.val().RoomSid,               //  COMPLETE THE CURRENT ROOM....
                        function(stuff) {

                            var newroom_id = event.data.val().room_id
                            if(!newroom_id.startsWith('record'))
                                newroom_id = 'record'+newroom_id

                            twilio_telepatriot.createRoom2(newroom_id, host, function(morestuff) {    // CREATE THE NEW ROOM....

                                // update the video node to reflect recording has started
                                var up2 = {}
                                _.each(participants, function(p) {
                                    up2['video/list/'+event.data.val().video_node_key+'/video_participants/'+p.uid+'/connect_date'] = date.asCentralTime()
                                    up2['video/list/'+event.data.val().video_node_key+'/video_participants/'+p.uid+'/connect_date_ms'] = date.asMillis()
                                    up2['video/list/'+event.data.val().video_node_key+'/video_participants/'+p.uid+'/disconnect_date'] = null
                                    up2['video/list/'+event.data.val().video_node_key+'/video_participants/'+p.uid+'/disconnect_date_ms'] = null
                                })
                                up2['video/list/'+event.data.val().video_node_key+'/recording_started'] = date.asCentralTime()
                                up2['video/list/'+event.data.val().video_node_key+'/recording_started_ms'] = date.asMillis()
                                up2['video/list/'+event.data.val().video_node_key+'/recording_stopped'] = null
                                up2['video/list/'+event.data.val().video_node_key+'/recording_stopped_ms'] = null

                                // this attribute in particular gets picked up by the clients in their figureOutConnectivity() method
                                up2['video/list/'+event.data.val().video_node_key+'/room_id'] = newroom_id
                                up2['video/list/'+event.data.val().video_node_key+'/recording_completed'] = null // see also twilio-telepatriot.js:twilioCallback()
                                return event.data.adminRef.root.child('/').update(up2)

                            })
                        }
                    )
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

        var updates = {}
        updates['video/video_events/'+event.params.key+'/date'] = date.asCentralTime()  // housekeeping: timestamp the event
        updates['video/video_events/'+event.params.key+'/date_ms'] = date.asMillis()

        // disconnect all(both) clients, then 'complete' the room
        // then go back to the non-recordable room
        // then connect all(both) clients to the non-recordable room
        return event.data.adminRef.root.child('video/list/'+event.data.val().video_node_key).once('value').then(snapshot => {
            var participants = snapshot.val().video_participants
            _.each(participants, function(p) {
                updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+p.uid+'/disconnect_date'] = date.asCentralTime()
                updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+p.uid+'/disconnect_date_ms'] = date.asMillis()
            })
            return event.data.adminRef.root.child('/').update(updates).then(() => {
                return event.data.adminRef.root.child('administration/hosts').orderByChild('type').equalTo('firebase functions').once('value').then(snapshot => {
                    var host
                    snapshot.forEach(function(child) {host = child.val().host})
                    twilio_telepatriot.completeRoom(event.data.val().RoomSid,               //  COMPLETE THE CURRENT ROOM....
                        function(stuff) {

                            var newroom_id = event.data.val().room_id
                            if(newroom_id.startsWith('record'))
                                newroom_id = newroom_id.substring('record'.length)

                            twilio_telepatriot.createRoom2(newroom_id, host, function(morestuff) {    // CREATE THE NEW ROOM....

                                var up2 = {}
                                _.each(participants, function(p) {
                                    up2['video/list/'+event.data.val().video_node_key+'/video_participants/'+p.uid+'/connect_date'] = date.asCentralTime()
                                    up2['video/list/'+event.data.val().video_node_key+'/video_participants/'+p.uid+'/connect_date_ms'] = date.asMillis()
                                    up2['video/list/'+event.data.val().video_node_key+'/video_participants/'+p.uid+'/disconnect_date'] = null
                                    up2['video/list/'+event.data.val().video_node_key+'/video_participants/'+p.uid+'/disconnect_date_ms'] = null
                                })
                                // update the video node to reflect recording has started
                                up2['video/list/'+event.data.val().video_node_key+'/recording_stopped'] = date.asCentralTime()
                                up2['video/list/'+event.data.val().video_node_key+'/recording_stopped_ms'] = date.asMillis()

                                // this attribute in particular gets picked up by the clients in their figureOutConnectivity() method
                                up2['video/list/'+event.data.val().video_node_key+'/room_id'] = newroom_id
                                up2['video/list/'+event.data.val().video_node_key+'/recording_completed'] = true // see also twilio-telepatriot.js:twilioCallback()
                                return event.data.adminRef.root.child('/').update(up2)

                                // don't mess with the connect and disconnect date on the video_participants.  Those values make the mobile
                                // clients connect and disconnect to rooms.  But in the case of recordings, we have another way of making the disconnect/connect
                                // happen:  We update the room_id on the video node from something like "-Ldarkjfsiefk" to "record-Ldarkjfsiefk"
                                // The change in room_id value gets picked up in queryCurrentVideoNode() on the clients

                            })
                        }
                    )
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
// We delete the room_sid in twilioCallback:the "room-ended" else-if block
exports.onRoomCreated = functions.database.ref('video/video_events/{key}/StatusCallbackEvent').onWrite(event => {
    if(event.data.val() && event.data.val() == 'room-created') {
        return event.data.adminRef.root.child('video/video_events/'+event.params.key).once('value').then(snapshot => {
            var room_id = snapshot.val().RoomName
            var room_sid = snapshot.val().RoomSid
            var video_node_key = room_id.startsWith('record') ? room_id.substring('record'.length) : room_id
            return event.data.adminRef.root.child('video/list/'+video_node_key+'/room_sid').set(room_sid)
        })
    }
    else return false
})


// re-calc the twilio token when the room_id changes
exports.onRoomIdChange = functions.database.ref('video/list/{key}/room_id').onWrite(event => {
    // only care when room_id changes...
    if(event.data.val() && event.data.previous.val() && event.data.val() != event.data.previous.val()) {
        return event.data.adminRef.root.child('video/list/'+event.params.key+'/video_participants').once('value').then(snapshot => {

            // Need to keep 2 separate tokens - one for the recordable room, the other for the non-recordable room
            // Why?  Because of trigger timing.  Observed during stop recording that the user was disconnected from
            // the recordable room but there was never any "participant-connected" event back in the non-recordable
            // room.  The reason is most like because the token we tried to use was for the recordable room.
            // This trigger here hadn't updated the 'twilio_token' attribute by the time we needed it.  -what a hassle,
            // because this filters all the way down to the clients and they have to figure out in their doConnect()
            // methods: are they connecting to a recordable room or a non-recordable room
            var attr = event.data.val().startsWith('record') ? 'twilio_token_record' : 'twilio_token'
            var updates = {}
            snapshot.forEach(function(child) {
                var stuff = {name: child.val().name, room_id: event.data.val()}

                twilio_telepatriot.generateTwilioToken(stuff).then(token => {
                    var updates = {}
                    // needed by doConnect in VidyoChatFragment and VideoChatVC
                    updates['video/list/'+event.params.key+'/video_participants/'+child.val().uid+'/'+attr] = token
                    db.ref('/').update(updates)
                })
            })

        })
    }
    else
        return false
})
