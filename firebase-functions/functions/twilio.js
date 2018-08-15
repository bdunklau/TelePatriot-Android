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
firebase deploy --only functions:testListParticipants,functions:testCompleteRoom,functions:testRetrieveRoom,functions:twilioCallback,functions:testTwilioToken,functions:testCreateRoom,functions:testListRooms
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

    var showRoom = function(room, twilio_account_sid, twilio_auth_token) {
        return res.status(200).send(roomDetails(room, twilio_account_sid, twilio_auth_token))

    }
    return retrieveRoom(req.query.room_sid, req.get('host'), showRoom)
})


exports.testCompleteRoom = functions.https.onRequest((req, res) => {
    if(!req.query.room_sid)
        return res.status(200).send('Required:  room_sid request parameter')

    var showRoom = function(room, twilio_account_sid, twilio_auth_token) {
        return res.status(200).send(roomDetails(room, twilio_account_sid, twilio_auth_token))

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


var roomDetails = function(room, twilio_account_sid, twilio_auth_token) {
        var html = ''
        html += '<html><head></head><body>'
        html += '<h3>Return to <a href="/testViewVideoEvents?limit=10">video/video_events</a></h3>'
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


var retrieveRoom = function(room_sid, host, showRoom) {
    return db.ref('api_tokens').once('value').then(snapshot => {

        const client = twilio(snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)

        client.video.rooms(room_sid).fetch()
                    .then(room => {
                        showRoom(room, snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)
                    })
                    .done();
    })
}


var completeRoom = function(room_sid, host, showRoom) {
    return db.ref('api_tokens').once('value').then(snapshot => {

        const client = twilio(snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)

        client.video.rooms(room_sid).update({status: 'completed'})
                    .then(room => {
                        showRoom(room, snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)
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


//        client.video.rooms
//                    .each({ /*see https://www.twilio.com/docs/video/api/rooms-resource#get-list-resource for parms*/
//                        uniqueName: '-LJbU1tYUjtyKy2CR_0w'
//                    },
//                    function(rooms) {
//                        console.log('rooms: ', rooms)
//                        db.ref('templog2').set({rooms: rooms})
////                        var html = ''
////                        html += '<html><head></head><body>'
////                        html += '<table>'
////                        html += '<tr>'
////                        html +=     '<th>room.sid</th>'
////                        html +=     '<th>room.unique_name</th>'
////                        html +=     '<th>room.url</th>'
////                        html += '</tr>'
////                        _.each(rooms, function(room) {
////                            html += '<tr>'
////                            html +=     '<td>'+room.sid+'</td>'
////                            html +=     '<td>'+room.unique_name+'</td>'
////                            html +=     '<td>'+room.url+'</td>'
////                            html += '</tr>'
////                        })
////                        html += '</table>'
////                        html += '</body></html>'
//
//                    })
//        return res.status(200).send('done')
    })
})


// ref  https://www.twilio.com/docs/video/api/rooms-resource#post-list-resource
exports.testCreateRoom = functions.https.onRequest((req, res) => {

    if(!req.query.room_id)
        return res.status(200).send('Required:  room_id request parameter')

    var showRoom = function(room, twilio_account_sid, twilio_auth_token) {
        return res.status(200).send(roomDetails(room, twilio_account_sid, twilio_auth_token))

    }
    return createRoom_private_func(req.query.room_id, req.get('host'), showRoom)
})


exports.createRoom = function(room_id, host, showRoom) {
    var showRoom = function(room, twilio_account_sid, twilio_auth_token) {
        // No need to really return anything.  Called from trigger switchboard.js:onConnectRequest()
        return true

    }
    return createRoom_private_func(req.query.room_id, req.get('host'), showRoom)
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
                        showRoom(room, snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token)
                    })
                    .done();
    })
}


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
