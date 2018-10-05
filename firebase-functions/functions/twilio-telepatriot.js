'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const AccessToken = require('twilio').jwt.AccessToken
const VideoGrant = AccessToken.VideoGrant
const twilio = require('twilio')
const request = require('request')

var style = "font-family:Arial;font-size:12px"
var tableheading = style + ';background-color:#ededed'


// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


/****
deploy everything in this file...
firebase deploy --only functions:twilioCallback,functions:testTwilioToken,functions:testRetrieveRoom,functions:testCompleteRoom,functions:testListParticipants,functions:testListRooms,functions:testCreateRoom,functions:testCompose
****/


// This http function is also called from the google vm we have in the ComputeEngine
// SSH in to the vm and vi ~/nodejs/index.js.  Then look at the app.get('/publish')
exports.twilioCallback = functions.https.onRequest((req, res) => {

    // ref:  https://www.twilio.com/docs/api/video/status-callbacks
    // see also switchboard.js:testViewVideoEvents()
    return db.ref('video/video_events').push().set(req.body).then(snapshot => {
        // this sucks: twilio does not pass RoomName on 'composition-progress' events. But it does on 'recording-xxxxx' events
        if(req.body.RoomName && req.body.RoomSid && req.body.StatusCallbackEvent && req.body.StatusCallbackEvent == 'recording-started') {
            // once we start recording, write the RoomSid to video/list/{video_node_key}/room_sid_record so that we can query
            // on this attribute during 'composition-progress' and 'composition-available' callbacks (below)
            var video_node_key = req.body.RoomName.substring('record'.length)
            return db.ref('video/list/'+video_node_key+'/room_sid_record').set(req.body.RoomSid).then(() => {
                return res.status(200).send('OK')
            })
        }
        else if(req.body.RoomName && req.body.RoomSid && req.body.StatusCallbackEvent && req.body.StatusCallbackEvent == 'recording-completed') {
            // write recording_completed to the video node.  This attribute is how we know when to display the publish_button
            return db.ref('video/list').orderByChild('room_sid_record').equalTo(req.body.RoomSid).once('value').then(snap2 => {
                var video_node_key
                snap2.forEach(function(child) { video_node_key = child.key })
                return snap2.child(video_node_key+'/recording_completed').ref.set(true)
            })
        }
        // Null out the room_sid on the video node to denote that there is no active twilio video room at the moment
        // room_sid is set in onRoomCreated()
        // But we'll have room-ended events when we transition between recordable and non-recordable rooms
        // Is there a chance that we'll null out the wrong room_sid value ?
//        else if(req.body.RoomSid && req.body.StatusCallbackEvent && req.body.StatusCallbackEvent == 'room-ended') {
//            // when a room is completed/finished, update the video node...
//            var video_node_key = req.body.RoomName
//            if(video_node_key.startsWith('record')) video_node_key = video_node_key.substring('record'.length)
//            var updates = {}
//            updates['room_sid'] = null // but leave room_sid_record alone
//            return db.ref('video/list/'+video_node_key).update(updates)
//        }
        else if(req.body.RoomSid
                && req.body.PercentageDone
                && req.body.SecondsRemaining
                && req.body.StatusCallbackEvent
                && req.body.StatusCallbackEvent == 'composition-progress') {

            // look up video_node_key using RoomSid, then update the following attributes on the video node
            return db.ref('video/list').orderByChild('room_sid_record').equalTo(req.body.RoomSid).once('value').then(snap2 => {
                // will only ever return a 1-element list
                var video_node_key
                snap2.forEach(function(child) { video_node_key = child.key })

                var updates = {}
                updates['video/list/'+video_node_key+'/composition_PercentageDone'] = parseInt(req.body.PercentageDone)
                updates['video/list/'+video_node_key+'/composition_SecondsRemaining'] = parseInt(req.body.SecondsRemaining)

                return db.ref('/').update(updates).then(() => {
                    return res.status(200).send('OK')
                })
            })
        }
        // This is when the composition media file has been completed and it's ready to view/download
        else if(req.body.RoomSid && req.body.StatusCallbackEvent && req.body.StatusCallbackEvent == 'composition-available') {
            // WARNING: I've seen this event NOT get called - so we need a plan B.  Can't just rely on this callback

            // "clean up" PercentageDone and SecondsRemaining values...

            return db.ref('api_tokens').once('value').then(snapshot => {

                // call the virtual machine and give it all the information it needs to download the media file from twilio
                return db.ref('administration/hosts').once('value').then(snap2 => {
                    var host
                    var port
                    var firebaseServer // we'll just make another else-if block to handle callbacks from the vm
                    snap2.forEach(function(child) {
                        if(child.val().type == 'virtual machine') {
                            host = child.val().host
                            port = child.val().port
                        }
                        else if(child.val().type == 'firebase functions') {
                            firebaseServer = child.val().host
                        }
                    })

                    // need this query to get the video_node_key, the Youtube video title and youtube video description
                    return db.ref('video/list').orderByChild('room_sid_record').equalTo(req.body.RoomSid).once('value').then(snap3 => {
                        var title
                        var video_description
                        var video_node_key
                        var uid
                        snap3.forEach(function(child) {
                            video_node_key = child.key
                            title = child.val().video_title
                            video_description = child.val().youtube_video_description
                            // take the participant with the highest value of start_date_ms
                            var uids = Object.keys(child.val().video_participants)
                            var max_date = 0
                            for(var i=0; i < uids.length; i++) {
                                var participant = child.val().video_participants[uids[i]]
                                if(max_date < participant.start_date_ms) {
                                    max_date = participant.start_date_ms
                                    uid = participant.uid
                                }
                            }

                            db.ref('video/invitations/'+child.val().video_invitation_key).remove()

                            // capture the details on the composition.  If we need to re-upload, having
                            // this info means we won't have to re-compose the file
                            child.ref.update({composition_PercentageDone: 100,
                                              composition_SecondsRemaining: 0,
                                              CompositionSid: req.body.CompositionSid,
                                              CompositionUri: req.body.CompositionUri,
                                              composition_Size: parseInt(req.body.Size), // Number.MAX_SAFE_INTEGER = 9007199254740992  so we're safe
                                              composition_MediaUri: req.body.MediaUri,
                                              publishing_completed: true,
                                              publishing_stopped: date.asCentralTime(),
                                              publishing_stopped_ms: date.asMillis(),
                                              })
                        })

                        var formData = {
                           twilio_account_sid: snapshot.val().twilio_account_sid,
                           twilio_auth_token: snapshot.val().twilio_auth_token,
                           domain: 'video.twilio.com',
                           MediaUri: req.body.CompositionUri+'/Media',
                           CompositionSid: req.body.CompositionSid,
                           Ttl: 6000,
                           firebaseServer: firebaseServer,
                           firebaseUri: '/twilioCallback',
                           video_title: title,
                           youtube_video_description: video_description,
                           keywords: 'Convention of States Project',
                           privacyStatus: 'unlisted',
                           video_node_key: video_node_key,
                           uid: uid
                        };

                        exports.publish({host: host, port: port, formData: formData})

                    })
                })
            })
        }
        else return res.status(200).send('OK')
    })

})


