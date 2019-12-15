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
//admin.initializeApp();
const db = admin.database()

/***
paste this on the command line...
firebase deploy --only functions:onTwilioEvent,functions:testViewVideoEvents,functions:onConnectRequest,functions:onDisconnectRequest,functions:onStartRecordingRequest,functions:onStopRecordingRequest,functions:onTwilioTokenRequest,functions:onRoomCreated,functions:onRevokeInvitation,functions:onRoomIdChange,functions:onTokenRequested,functions:onPublishRequested
***/

// When one person connects, connect the other person also.  It's one less thing we have to train people to do.
exports.onConnectRequest = functions.database.ref('video/video_events/{key}').onCreate((snapshot, context) => {
    var data = snapshot.val()
    if(!data.request_type) {
        console.log('onConnectRequest: return early because data.request_type = ', data.request_type)
        return false //ignore malformed
    }

    var params = context.params

    if(data.request_type != 'connect request') {
        console.log('onConnectRequest: return early because data.request_type is not "connect request". It is ', data.request_type)
        return false //ignore, not a connect request
    }

    console.log('onConnectRequest: video_event_key = ', params.key)
    console.log('onConnectRequest: video_event = ', data)
    return connect(params.key, data.video_node_key, data.uid, data.name, data.room_id, data.RoomSid)
})


// connects both participants
var connect = function(video_event_key, video_node_key, uid, name, room_id, RoomSid) {

    var stuff = {room_id: room_id,
                  video_node_key: video_node_key,
                  video_event_key: video_event_key}

    if(RoomSid) { // means we don't have to create the room, it's already created

        console.log('connect(): DO NOT CREATE ROOM because RoomSid = ', RoomSid)

        return db.ref('api_tokens').once('value').then(snap8 => {
            stuff.twilio_account_sid = snap8.val().twilio_account_sid
            stuff.twilio_api_key = snap8.val().twilio_api_key
            stuff.twilio_secret = snap8.val().twilio_secret

            return yy(stuff)

        }) // return db.ref('api_tokens').once('value').then(snap8
    }
    else {
        return db.ref('administration/hosts').orderByChild('type').equalTo('firebase functions').once('value').then(snapshot => {

            var host
            snapshot.forEach(function(child) { host = child.val().host })

            console.log('connect(): CREATE ROOM because RoomSid = ', RoomSid)

            return twilio_telepatriot.createRoom(room_id, host).then(roomResult => {
                stuff.twilio_account_sid = roomResult.twilio_account_sid
                stuff.twilio_api_key = roomResult.twilio_api_key
                stuff.twilio_secret = roomResult.twilio_secret

                return yy(stuff)
            })

        })
    }

}


var yy = function(stuff) {

    // we need to make sure the token is set first - and then set the connect_date/_ms attributes
    var token_attr = stuff.room_id.startsWith('record') ? 'twilio_token_record' : 'twilio_token'

    // get all participants, connect them all(both) whenever one connects
    return db.ref('video/list/'+stuff.video_node_key+'/video_participants').once('value').then(snap9 => {
        var identities = []
        snap9.forEach(function(child) {
            identities.push({name: child.val().name, uid: child.val().uid})
        })
        stuff.identities = identities

        var tokens = twilio_telepatriot.generateTwilioTokens(stuff)

        var updates = {}
        updates['video/video_events/'+stuff.video_event_key+'/date'] = date.asCentralTime()
        updates['video/video_events/'+stuff.video_event_key+'/date_ms'] = date.asMillis()
        _.each(tokens, function(tokenData) {
            updates['video/list/'+stuff.video_node_key+'/video_participants/'+tokenData.uid+'/'+token_attr] = tokenData.token
            updates['video/list/'+stuff.video_node_key+'/video_participants/'+tokenData.uid+'/connect_date'] = date.asCentralTime()
            updates['video/list/'+stuff.video_node_key+'/video_participants/'+tokenData.uid+'/connect_date_ms'] = date.asMillis()
            updates['video/list/'+stuff.video_node_key+'/video_participants/'+tokenData.uid+'/disconnect_date'] = null
            updates['video/list/'+stuff.video_node_key+'/video_participants/'+tokenData.uid+'/disconnect_date_ms'] = null
        })
        // these updates will trigger doConnect in VidyoChatFragment and VideoChatVC
        return db.ref('/').update(updates)
    })
}


