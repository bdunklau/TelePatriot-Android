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
// processing is complete and the video is ready to be viewed.  See ~/scripts/upload_video.py
// in the docker container
exports.video_processing_callback = functions.https.onRequest((req, res) => {

    // See upload_video.py in the docker containers for these parameters
    // See also google-cloud.js:startPublishing - that's where the callback url is
    // constructed that gets sent to the docker container.
    // I DON'T THINK WE NEED THIS OTHER THAN FOR INFORMATIONAL PURPOSES.  We don't need to write
    // to video/video_events, which is why we created this 'stuff'.  But the trigger that listens
    // for writes to video/video_events is dockerRequest().  And dockerRequest() ignores the event_type
    // we pass in here:  "Video ID created"
    /***********
    var stuff = {date: date.asCentralTime(),
                date_ms: date.asMillis(),
                video_node_key: req.query.video_node_key,
                event_type: req.query.event_type,
                uid: req.query.uid}
     *****************/

    var updates = {}
    if(req.query.video_id && req.query.video_node_key) {

        // Writing to 'video/list/{video_node_key}/video_id' triggers google-cloud.js:whenVideoIdIsCreated()
        return db.ref('video/list/'+req.query.video_node_key+'/video_id').set(req.query.video_id).then(() => {
            return res.status(200).send('ok: youtube-subscribe.js:video_processing_callback() handled your request')
        })

        /***************
        return db.ref('video/list/'+stuff.video_node_key).once('value').then(snapshot => {
            snapshot.ref.child('video_id').set(req.query.video_id)

            var facebook_request = {
                uid: req.query.uid,
                date: date.asCentralTime(),
                date_ms: date.asMillis(),
                text: snapshot.val().youtube_video_description, // Make the FB post the same as the YT video description
                link: snapshot.val().video_url  // i.e. YouTube video link
            }

            // There are also facebook_comment_requests because that's where we will actually be tagging legislators - in the comments
            return db.ref('facebook_post_requests').push().set(facebook_request).then(() => {
                //return render({req: req, res: res, uid: req.body.uid})
                return res.status(200).send('ok: youtube-subscribe.js:video_processing_callback() handled your request')
            })
        })
        *************/
    }
    else return res.status(200).send('ok - sort of - youtube-subscribe.js:video_processing_callback() did not receive a "video_id" request parameter.  So could not do anything meaningful with this request')

})


// We're going to try posting to FB above before the video is officially 'succeeded'
// not in this function
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