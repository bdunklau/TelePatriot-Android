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
exports.testPostFacebook = functions.https.onRequest((req, result) => {
    /*******
    var facebook_request = {date: date.asCentralTime(), date_ms: date.asMillis(), uid: req.body.uid, text: req.body.text}
    return db.ref('facebook_requests').push().set(facebook_request).then(() => {
        return render({req: req, res: res, uid: req.body.uid})
    })
    ******/

    /****************
    WORKING cURL COMMAND !!!!!!!!!!!

    [facebook_page_access_token] is at /api_tokens/facebook_page_access_token
    [facebook_page_id] is at /api_tokens/facebook_page_id
    curl -i -X POST "https://graph.facebook.com/v3.0/[facebook_page_id]/feed?message=just+another+test&access_token=[facebook_page_access_token]"
    ****************/


    /*************/
    // THIS WORKS!!!!   It's based of the cURL command above
    return db.ref('api_tokens').once('value').then(snapshot => {

        var facebook_page_id = snapshot.val().facebook_page_id
        var facebook_page_access_token = snapshot.val().facebook_page_access_token
        FB.setAccessToken(facebook_page_access_token);

        var body = req.body.text
        FB.api(facebook_page_id+'/feed', 'post', { message: body }, function (res) {
            //db.ref('templog2').push().set({facebook_page_access_token: facebook_page_access_token, ok10: 'ok', date: date.asCentralTime()})

            // TODO need some real error handling
            if(!res || res.error) {
                console.log(!res ? 'error occurred' : res.error);
                return render({req: req, res: result, uid: req.body.uid});
            }
            // TODO probably should write this to the db somewhere
            console.log('Post Id: ' + res.id);
            return render({req: req, res: result, uid: req.body.uid})
        });
    })


})


exports.handleFacebookRequest = functions.database.ref('facebook_requests/{key}').onWrite(event => {
    if(!event.data.val() && event.data.previous.val()) return false // ignore deleted nodes
    // this is where we actually post to FB
    return false
})


var render = function(stuff) {
    var html = ''
    html += '<h3>Post to Facebook as <a href="https://www.facebook.com/TelePatriot/?modal=admin_todo_tour" target="facebook">@TelePatriot</a> | <a href="/facebook">Refresh</a></h3>'
    html += getFacebookForm(stuff)

    return stuff.res.status(200).send(html)
}


var getFacebookForm = function(stuff) {
    var html = ''
    html += '<P/><form method="post" action="/testPostFacebook">'
    html += '<P/><textarea name="text" rows="10" cols="100"></textarea>'
    html += '<P/><input type="text" name="uid" value="'+stuff.uid+'">'
    html += '<input type="submit" value="post">'
    html += '</form>'
    return html
}