// called from above and also from switchboard.js
exports.publish = function(input) {
    var host = input.host
    var port = input.port
    var formData = input.formData


    // go see ~/nodejs/index.js and the app.get('/publish') route
    var vmUrl = 'http://'+host+':'+port+'/publish'
    request.post(
        {
            url: vmUrl,
            form: formData
        },
        function (err, httpResponse, body) {
            console.log(err, body);
            if(err) {
                db.ref('templog2').set({date: date.asCentralTime(),
                                        error: err,
                                        formData: formData,
                                        url: vmUrl})
            }
        }
    );
}


exports.testTwilioToken = functions.https.onRequest((req, res) => {

    var stuff = {name:'testuser',
                room:'cool room'}

    return exports.generateTwilioToken(stuff).then(token => {
        res.status(200).send('Twilio token: <P/>'+token)
    })

})


exports.testRetrieveRoom = functions.https.onRequest((req, res) => {
    if(!req.query.room_sid)
        return res.status(200).send('Required:  room_sid request parameter')

    var showRoom = function(stuff) {
        //return res.status(200).send(roomDetails(room, twilio_account_sid, twilio_auth_token))
        return res.status(200).send(roomDetails(stuff))
    }
    var stuff = {room_sid: req.query.room_sid, host: req.get('host'), callback: showRoom}
    return retrieveRoom(stuff)
    //return retrieveRoom(req.query.room_sid, req.get('host'), showRoom)
})