/***************
"start recording" = disconnect from the current twilio room (that doesn't have recording enabled) and connect
to a room that DOES have recording enabled.

NOTE: You can't reuse the connect() / disconnect() functions because they rely on triggers to disconnect
all the participants and 'complete' the current room.  When recording, we HAVE to make sure that the everyone
is out of the pre-interview room before we 'complete' it.  If you tried to reuse connect() and disconnect(), we
would end up 'complete'-ing both the pre-interview room AND the recorded interview room.  <-- This is based
on observations I made of the video/video_events table.  I actually saw both rooms closed one right on top of
the other.
***************/
exports.onStartRecordingRequest = functions.database.ref('video/video_events/{key}').onCreate((snapshot2, context) => {
    var data = snapshot2.val()
    if(data.request_type && data.request_type == "start recording") {
        var params = context.params
        var updates = {}
        updates['video/video_events/'+params.key+'/date'] = date.asCentralTime()  // housekeeping: timestamp the event
        updates['video/video_events/'+params.key+'/date_ms'] = date.asMillis()

        // disconnect all(both) clients, then 'complete' the room
        // then create the recordable room
        // then connect all(both) clients to the recordable room
        return db.ref().child('video/list/'+data.video_node_key).once('value').then(snapshot => {
            var participants = snapshot.val().video_participants
            _.each(participants, function(p) {
                updates['video/list/'+data.video_node_key+'/video_participants/'+p.uid+'/disconnect_date'] = date.asCentralTime()
                updates['video/list/'+data.video_node_key+'/video_participants/'+p.uid+'/disconnect_date_ms'] = date.asMillis()
            })
            // clear out any info from a
            return db.ref().update(updates).then(() => {
                return db.ref().child('administration/hosts').orderByChild('type').equalTo('firebase functions').once('value').then(snapshot => {
                    var host
                    snapshot.forEach(function(child) {host = child.val().host})
                    twilio_telepatriot.completeRoom(data.RoomSid,               //  COMPLETE THE CURRENT ROOM....
                        function(stuff) {

                            var newroom_id = data.room_id
                            if(!newroom_id.startsWith('record'))
                                newroom_id = 'record'+newroom_id

                            twilio_telepatriot.createRoom2(newroom_id, host, function(morestuff) {    // CREATE THE NEW ROOM....

                                // update the video node to reflect recording has started
                                var up2 = {}
                                _.each(participants, function(p) {
                                    up2['video/list/'+data.video_node_key+'/video_participants/'+p.uid+'/connect_date'] = date.asCentralTime()
                                    up2['video/list/'+data.video_node_key+'/video_participants/'+p.uid+'/connect_date_ms'] = date.asMillis()
                                    up2['video/list/'+data.video_node_key+'/video_participants/'+p.uid+'/disconnect_date'] = null
                                    up2['video/list/'+data.video_node_key+'/video_participants/'+p.uid+'/disconnect_date_ms'] = null
                                })
                                up2['video/list/'+data.video_node_key+'/CompositionSid'] = null
                                up2['video/list/'+data.video_node_key+'/CompositionUri'] = null
                                up2['video/list/'+data.video_node_key+'/composition_PercentageDone'] = null
                                up2['video/list/'+data.video_node_key+'/composition_SecondsRemaining'] = null
                                up2['video/list/'+data.video_node_key+'/composition_Size'] = null
                                up2['video/list/'+data.video_node_key+'/composition_MediaUri'] = null

                                up2['video/list/'+data.video_node_key+'/publishing_completed'] = null
                                up2['video/list/'+data.video_node_key+'/publishing_started'] = null
                                up2['video/list/'+data.video_node_key+'/publishing_started_ms'] = null
                                up2['video/list/'+data.video_node_key+'/publishing_stopped'] = null
                                up2['video/list/'+data.video_node_key+'/publishing_stopped_ms'] = null

                                up2['video/list/'+data.video_node_key+'/recording_completed'] = null // see also twilio-telepatriot.js:twilioCallback()
                                up2['video/list/'+data.video_node_key+'/recording_started'] = date.asCentralTime()
                                up2['video/list/'+data.video_node_key+'/recording_started_ms'] = date.asMillis()
                                up2['video/list/'+data.video_node_key+'/recording_stopped'] = null
                                up2['video/list/'+data.video_node_key+'/recording_stopped_ms'] = null

                                // this attribute in particular gets picked up by the clients in their figureOutConnectivity() method
                                up2['video/list/'+data.video_node_key+'/room_id'] = newroom_id
                                return db.ref().update(up2)

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
exports.onStopRecordingRequest = functions.database.ref('video/video_events/{key}').onCreate((snapshot2, context) => {
    var data = snapshot2.val()
    if(data.request_type && data.request_type == "stop recording") {
        var params = context.params
        var updates = {}
        updates['video/video_events/'+params.key+'/date'] = date.asCentralTime()  // housekeeping: timestamp the event
        updates['video/video_events/'+params.key+'/date_ms'] = date.asMillis()

        // disconnect all(both) clients, then 'complete' the room
        // then go back to the non-recordable room
        // then connect all(both) clients to the non-recordable room
        return db.ref().child('video/list/'+data.video_node_key).once('value').then(snapshot => {
            var participants = snapshot.val().video_participants
            _.each(participants, function(p) {
                updates['video/list/'+data.video_node_key+'/video_participants/'+p.uid+'/disconnect_date'] = date.asCentralTime()
                updates['video/list/'+data.video_node_key+'/video_participants/'+p.uid+'/disconnect_date_ms'] = date.asMillis()
            })
            return db.ref().update(updates).then(() => {
                return db.ref().child('administration/hosts').orderByChild('type').equalTo('firebase functions').once('value').then(snapshot => {
                    var host
                    snapshot.forEach(function(child) {host = child.val().host})
                    twilio_telepatriot.completeRoom(data.RoomSid,               //  COMPLETE THE CURRENT ROOM....
                        function(stuff) {

                            var newroom_id = data.room_id
                            if(newroom_id.startsWith('record'))
                                newroom_id = newroom_id.substring('record'.length)

                            twilio_telepatriot.createRoom2(newroom_id, host, function(morestuff) {    // CREATE THE NEW ROOM....

                                var up2 = {}
                                _.each(participants, function(p) {
                                    up2['video/list/'+data.video_node_key+'/video_participants/'+p.uid+'/connect_date'] = date.asCentralTime()
                                    up2['video/list/'+data.video_node_key+'/video_participants/'+p.uid+'/connect_date_ms'] = date.asMillis()
                                    up2['video/list/'+data.video_node_key+'/video_participants/'+p.uid+'/disconnect_date'] = null
                                    up2['video/list/'+data.video_node_key+'/video_participants/'+p.uid+'/disconnect_date_ms'] = null
                                })
                                // update the video node to reflect recording has stopped
                                up2['video/list/'+data.video_node_key+'/recording_stopped'] = date.asCentralTime()
                                up2['video/list/'+data.video_node_key+'/recording_stopped_ms'] = date.asMillis()

                                // this attribute in particular gets picked up by the clients in their figureOutConnectivity() method
                                up2['video/list/'+data.video_node_key+'/room_id'] = newroom_id
                                up2['video/list/'+data.video_node_key+'/recording_completed'] = true // see also twilio-telepatriot.js:twilioCallback()
                                return db.ref().update(up2)

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



// created for TelePatriot-Web
exports.onTwilioTokenRequest = functions.database.ref('video/video_events/{key}').onCreate((snapshot, context) => {
    var data = snapshot.val()
    if(!data.request_type) {
        console.log('onTwilioTokenRequest: return early because data.request_type = ', data.request_type)
        return false //ignore malformed
    }

    if(data.request_type != 'twilio token request') {
        console.log('onTwilioTokenRequest: return early because data.request_type is not "twilio token request". It is ', data.request_type)
        return false //ignore, not a "twilio token request"
    }

    var stuff = {name: snapshot.val().name}
    if(snapshot.val().room_name) {
        stuff['room_id'] = snapshot.val().room_name
    }

    return twilio_telepatriot.generateTwilioToken(stuff).then(token => {
        return db.ref('video/tokens').push().set({name:stuff.name, room_name:snapshot.val().room_name, token: token, date: date.asCentralTime(), date_ms: snapshot.val().date_ms})
    })
})


// TODO soon we'll decouple the composition from the publishing because we now capture the details of the composed media file
// in twilio-telepatriot.js:twilioCallback "composition-available" block
// TODO make VideoEvent pass in composition_MediaUri if it's available
exports.onPublishRequested = functions.database.ref('video/video_events/{key}').onCreate((snapshot2, context) => {
    var data = snapshot2.val()
    if(data.request_type && data.request_type == "start publishing") {

        // housekeeping: timestamp the event and clear out "ready_to_send_emails" because onReadyToSendEmails()
        // only fires when ready_to_send_emails is created
        var upd = {}
        upd['video/video_events/date'] = date.asCentralTime()
        upd['video/video_events/date_ms'] = date.asMillis()
        upd['video/list/'+data.video_node_key+'/ready_to_send_emails'] = null
        db.ref().update(upd)

        return db.ref().child('administration/hosts').once('value').then(snapshot => {
            var vmHost
            var vmPort
            var firebaseServer

            snapshot.forEach(function(child) {
                if(child.val().type == 'virtual machine') {
                    vmHost = child.val().host
                    vmPort = child.val().port
                } else if(child.val().type == 'firebase functions') {
                    firebaseServer = child.val().host
                }
            })

            // means the composed file has already been created
            if(data.MediaUri) {
                console.log('PUBLISHING A MEDIA FILE THAT HAS ALREADY BEEN COMPOSED :)')
                return db.ref().child('video/list/'+data.video_node_key).once('value').then(snap4 => {

                    return db.ref().child('api_tokens').once('value').then(snap2 => {
                        var formData = {
                           twilio_account_sid: snap2.val().twilio_account_sid,
                           twilio_auth_token: snap2.val().twilio_auth_token,
                           domain: 'video.twilio.com',
                           MediaUri: data.MediaUri,
                           CompositionSid: snap4.val().CompositionSid,
                           Ttl: 3600,
                           firebaseServer: firebaseServer,
                           firebaseUri: '/twilioCallback',
                           video_title: snap4.val().video_title,
                           youtube_video_description: snap4.val().youtube_video_description,
                           keywords: 'Convention of States Project',
                           privacyStatus: 'unlisted',
                           video_node_key: data.video_node_key,
                           uid: data.uid
                        };
                        twilio_telepatriot.publish({host: vmHost, port: vmPort, formData: formData})
                    })
                })
            }
            // means we have to compose the file first and then publish
            else {

                var callback = function(stuff) { /*
                    Not sure what to do here if anything
                    See twilio-telepatriot.js:testCompose() and compose()
                */ }

                return twilio_telepatriot.compose({
                    room_sid: data.RoomSid, // In the VideoNode class, this is actuall room_sid_record
                    host: firebaseServer,
                    callback: callback
                })

            }

        })

    }
    else return false
})


exports.onRevokeInvitation = functions.database.ref('video/video_events/{key}').onCreate((snapshot2, context) => {
    var data = snapshot2.val()
    if(data.request_type && data.request_type == "revoke invitation") {
        var updates = {}
        var guest_id = data.video_invitation_key.substring(data.video_invitation_key.indexOf('guest')+'guest'.length)
        updates['video/list/'+data.video_node_key+'/video_invitation_key'] = null
        updates['video/list/'+data.video_node_key+'/video_participants/'+guest_id] = null
        updates['video/list/'+data.video_node_key+'/video_invitation_extended_to'] = null
        updates['video/invitations/'+data.video_invitation_key] = null
        updates['users/'+guest_id+'/current_video_node_key'] = null
        return db.ref().update(updates)
    }
    else return false
})



exports.onDisconnectRequest = functions.database.ref('video/video_events/{key}').onCreate((snapshot2, context) => {
    var data = snapshot2.val()
    if(!data.request_type) return false //ignore malformed
    if(data.request_type != 'disconnect request') return false //ignore, not a connect request
    var params = context.params
    return disconnect(db.ref(), params.key, data.video_node_key, data.uid, data.room_id)
})

/**
Something here triggers the video title, video description and email nodes to be re-evaluated
That's not what I want.
What's doing that?

We know that email.js: evaluate_video_and_email() is called by ==============================================
email.js:        onReadyToSendEmails()
video-list.js:    testReevaluateEmailAttributes()  (http function)
google-cloud.js:  onLegislatorChosen()  (db trigger)
                  onParticipantAdded()  (db trigger)  THE CULPRIT - BUT WHY?
                  onParticipantRemoved()(db trigger)
**/
var disconnect = function(adminRef, video_event_key, video_node_key, uid, room_id) {
    var updates = {}
    updates['video/video_events/'+video_event_key+'/date'] = date.asCentralTime()
    updates['video/video_events/'+video_event_key+'/date_ms'] = date.asMillis()
    //    clear out the room_sid on disconnect because room_sid represents an active twilio room
    updates['video/list/'+video_node_key+'/room_sid'] = null



    // first, query for all video_participants under the video_node_key.  We will disconnect them all right here
    return adminRef.child('video/list/'+video_node_key).once('value').then(snapshot => {
        var wasRecording = snapshot.val().recording_started && !snapshot.val().recording_stopped
        if(wasRecording) {
            // Also need to figure out if we were recording so we can stop the recording...

            var newroom_id = room_id
            if(newroom_id.startsWith('record'))
                newroom_id = newroom_id.substring('record'.length)

            // update the video node to reflect recording has stopped
            updates['video/list/'+video_node_key+'/recording_stopped'] = date.asCentralTime()
            updates['video/list/'+video_node_key+'/recording_stopped_ms'] = date.asMillis()

            // this attribute in particular gets picked up by the clients in their figureOutConnectivity() method
            updates['video/list/'+video_node_key+'/room_id'] = newroom_id
            updates['video/list/'+video_node_key+'/recording_completed'] = true // see also twilio-telepatriot.js:twilioCallback()

        }

        _.each(snapshot.val().video_participants, function(child) {
            // child.key not available in this case because we're working with snapshot.val()
            updates['video/list/'+video_node_key+'/video_participants/'+child.uid+'/disconnect_date'] = date.asCentralTime()
            updates['video/list/'+video_node_key+'/video_participants/'+child.uid+'/disconnect_date_ms'] = date.asMillis()
        })

        var room_sid = snapshot.val().room_sid

        // the mobile client will detect 'disconnect_date' which causes the client to actually disconnect from the room
        return adminRef.update(updates).then(() => {
            // now 'complete' the room...
            twilio_telepatriot.completeRoom(room_sid, function(stuff) {/*do anything?*/})
            // return the participants because onStartRecording needs them so that function can automatically
            // connect them all the recording room
            return snapshot.val().video_participants
        })
    })

}


exports.onTwilioEvent = functions.database.ref('video/video_events/{key}').onCreate((snapshot2, context) => {
    if(!snapshot2.val().StatusCallbackEvent)
        return false //ignore malformed
    var params = context.params
    var updates = {}
    updates['video/video_events/'+params.key+'/date'] = date.asCentralTime()
    updates['video/video_events/'+params.key+'/date_ms'] = date.asMillis()
    return db.ref().update(updates)
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
exports.onRoomCreated = functions.database.ref('video/video_events/{key}/StatusCallbackEvent').onWrite((change, context) => {
    if(change.after.val() && change.after.val() == 'room-created') {
        var params = context.params
        return db.ref().child('video/video_events/'+params.key).once('value').then(snapshot => {
            var room_id = snapshot.val().RoomName
            var room_sid = snapshot.val().RoomSid
            var video_node_key = room_id.startsWith('record') ? room_id.substring('record'.length) : room_id
            return db.ref().child('video/list/'+video_node_key+'/room_sid').set(room_sid)
        })
    }
    else return false
})


// re-calc the twilio token when the room_id changes
exports.onRoomIdChange = functions.database.ref('video/list/{key}/room_id').onWrite((change, context) => {
    // only care when room_id changes...
    if(change.after.val() && change.before.val() && change.after.val() != change.before.val()) {
        var params = context.params
        return db.ref().child('video/list/'+params.key+'/video_participants').once('value').then(snapshot => {

            // Need to keep 2 separate tokens - one for the recordable room, the other for the non-recordable room
            // Why?  Because of trigger timing.  Observed during stop recording that the user was disconnected from
            // the recordable room but there was never any "participant-connected" event back in the non-recordable
            // room.  The reason is most like because the token we tried to use was for the recordable room.
            // This trigger here hadn't updated the 'twilio_token' attribute by the time we needed it.  -what a hassle,
            // because this filters all the way down to the clients and they have to figure out in their doConnect()
            // methods: are they connecting to a recordable room or a non-recordable room
            var attr = change.after.val().startsWith('record') ? 'twilio_token_record' : 'twilio_token'
            var updates = {}
            snapshot.forEach(function(child) {

                // we put this attribute on each participant because this is really the only way to generate
                // several twilio tokens.  This attribute causes another trigger to fire - onTokenRequested (below)
                child.ref.update({token_requested: {token_name: attr, room_id: change.after.val(), name: child.val().name}})

            })

        })
    }
    else
        return false
})


// triggered by onRoomIdChange()
exports.onTokenRequested = functions.database.ref('video/list/{key}/video_participants/{uid}/token_requested').onCreate((snapshot, context) => {

    var stuff = {room_id: snapshot.val().room_id,
                 name: snapshot.val().name}

    var params = context.params

    return twilio_telepatriot.generateTwilioToken(stuff).then(token => {
        var updates = {}
        // needed by doConnect in VidyoChatFragment and VideoChatVC
        updates['video/list/'+params.key+'/video_participants/'+params.uid+'/'+snapshot.val().token_name] = token
        // erase the request now that it's been fulfilled
        updates['video/list/'+params.key+'/video_participants/'+params.uid+'/token_requested'] = null
        return db.ref('/').update(updates)
    })
})
