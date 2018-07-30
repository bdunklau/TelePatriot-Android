'use strict';


// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database()


/***
paste this on the command line...
firebase deploy --only functions:video_processing_callback,functions:video_processing_complete
***/


// Docker containers call this url when video uploading begins and again when
// processing is complete and the video is ready to be viewed.
exports.video_processing_callback = functions.https.onRequest((req, res) => {

    // See upload_video.py in the docker containers for these parameters
    // See also google-cloud.js:startPublishing - that's where the callback url is
    // constructed that gets sent to the docker container.
    var stuff = {date: date.asCentralTime(),
                date_ms: date.asMillis(),
                video_node_key: req.query.video_node_key,
                event_type: req.query.event_type,
                uid: req.query.uid}

    return db.ref('video/video_events').push().set(stuff).then(() => {
        var updates = {}
        if(req.query.video_id) {
            updates['video/list/'+stuff.video_node_key+'/video_id'] = req.query.video_id
        }
        return db.ref('/').update(updates).then(() => {
            return res.status(200).send('ok: youtube-subscribe.js:video_processing_callback() handled your request')
        })
    })

})


// See google-cloud.js:monitor_video_processing()
exports.video_processing_complete = functions.https.onRequest((req, res) => {
    var updates  = {}
    // for now, assume success if we hear back.  I've seen large videos get stuck in 'processing'
    // state, but we won't return that.  We either return 'succeeded' or ... ?  'failed' ?
    updates['video/list/'+req.query.video_node_key+'/publishing_stopped'] = date.asCentralTime()
    updates['video/list/'+req.query.video_node_key+'/publishing_stopped_ms'] = date.asMillis()
    return db.ref('/').update(updates).then(() => {
        return res.status(200).send('OK from youtube-subscribe.js: video_processing_complete()')
    })
})