exports.testCompleteRoom = functions.https.onRequest((req, res) => {
    if(!req.query.room_sid)
        return res.status(200).send('Required:  room_sid request parameter')

    var showRoom = function(stuff) {
        //return res.status(200).send(roomDetails(room, twilio_account_sid, twilio_auth_token))
        return res.status(200).send(roomDetails(stuff))
    }
    return exports.completeRoom(req.query.room_sid, showRoom)
})


exports.testListParticipants = functions.https.onRequest((req, res) => {
    if(!req.query.room_sid)
        return res.status(200).send('Required:  room_sid request parameter')

    var callback = function(totals) {
        return res.status(200).send('total: '+totals.total+'<P/>connected: '+totals.connected)
    }
    return exports.getParticipants(req.query.room_sid, callback)
})


exports.getParticipants = function(room_sid, callback) {
    return db.ref('api_tokens').once('value').then(snapshot => {

        var url = 'https://'+snapshot.val().twilio_account_sid+':'+snapshot.val().twilio_auth_token+'@video.twilio.com/v1/Rooms/'+room_sid+'/Participants'
        return request(url, function(error, response, body) {
            var participants = body.participants
            var total = participants ? participants.length : 0
            var connected = _.filter(participants, {status: 'connected'}).length
            callback({total: total, connected: connected})
        })

    })
}


var roomDetails = function(stuff) {
    var room = stuff.room
    var twilio_account_sid = stuff.twilio_account_sid
    var twilio_auth_token = stuff.twilio_auth_token
    var composition = stuff.composition

    var html = ''
    html += '<html><head></head><body>'
    html += '<h3>'
    html +=     'Return to <a href="/testViewVideoEvents?limit=10">video/video_events</a> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
    html +=     '<a href="/testCompose?room_sid='+room.sid+'">Compose</a>'
    if(stuff.composition) {
        html += ' &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Composition: <a href="https://video.twilio.com/v1/Compositions/'+stuff.composition.sid+'/Media?Ttl=6000">'+stuff.composition.sid+'</a>'
    }
    html += '</h3>'
    html += '<table border="1" cellspacing="0" cellpadding="2">'
    html += '<tr><td><b>sid</b></td><td>'+room.sid+'</td></tr>'
    html += '<tr><td><b>status</b></td><td>'+room.status+'</td></tr>'
    html += '<tr><td><b>dateCreated</b></td><td>'+room.dateCreated+'</td></tr>'
    html += '<tr><td><b>dateUpdated</b></td><td>'+room.dateUpdated+'</td></tr>'
    html += '<tr><td><b>accountSid</b></td><td>'+room.accountSid+'</td></tr>'
    html += '<tr><td><b>enableTurn</b></td><td>'+room.enableTurn+'</td></tr>'
    html += '<tr><td><b>uniqueName</b></td><td>'+room.uniqueName+'</td></tr>'
    html += '<tr><td><b>statusCallback</b></td><td>'+room.statusCallback+'</td></tr>'
    html += '<tr><td><b>statusCallbackMethod</b></td><td>'+room.statusCallbackMethod+'</td></tr>'
    html += '<tr><td><b>endTime</b></td><td>'+room.endTime+'</td></tr>'
    html += '<tr><td><b>duration</b></td><td>'+room.duration+'</td></tr>'
    html += '<tr><td><b>type</b></td><td>'+room.type+'</td></tr>'
    html += '<tr><td><b>maxParticipants</b></td><td>'+room.maxParticipants+'</td></tr>'
    html += '<tr><td><b>recordParticipantsOnConnect</b></td><td>'+room.recordParticipantsOnConnect+'</td></tr>'
    html += '<tr><td><b>videoCodecs</b></td><td>'+room.videoCodecs+'</td></tr>'
    html += '<tr><td><b>mediaRegion</b></td><td>'+room.mediaRegion+'</td></tr>'
    html += '<tr><td><b>url</b></td><td>'+room.url+'</td></tr>'
    if(room.links && room.links.recordings) {
        var url = 'https://'+twilio_account_sid+':'+twilio_auth_token+'@'+room.links.recordings.substring('https://'.length)
        html += '<tr><td><b>recordings</b></td><td><a href="'+url+'">'+room.links.recordings+'</a></td></tr>'
    }
    if(room.links && room.links.participants) {
        var url = 'https://'+twilio_account_sid+':'+twilio_auth_token+'@'+room.links.participants.substring('https://'.length)
        html += '<tr><td><b>participants</b></td><td><a href="'+url+'">'+room.links.participants+'</a></td></tr>'
    }
    html += '</table></body></html>'
    return html
}


