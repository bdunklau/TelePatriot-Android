'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database()
const FB = require('fb')   //https://www.npmjs.com/package/fb

/***
paste this on the command line...
firebase deploy --only functions:facebook,functions:testPostFacebook,functions:handleFacebookRequest,functions:triggerComment,functions:onFacebookPostId
***/

exports.facebook = functions.https.onRequest((req, res) => {
    return db.ref('users').orderByChild('email').equalTo('bdunklau@yahoo.com').once('value').then(snapshot => {
        var uid
        snapshot.forEach(function(child) {
            uid = child.key
        })
        return render({req: req, res: res, uid: uid})
    })
})



//  https://developers.facebook.com/tools/accesstoken
exports.testPostFacebook = functions.https.onRequest((req, res) => {
    /*******
    var facebook_request = {date: date.asCentralTime(), date_ms: date.asMillis(), uid: req.body.uid, text: req.body.text}
    return db.ref('facebook_requests').push().set(facebook_request).then(() => {
        return render({req: req, res: res, uid: req.body.uid})
    })
    ******/

    var facebook_request = {
        uid: req.body.uid,
        date: date.asCentralTime(),
        date_ms: date.asMillis(),
        text: req.body.text,
        link: req.body.link  // i.e. YouTube video link
    }

    // There are also facebook_comment_requests because that's where we will actually be tagging legislators - in the comments
    return db.ref('facebook_post_requests').push().set(facebook_request).then(() => {
        return render({req: req, res: res, uid: req.body.uid})
    })
})


exports.handleFacebookRequest = functions.database.ref('facebook_post_requests/{key}').onCreate((snap, context) => {
//    if(!change.after.val() && change.before.val()) return false // ignore deleted nodes
//    // this is where we actually post to FB
//
//    /**
//    Return early here also because all we did was write the FB post_id to this row.
//    We record the post_id at the bottom of this function.  This 'if' condition here prevents
//    infinite triggering
//    **/
//    if(change.after.val().post_id && !change.before.val().post_id)
//        return false

    /****************
    WORKING cURL COMMAND !!!!!!!!!!!

    [facebook_page_access_token] is at /api_tokens/facebook_page_access_token
    [facebook_page_id] is at /api_tokens/facebook_page_id
    curl -i -X POST "https://graph.facebook.com/v3.0/[facebook_page_id]/feed?message=just+another+test&access_token=[facebook_page_access_token]"


    curl -i -X POST "https://graph.facebook.com/v3.0/1307580742712791/feed?message=just+another+test&access_token=EAABlr4HjXpUBAJzEs3d6XZCcikDlmQqkXcvhBZCkV2yQeoewhbRmLF05QBAAWNjF2m0MO2znLOvmZCBuMhodl10RkLZAnwglq4lvl76iEvZCd4Ig2kEcpHycQZASnJMBJDRf28wZCVYysyj1PKj5tOijnCncpn1r1otwVT4jg7iwQZDZD"
    ****************/


    /*************/
    // THIS WORKS!!!!   It's based of the cURL command above
    return db.ref('api_tokens').once('value').then(snapshot => {

        var facebook_page_id = snapshot.val().facebook_page_id
        var facebook_page_access_token = snapshot.val().facebook_page_access_token
        FB.setAccessToken(facebook_page_access_token);

        var body = snap.val().text
        var postThis = {}
        postThis['message'] = body
        if(snap.val().link)
            postThis['link'] = snap.val().link

        FB.api(facebook_page_id+'/feed', 'post', postThis, function (res) {

            // TODO need some real error handling
            if(!res || res.error) {
                console.log(!res ? 'error occurred' : res.error);
            }
            // TODO probably should write this to the db somewhere
            console.log('Post Id: ' + res.id);
            snap.ref.child('post_id').set(res.id) // not even sure if we NEED the post_id written here

            if(snap.val().video_node_key) { // may not exist in testing classes
                // There's a trigger (not created yet) that listens for writes to this node and also to
                // twitter_post_id.  The trigger then examines the values of post_to_facebook, post_to_twitter and
                // email_to_legislator to figure out what the text of the emails should be.  There are two emails:
                // one to the participants but not the legislator, and another to the participants AND the legislator
                // The email to the legislator is addressed to him.  Whereas the other one is a congratulatory email to
                // the participants
                // SEE google-cloud:socialMediaPostsCreated()
                return db.ref().child('video/list/'+snap.val().video_node_key+'/facebook_post_id').set(res.id)
            }
            else {
                console.log("WHY ARE WE GETTING TO THIS BLOCK ?????")
            }
        });
    })

})


