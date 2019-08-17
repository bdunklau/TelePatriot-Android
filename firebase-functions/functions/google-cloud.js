'use strict';

/********************************************************************************
See:  https://cloud.google.com/nodejs/docs/reference/compute/0.10.x/
********************************************************************************/

// external dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const email = require('./email')
const d = require('./debug')
const request = require('request')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database()


/***
paste this on the command line...
firebase deploy --only functions:recording_has_started,functions:onLegislatorChosen,functions:onParticipantAdded,functions:onParticipantRemoved,functions:whenVideoIdIsCreated,functions:socialMediaPostsCreated,functions:XXXXXXXXX,functions:XXXXXXXXX,functions:XXXXXXXXX,functions:XXXXXXXXX

***/




// Need this callback function because recording doesn't start instantly.  So we display a spinner for the
// user in VideoChatVC.startRecording().  In startRecording() in this script, we construct a callback url
// which we send to the docker container.  The docker container does a GET request on this url which
// sets the recording_started/recording_started_ms attributes.  The live query on the video node (video/list/{key})
// in the mobile clients detects 'recording_started' which has the effect of dismissing the spinner
exports.recording_has_started = functions.https.onRequest((req, res) => {
    var updates = {}
    updates['video/list/'+req.query.video_node_key+'/recording_started'] = date.asCentralTime()
    updates['video/list/'+req.query.video_node_key+'/recording_started_ms'] = date.asMillis()
//    updates['administration/dockers/'+req.query.docker_key+'/recording_started'] = date.asCentralTime()
//    updates['administration/dockers/'+req.query.docker_key+'/recording_started_ms'] = date.asMillis()

    return db.ref('/').update(updates).then(() => {
        return res.status(200).send('ok: google-cloud.js:recording_has_started() handled your request')
    })
})







///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
// Triggers


/************
when leg_id changes, re-evaluate the node's:
    email_to_legislator_body
    email_to_legislator_subject
    email_to_participant_body
    email_to_participant_subject
    youtube_video_description
    video_title

Get rid of: exports.video_title, exports.youtubeVideoDescription
**********/
exports.onLegislatorChosen = functions.database.ref('video/list/{video_node_key}/leg_id').onWrite((change, context) => {
    // leg_id should never go from non-null back to null
    return email.evaluate_video_and_email(context.params.video_node_key)
})



/************
when a participant is added, re-evaluate the node's:
    email_to_legislator_body
    email_to_legislator_subject
    email_to_participant_body
    email_to_participant_subject
    youtube_video_description
    video_title
We have to re-evaluate these attributes because the constituent is changing and constituent info
is in these attributes.  The constituent is always the person added most recently

Get rid of: exports.video_title, exports.youtubeVideoDescription
**********/
exports.onParticipantAdded = functions.database.ref('video/list/{video_node_key}/video_participants/{vp_uid}/{uid}').onCreate((snapshot, context) => {
    return email.evaluate_video_and_email(context.params.video_node_key)
})


/************
when a participant is removed, re-evaluate the node's:
    email_to_legislator_body
    email_to_legislator_subject
    email_to_participant_body
    email_to_participant_subject
    youtube_video_description
    video_title
We have to re-evaluate these attributes because the constituent is changing and constituent info
is in these attributes.  The constituent is always the person added most recently

Get rid of: exports.video_title, exports.youtubeVideoDescription
**********/
exports.onParticipantRemoved = functions.database.ref('video/list/{video_node_key}/video_participants/{vp_uid}').onDelete((snapshot, context) => {
    return email.evaluate_video_and_email(context.params.video_node_key)
})