var retrieveRoom = function(stuff) {
    var room_sid = stuff.room_sid
    var host = stuff.host
    var callback = stuff.callback
    var composition = stuff.composition // may not be present
    return db.ref('api_tokens').once('value').then(snapshot => {

        const client = twilio(snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)

        client.video.rooms(room_sid).fetch()
                    .then(room => {
                        var newstuff = {room: room, twilio_account_sid: snapshot.val().twilio_account_sid, twilio_auth_token: snapshot.val().twilio_auth_token}
                        if(composition)
                            newstuff.composition = composition
                        callback(newstuff)
                    })
                    .done();
    })
}


exports.completeRoom = function(room_sid, callback) {
    if(!room_sid)
        return false

    return db.ref('api_tokens').once('value').then(snapshot => {

        const client = twilio(snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)

        client.video.rooms(room_sid).update({status: 'completed'})
                    .then(room => {
                        db.ref('templog2').push().set({func: 'completeRoom', room_sid: room_sid, event: 'this room should be \'completed\''})
                        var stuff = {room: room, twilio_account_sid: snapshot.val().twilio_account_sid, twilio_auth_token: snapshot.val().twilio_auth_token}
                        callback(stuff)
                    })
                    .done();
    })
}


// This works but it's not useful because each() doesn't return a promise; it relies on a callback
// function and we can't get the full list of rooms out of the callback function
exports.testListRooms = functions.https.onRequest((req, res) => {

    return db.ref('api_tokens').once('value').then(snapshot => {

        //var room_id = req.query.room_id

        const client = twilio(snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)

        return client.video.rooms.each({status: 'completed'},
                                      room => {
                                        console.log(room.sid)
                                        return res.status(200).send('should be done')
                                      }
                                  );
    })
})


// ref  https://www.twilio.com/docs/video/api/rooms-resource#post-list-resource
exports.testCreateRoom = functions.https.onRequest((req, res) => {

    if(!req.query.room_id)
        return res.status(200).send('Required:  room_id request parameter')
    var recordParticipantsOnConnect = req.query.room_id.startsWith('record') ? true : false

    var showRoom = function(stuff) {
        return res.status(200).send(roomDetails(stuff))
    }
    return createRoom_private_func(req.query.room_id, req.get('host'), showRoom, recordParticipantsOnConnect)
})


