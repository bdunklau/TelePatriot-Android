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
        return event.data.adminRef.root.child('administration/hosts').orderByChild('type').equalTo('firebase functions').once('value').then(snapshot => {
            var host
            snapshot.forEach(function(child) { // should only be one child
                host = child.val().host
            })
            return twilio_telepatriot.createRoom(event.data.val().room_id, host).then(() => {
                updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+event.data.val().uid+'/twilio_token'] = token
                return event.data.adminRef.root.child('/').update(updates)
            })

        })


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
    var stuff = {limit: limit}
    return twilio_telepatriot.videoEvents(stuff).then(html => res.status(200).send(html))
})