/************************************
This function was named whenVideoIdIsCreated() because it's supposed to be those things that happen
when video/list/{video_node_key}/video_id is created.  But I realized that the trigger function
above, exports.monitor_video_processing(), is also triggered by the creation of the video_id attribute
So whenVideoIdIsCreated() isn't the greatest name.  But in whenVideoIdIsCreated(), what we're doing is
creating the video_url and then we're posting to FB and TW and then we're sending out an email with
links to YT, FB and TW
**********************************/
exports.whenVideoIdIsCreated = functions.database.ref('video/list/{video_node_key}').onWrite((change, context) => {
    var data = change.after.val()
    var previous = change.before.val()
    if(!data && previous)
        return false //ignore deleted nodes
    if(!data.video_id)
        return false // only listen when video/list/{video_node_key}/video_id is written
    if(previous.video_id && data.video_id == previous.video_id)
        return false // ignore if video/list/{video_node_key}/video_id didn't actually change

    // What are we going to do with this video?  Email it to the legislator?  Post it to FB? Post it to TW?
    // Look at these attributes on the video node: email_to_legislator, post_to_facebook, post_to_twitter
    // They will be either be true or false

    var params = context.params
    var video_url = 'https://www.youtube.com/watch?v='+data.video_id
    var updates = {}
    updates['video/list/'+params.video_node_key+'/video_url'] = video_url
    var dontPostToFB = !data.post_to_facebook
    var dontPostToTwitter = !data.post_to_twitter

    if(dontPostToFB && dontPostToTwitter) {
//        If this is true, then this write will trigger onReadyToSendEmails()
//        onReadyToSendEmails() is what actually sends then emails to the legislator and the participants
        updates['video/list/'+params.video_node_key+'/ready_to_send_emails'] = true
    }

    return db.ref().update(updates).then(() => {

        // construct the email that gets sent to the participants
        if(data.post_to_facebook) {
            // post to FB
            var facebook_request = {
                //uid: req.query.uid, // do we care what the uid is?
                video_node_key: params.video_node_key,
                date: date.asCentralTime(),
                date_ms: date.asMillis(),
                text: data.youtube_video_description, // Make the FB post the same as the YT video description
                link: video_url  // i.e. YouTube video link
            }

            // This call triggers facebook.js:handleFacebookRequest()
            db.ref('facebook_post_requests').push().set(facebook_request)
        }

        // Sample code: twitter.js:testTweet()
        if(data.post_to_twitter) {
            return db.ref().child('social_media/cos_accounts/'+data.legislator_state_abbrev+'/twitter').once('value').then(snapshot => {
                var tweetRequest = {
                    //uid: req.body.uid, // do we care?
                    video_node_key: params.video_node_key,
                    date: date.asCentralTime(),
                    date_ms: date.asMillis(),
                    text: getTweetText(data, video_url, snapshot.val() /*state-specific twitter page*/)
                }
                return db.ref('tweet_requests').push().set(tweetRequest).then(() => {
                    // twitter.js:handleTweetRequest() is what actually sends the tweet
                })
            })
        }

        // Send the email
    })
})


// This function is meant to fire when either one two functions writes to the database:
// either facebook.js:handleFacebookRequest() and twitter.js:tweet()
// This function examines the following attributes to figure out if it's time to email participants and legislators:
//      email_to_legislator, post_to_facebook, post_to_twitter, facebook_post_id, and twitter_post_id
// Basically, if we're supposed to post to facebook and twitter and we have both post id's, then the email(s)
// can go out.  If we're only supposed to send to facebook OR twitter and we have THAT post id, the email can also
// go out.
exports.socialMediaPostsCreated = functions.database.ref('video/list/{video_node_key}').onWrite((change, context) => {
    var data = change.after.val()
    if(!data) return false // ignore deletes
    var socialMediaPostsReady = false
    var facebookReady = !data.post_to_facebook || (data.post_to_facebook && data.facebook_post_id)
    var twitterReady = !data.post_to_twitter || (data.post_to_twitter && data.twitter_post_id)

    if(socialMediaPostsReady) {
        if(data.email_to_legislator) {
            // construct the email that goes to legislators
            email.sendLegislatorEmailRegardingVideo(data)
        }

        // send congratulatory email to participants as soon as social media posts are ready
        email.sendCongratulatoryEmailRegardingVideo(data)
    }
    return true
})



var getTweetText = function(video_node, video_url, twitterHandle /*state-specific twitter page*/) {
    //video_url isn't actually on the video node at the point that we call this function.
    // That's why it's a separate arg
    var rep = video_node.legislator_chamber == 'lower' ? 'Rep' : 'Sen'
    var ch = video_node.legislator_chamber == 'lower' ? 'HD' : 'SD'
    var legislator_name = video_node.legislator_first_name+' '+video_node.legislator_last_name
    if(video_node.legislator_twitter) {
        if(!video_node.legislator_twitter.startsWith('@'))
            video_node.legislator_twitter = '@'+video_node.legislator_twitter
        legislator_name = video_node.legislator_twitter
    }
    var text = video_node.video_type + ' to '+rep+' '+legislator_name+
        ' ('+video_node.legislator_state_abbrev.toUpperCase()+' '+ch+' '+video_node.legislator_district+') @'+twitterHandle+' '+video_url
    return text
}
