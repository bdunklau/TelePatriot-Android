'use strict';

/********************************************************************************
See:  https://cloud.google.com/nodejs/docs/reference/compute/0.10.x/
********************************************************************************/

// external dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database()

/***
paste this on the command line...
firebase deploy --only functions:onConnectRequest
***/

exports.onConnectRequest = functions.database.ref('video/video_events/{key}').onCreate(event => {
    if(!event.data.val().request_type) return false //ignore malformed
    if(event.data.val().request_type != 'connect request') return false //ignore, not a connect request
    var video_event_key = event.params.key

    var updates = {}
    updates['video/video_events/'+video_event_key+'/date'] = date.asCentralTime()
    updates['video/video_events/'+video_event_key+'/date_ms'] = date.asMillis()
    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+event.data.val().uid+'/connect_date'] = date.asCentralTime()
    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+event.data.val().uid+'/connect_date_ms'] = date.asMillis()
    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+event.data.val().uid+'/disconnect_date'] = null
    updates['video/list/'+event.data.val().video_node_key+'/video_participants/'+event.data.val().uid+'/disconnect_date_ms'] = null
})