// called from switchboard.js:onConnectRequest()
exports.createRoom = function(room_id, host) {
    // when the user does a "connect request", the room is just the video_node_key.  So the result here is
    // that we create a room with recording turned off.  When user hits the record button, we create ANOTHER room
    // but this time we prepend the name of the room with 'record' so that the logic below will create a room
    // with recording turned on.
    var recordParticipantsOnConnect = room_id.startsWith('record') ? true : false
//    var callback = function(room, twilio_account_sid, twilio_auth_token) {
//        // No need to really return anything.  Called from trigger switchboard.js:onConnectRequest()
//        return true
//    }
//    return exports.createRoom2(room_id, host, callback)

//    return {room: room, twilio_account_sid: snapshot.val().twilio_account_sid,
//                twilio_auth_token: snapshot.val().twilio_auth_token, twilio_secret: snapshot.val().twilio_secret,
//                twilio_api_key: snapshot.val().twilio_api_key}
    return exports.createRoom2(room_id, host, null)
}


exports.createRoom2 = function(room_id, host, callback) {
    // when the user does a "connect request", the room is just the video_node_key.  So the result here is
    // that we create a room with recording turned off.  When user hits the record button, we create ANOTHER room
    // but this time we prepend the name of the room with 'record' so that the logic below will create a room
    // with recording turned on.
    var recordParticipantsOnConnect = room_id.startsWith('record') ? true : false
    return createRoom_private_func(room_id, host, callback, recordParticipantsOnConnect)
}

var createRoom_private_func = function(room_id, host, callback, recordParticipantsOnConnect) {
    return db.ref('api_tokens').once('value').then(snapshot => {

        const client = twilio(snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)

        var roomParms = {statusCallback: 'https://'+host+'/twilioCallback',
                        uniqueName: room_id}

        if(recordParticipantsOnConnect) {
            roomParms.type = 'group-small'
            roomParms.recordParticipantsOnConnect = true
        }
        else {
            roomParms.type = 'peer-to-peer'
        }

        return client.video.rooms.create(roomParms).then(room => {
            if(callback)
                callback({room: room, twilio_account_sid: snapshot.val().twilio_account_sid, twilio_auth_token: snapshot.val().twilio_auth_token})
            else return {room: room,
                        twilio_account_sid: snapshot.val().twilio_account_sid,
                        twilio_auth_token: snapshot.val().twilio_auth_token,
                        twilio_api_key: snapshot.val().twilio_api_key,
                        twilio_secret: snapshot.val().twilio_secret}
        })
        //.done();
    })
}


exports.testCompose = functions.https.onRequest((req, res) => {

    var showRoom = function(stuff) {
        return res.status(200).send(roomDetails(stuff))
    }

    return exports.compose({
        room_sid: req.query.room_sid,
        host: req.get('host'),
        callback: showRoom
    })
//    return db.ref('api_tokens').once('value').then(snapshot => {
//
//        // Used when generating any kind of tokens
//        const twilioAccountSid = snapshot.val().twilio_account_sid
//        const twilioApiKey = snapshot.val().twilio_api_key
//        const twilioApiSecret = snapshot.val().twilio_secret
//
//        const client = twilio(snapshot.val().twilio_api_key, snapshot.val().twilio_secret, {accountSid: snapshot.val().twilio_account_sid})
//
//        client.video.compositions.create({
//            roomSid: req.query.room_sid,
//            audioSources: '*',
//            videoLayout: {
//              grid : {
//                video_sources: ['*']
//              }
//            },
//            statusCallback: 'https://'+req.get('host')+'/twilioCallback',
//            format: 'mp4'
//        })
//        .then(composition => {
//            var showRoom = function(stuff) {
//                return res.status(200).send(roomDetails(stuff))
//            }
//            var stuff = {room_sid: req.query.room_sid, host: req.get('host'), callback: showRoom, composition: composition}
//            return retrieveRoom(stuff)
//            //return retrieveRoom(req.query.room_sid, req.get('host'), showRoom)
//        });
//    })
})