// add a comment whenever a post is created...
exports.triggerComment = functions.database.ref('facebook_post_requests/{key}/post_id').onCreate((snap1, context) => {
    if(!snap1.val() && snap1.val()) return false // ignore deleted nodes

    var post_id = snap1.val()

    return db.ref('api_tokens').once('value').then(snapshot => {

        var facebook_page_id = snapshot.val().facebook_page_id
        var facebook_page_access_token = snapshot.val().facebook_page_access_token
        FB.setAccessToken(facebook_page_access_token);

        var postThis = {}

        return db.ref().child('facebook_post_requests/'+context.params.key+'/video_node_key').once('value').then(snap2 => {
            var video_node_key = snap2.val()
            return db.ref().child('video/list/'+video_node_key).once('value').then(snap3 => {
                if(snap3.val().legislator_facebook) {
                    return db.ref().child('social_media/cos_accounts/'+snap3.val().legislator_state_abbrev+'/facebook').once('value').then(snap4 => {
                        /********* This works but I don't know what I want the comment to be yet  *********/
    //                    FB doesn't let you tag people and pages without permission

                        var msg = 'Please leave a comment using this tag: @'+snap3.val().legislator_facebook+' so that '+snap3.val().legislator_first_name+' '+snap3.val().legislator_last_name
                            +' will get notified.  He *is* our representative after all :)  Also tag @'+snap4.val() /*state-specific FB page*/
                        postThis['message'] = msg // ref:  https://developers.facebook.com/docs/graph-api/reference/v3.0/object/comments#publish

                        FB.api(post_id+'/comments', 'post', postThis, function (res) {
                            //db.ref('templog2').push().set({facebook_page_access_token: facebook_page_access_token, ok10: 'ok', date: date.asCentralTime()})

                            // TODO need some real error handling
                            if(!res || res.error) {
                                console.log(!res ? 'error occurred' : res.error);
                            }
                            // TODO probably should write this to the db somewhere
                            console.log('Post Id: ' + res.id);
                        });
                    })
                }
            })
        })


    })
})


// just doing onCreate to try to make the logic simpler
// twitter.js has a corresponding trigger: onTwitterPostId()
exports.onFacebookPostId = functions.database.ref('video/list/{video_node_key}/facebook_post_id').onCreate((snap, context) => {
    // now see if we're supposed to tweet also, and if we are, do we have the tweet post id_str yet?...
    return db.ref().child('video/list/'+context.params.video_node_key).once('value').then(snapshot => {
        var tweetExists = snapshot.val().twitter_post_id
        var tweetNotRequired = !snapshot.val().post_to_twitter
        var readyToSendEmails = tweetExists || tweetNotRequired
        if(readyToSendEmails)
            return snapshot.ref.child("ready_to_send_emails").set(true) // which fires yet another trigger: onReadyToSendEmails()
        else return false
    })
})


var render = function(stuff) {
    var html = ''
    html += '<h3>Post to Facebook as <a href="https://www.facebook.com/TelePatriot/?modal=admin_todo_tour" target="facebook">@TelePatriot</a> | <a href="/facebook">Refresh</a></h3>'
    html += getFacebookForm(stuff)

    return facebookPostRequests().then(asHtml => {
        html += asHtml
        return stuff.res.status(200).send(html)
    })
}


var facebookPostRequests = function() {

    return db.ref('facebook_post_requests').once('value').then(snapshot => {
        var html = '<P/>'
        html += '<table border="1" cellspacing="0" cellpadding="2">'
        html += '<tr>'
        html +=     '<td colspan="6">Database:  /facebook_post_requests</td>'
        html += '</tr>'
        html += '<tr>'
        html +=     '<td>key</td>'
        html +=     '<td>date</td>'
        html +=     '<td>uid (user id)</td>'
        html +=     '<td>post_id</td>'
        html +=     '<td>text</td>'
        html +=     '<td>link</td>'
        html += '</tr>'
        snapshot.forEach(function(child) {
            var linkToPost = ''
            if(child.val().post_id) {
                linkToPost = '<a href="https://www.facebook.com/'+child.val().post_id+'">'+child.val().post_id+'</a>'
            }
            html += '<tr>'
            html +=     '<td>'+child.key+'</td>'
            html +=     '<td>'+child.val().date+'</td>'
            html +=     '<td>'+child.val().uid+'</td>'
            html +=     '<td>'+linkToPost+'</td>'
            html +=     '<td>'+child.val().text+'</td>'
            html +=     '<td><a href="'+child.val().link+'" target="checklink">'+child.val().link+'</a></td>'
            html += '</tr>'
        })
        html += '</table>'
        return html
    })
}


var getFacebookForm = function(stuff) {
    var html = ''
    html += '<P/><form method="post" action="/testPostFacebook">'
    html += '<P/><textarea name="text" rows="10" cols="100"></textarea>'
    var link = stuff.link ? stuff.link : ''
    html += '<P/><input type="text" name="link" value="'+link+'">'
    html += '<P/><input type="text" name="uid" value="'+stuff.uid+'">'
    html += '<input type="submit" value="post">'
    html += '</form>'
    return html
}