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
firebase deploy --only functions:twilioCallback,functions:testTwilioToken,functions:testRetrieveRoom,functions:testCompleteRoom,functions:testListParticipants,functions:testListRooms,functions:testCreateRoom,functions:testCompose
****/


exports.twilioCallback = functions.https.onRequest((req, res) => {

    // ref:  https://www.twilio.com/docs/api/video/status-callbacks
    // see also switchboard.js:testViewVideoEvents()
    return db.ref().child('video/video_events').push().set(req.body).then(snapshot => {
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
    return completeRoom(req.query.room_sid, req.get('host'), showRoom)
})


exports.testListParticipants = functions.https.onRequest((req, res) => {
    if(!req.query.room_sid)
        return res.status(200).send('Required:  room_sid request parameter')

    var callback = function(participants) {
        return res.status(200).send(participants)

    }
    return getParticipants(req.query.room_sid, req.get('host'), callback)
})


var getParticipants = function(room_sid, host, callback) {
    return db.ref('api_tokens').once('value').then(snapshot => {

        const client = twilio(snapshot.val().twilio_api_key, snapshot.val().twilio_secret, {accountSid: snapshot.val().twilio_account_sid})

        callback(client.video.rooms(room_sid).participants)
//        client.video.rooms(room_sid).participants
//          .each({status: 'connected'}, (participant) => {
//            callback(participant)
//        });
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
    var showRoom = stuff.callback
    var composition = stuff.composition // may not be present
    return db.ref('api_tokens').once('value').then(snapshot => {

        const client = twilio(snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)

        client.video.rooms(room_sid).fetch()
                    .then(room => {
                        var newstuff = {room: room, twilio_account_sid: snapshot.val().twilio_account_sid, twilio_auth_token: snapshot.val().twilio_auth_token}
                        if(composition)
                            newstuff.composition = composition
                        showRoom(newstuff)
                        //showRoom(room, snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)
                    })
                    .done();
    })
}


var completeRoom = function(room_sid, host, showRoom) {
    return db.ref('api_tokens').once('value').then(snapshot => {

        const client = twilio(snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)

        client.video.rooms(room_sid).update({status: 'completed'})
                    .then(room => {
                        var newstuff = {room: room, twilio_account_sid: snapshot.val().twilio_account_sid, twilio_auth_token: snapshot.val().twilio_auth_token}
                        if(composition)
                            newstuff.composition = composition
                        showRoom(newstuff)
                        //showRoom(room, snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)
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

    var showRoom = function(stuff) {
        return res.status(200).send(roomDetails(stuff))
    }
    return createRoom_private_func(req.query.room_id, req.get('host'), showRoom)
})


// called from switchboard.js:onConnectRequest()
exports.createRoom = function(room_id, host) {
    var callback = function(room, twilio_account_sid, twilio_auth_token) {
        // No need to really return anything.  Called from trigger switchboard.js:onConnectRequest()
        return true

    }
    return createRoom_private_func(room_id, host, callback)
}


var createRoom_private_func = function(room_id, host, showRoom) {
    return db.ref('api_tokens').once('value').then(snapshot => {

        const client = twilio(snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)

        client.video.rooms
                    .create({
                       recordParticipantsOnConnect: true,
                       statusCallback: 'https://'+host+'/twilioCallback',
                       type: 'group-small',
                       uniqueName: room_id
                     })
                    .then(room => {
                        showRoom({room: room, twilio_account_sid: snapshot.val().twilio_account_sid, twilio_auth_token: snapshot.val().twilio_auth_token})
                    })
                    .done();
    })
}


exports.testCompose = functions.https.onRequest((req, res) => {
    return db.ref('api_tokens').once('value').then(snapshot => {

        // Used when generating any kind of tokens
        const twilioAccountSid = snapshot.val().twilio_account_sid
        const twilioApiKey = snapshot.val().twilio_api_key
        const twilioApiSecret = snapshot.val().twilio_secret

        const client = twilio(snapshot.val().twilio_api_key, snapshot.val().twilio_secret, {accountSid: snapshot.val().twilio_account_sid})

        client.video.compositions.create({
            roomSid: req.query.room_sid,
            audioSources: '*',
            videoLayout: {
              grid : {
                video_sources: ['*']
              }
            },
            statusCallback: 'https://'+req.get('host')+'/twilioCallback',
            format: 'mp4'
        })
        .then(composition =>{
            var showRoom = function(stuff) {
                return res.status(200).send(roomDetails(stuff))
            }
            var stuff = {room_sid: req.query.room_sid, host: req.get('host'), callback: showRoom, composition: composition}
            return retrieveRoom(stuff)
            //return retrieveRoom(req.query.room_sid, req.get('host'), showRoom)
        });
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