// exported for use by switchboard.js: onPublishRequested()
exports.compose = function(input) {

    return db.ref('api_tokens').once('value').then(snapshot => {

        // Used when generating any kind of tokens
        const twilioAccountSid = snapshot.val().twilio_account_sid
        const twilioApiKey = snapshot.val().twilio_api_key
        const twilioApiSecret = snapshot.val().twilio_secret

        const client = twilio(snapshot.val().twilio_api_key, snapshot.val().twilio_secret, {accountSid: snapshot.val().twilio_account_sid})

        client.video.compositions.create({
            roomSid: input.room_sid,
            audioSources: '*',
            videoLayout: {
              grid : {
                video_sources: ['*']
              }
            },
            statusCallback: 'https://'+input.host+'/twilioCallback',
            resolution: '1280x720',
            format: 'mp4'
        })
        .then(composition => {
            //var stuff = {room_sid: input.room_sid, host: input.host, callback: input.callback, composition: composition}
            //return retrieveRoom(stuff) // this was fine for testing, but I don't want to do this on a twilioCallback

            // Not sure what we need to pass back to switchboard.js:onPublishRequested()...
            callback({})
        });
    })

}


// We actually have a use for this "singular" version and for the "plural" version below
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



// ref:  https://www.twilio.com/docs/iam/access-tokens#creating-tokens
// We export this so we can call this function from switchboard.js  It's not meant to be a firebase function
exports.generateTwilioTokens = function(stuff) {
    var identities = stuff.identities

    // Create Video Grant
    const videoGrant = new VideoGrant({
      room: stuff.room_id,
    });

    var tokens = []
    _.each(identities, function(identity) {
        // Create an access token which we will sign and return to the client,
        // containing the grant we just created
        console.log('stuff.twilio_account_sid: ', stuff.twilio_account_sid)
        console.log('stuff.twilio_api_key: ', stuff.twilio_api_key)
        console.log('stuff.twilio_secret: ', stuff.twilio_secret)
        const token = new AccessToken(stuff.twilio_account_sid, stuff.twilio_api_key, stuff.twilio_secret)
        token.addGrant(videoGrant)
        token.identity = identity.name
        tokens.push({uid: identity.uid, token: token.toJwt()})
    })

    return tokens
}


exports.videoEvents = function(stuff) {
    var limit = stuff.limit

    return db.ref('video/video_events').orderByChild('date_ms').limitToLast(limit).once('value').then(snapshot => {
        var html = ''
        html += '<html><head></head><body>'
        html += '<h3>'
        html +=     'video/video_events &nbsp;&nbsp;&nbsp;&nbsp; '
        html +=     '<a href="/testCompose?room_sid=RM722fbef9776cb52dd81e0f196f6848eb">Compose</a>'
        if(stuff.compositionSid) {
            html += ' &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; Composition: <a href="https://video.twilio.com/v1/Compositions/'+stuff.compositionSid+'/Media?Ttl=6000">'+stuff.compositionSid+'</a>'
        }
        html += '</h3>'
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
        html +=         '<th>CompositionSid</th>'
        html +=         '<th>CompositionUri</th>'
        html +=         '<th>PercentageDone</th>'
        html +=         '<th>SecondsRemaining</th>'
        html +=         '<th>MediaUri</th>'
        html +=         '<th>Size</th>'
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
                html +=     '[<a href="/testCompleteRoom?room_sid='+child.val()['RoomSid']+'" target="complete">complete</a>] '
                html +=     '[<a href="/testListParticipants?room_sid='+child.val()['RoomSid']+'" target="participants">participants</a>] '
                html +=     '<a href="/testRetrieveRoom?room_sid='+child.val()['RoomSid']+'" target="RoomSid">'+child.val()['RoomSid']+'</a>'
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
            html +=     '<td nowrap>'+(child.val()['CompositionSid'] ? child.val()['CompositionSid'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['CompositionUri'] ? child.val()['CompositionUri'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['PercentageDone'] ? child.val()['PercentageDone'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['SecondsRemaining'] ? child.val()['SecondsRemaining'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['MediaUri'] ? child.val()['MediaUri'] : "")+'</td>'
            html +=     '<td nowrap>'+(child.val()['Size'] ? child.val()['Size'] : "")+'</td>'
            html += '</tr>'
        })
        html += '</table>'
        html += '</body></html>'
        return html
    })
}


var check = function(val) {
    if(!val) return "n/a"
    else return val
}
