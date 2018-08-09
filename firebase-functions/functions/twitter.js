'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const twitterAPI = require('node-twitter-api')  // ref:  https://www.npmjs.com/package/node-twitter-api

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

/***
paste this on the command line...
firebase deploy --only functions:twitter,functions:testTweet,functions:handleTweetRequest,functions:callback_from_twitter
***/

exports.twitter = functions.https.onRequest((req, res) => {
    // if we have 'twitter_access_token' and 'twitter_access_token_secret' then we've already
    // gone through the authentication process with twitter...

    return db.ref('api_tokens').once('value').then(snapshot => {
        if(snapshot.val().twitter_access_token && snapshot.val().twitter_access_token_secret) {
            // already authenticated...
            return render({req: req, res: res,
                           twitter_access_token: snapshot.val().twitter_access_token,
                           twitter_access_token_secret: snapshot.val().twitter_access_token_secret})
        }
        else {
            // have to authenticate...
            return initTwitterAPI(req, res)
        }
    })

})


exports.testTweet = functions.https.onRequest((req, res) => {
    // write to /tweet_requests.  handleTweetRequest listens for writes to that node.
    // handleTweetRequest is what actually does the tweeting
    var tweetRequest = {
        uid: req.body.uid,
        date: date.asCentralTime(),
        date_ms: date.asMillis(),
        text: req.body.tweet,
        twitter_callback_url: 'https://'+req.get('host')+'/callback_from_twitter'
    }
    return db.ref('tweet_requests').push().set(tweetRequest).then(() => {
        return render({req: req, res: res,
                       twitter_access_token: req.body.twitter_access_token,
                       twitter_access_token_secret: req.body.twitter_access_token_secret})
    })
})


// This is the function that actually does the tweeting
exports.handleTweetRequest = functions.database.ref('tweet_requests/{key}').onWrite(event => {
    if(!event.data.val() && event.data.previous.val()) return false // ignore deleted rows
    return tweet({tweet_request: event.data.val()})
})


var tweet = function(stuff) {
    // send the tweet...

    return db.ref('api_tokens').once('value').then(snapshot => {
        var twitter = new twitterAPI({
                              consumerKey: snapshot.val().twitter_consumer_key,
                              consumerSecret: snapshot.val().twitter_consumer_secret,
                              callback: stuff.twitter_callback_url
                          })

        return twitter.statuses("update",
                        {status: stuff.tweet_request.text}, // 'text' has to be < 140 chars
                        snapshot.val().twitter_access_token,
                        snapshot.val().twitter_access_token_secret,
                        function(error, data, response) {
                            if (error) {
                                // something went wrong
                                // TODO need error handling strategy
                                var text = 'no text (that is bad)'
                                if(stuff.tweet_request.text)
                                    text = stuff.tweet_request.text
                                db.ref('templog2').set({error: error, text: text, event_data_val: stuff.tweet_request,
                                                    date: date.asCentralTime(), date_ms: date.asMillis()})
                            } else {
                                // data contains the data sent by twitter
                                // don't try to log/debug the response object.  It contains a function

                                // add some of my own attrs to data...
                                data.date = date.asCentralTime()
                                data.date_ms = date.asMillis()
                                db.ref('tweets').push().set(data) // don't believe we use this for anything other than auditing (8/5/18)

                                if(event.data.val().video_node_key) { // may not exist in testing classes
                                    // There's a trigger (not created yet) that listens for writes to this node and also to
                                    // facebook_post_id.  The trigger then examines the values of post_to_facebook, post_to_twitter and
                                    // email_to_legislator to figure out if the emails are ready to go out and if they are,
                                    // what the text of the emails should be.
                                    //
                                    // There are two emails:
                                    // one to the participants but not the legislator, and another to the participants AND the legislator
                                    // The email to the legislator is addressed to him.  Whereas the other one is a congratulatory email to
                                    // the participants
                                    // SEE google-cloud:socialMediaPostsCreated()
                                    event.data.adminRef.root.child('video/list/'+event.data.val().video_node_key+'/twitter_post_id').set(data.id_str)
                                }

                            }
                        }
                    )

    })

}


exports.callback_from_twitter = functions.https.onRequest((req, res) => {
    if(req.query.oauth_token && req.query.oauth_verifier) {

        return db.ref('api_tokens').once('value').then(snapshot => {
            var twitter = new twitterAPI({
                                  consumerKey: snapshot.val().twitter_consumer_key,
                                  consumerSecret: snapshot.val().twitter_consumer_secret,
                                  callback: 'https://'+req.get('host')+'/callback_from_twitter'
                              })

            twitter.getAccessToken(req.query.oauth_token,
                                   snapshot.val().twitter_request_token_secret,
                                   req.query.oauth_verifier,
                                   function(error, accessToken, accessTokenSecret, results) {
                if (error) {
                    console.log(error);
                    db.ref('templog2').remove().then(() => { db.ref('templog2').set({twitter_access_token_error: error, date: date.asCentralTime()}) })
                    return false
                } else {
                    //store accessToken and accessTokenSecret somewhere (associated to the user)
                    //Step 4: Verify Credentials belongs here (optional - not doing it)
                    return snapshot.ref.update({'twitter_access_token': accessToken, 'twitter_access_token_secret': accessTokenSecret}).then(() => {
                        return render({req: req, res: res,
                                    twitter_access_token: snapshot.val().twitter_access_token,
                                    twitter_access_token_secret: snapshot.val().twitter_access_token_secret})
                    })
                }
            });

        })

    }
    else return render({req: req, res: res})
})

/*************
This SHOULD work but it doesn't
ref:  https://www.npmjs.com/package/node-twitter-api

exports.deleteTweet = functions.https.onRequest((req, res) => {
    // send the tweet then render...

    return db.ref('api_tokens').once('value').then(snapshot => {
        var twitter = new twitterAPI({
                              consumerKey: snapshot.val().twitter_consumer_key,
                              consumerSecret: snapshot.val().twitter_consumer_secret,
                              callback: 'https://'+req.get('host')+'/callback_from_twitter'
                          })

        return twitter.statuses("destroy", {
                            id: req.query.id_str
                        },
                        req.body.twitter_access_token,
                        req.body.twitter_access_token_secret,
                        function(error, data, response) {
                            if (error) {
                                // something went wrong
                            } else {
                                // data contains the data sent by twitter
                            }
                            return render({req: req, res: res,
                                        twitter_access_token: snapshot.val().twitter_access_token,
                                        twitter_access_token_secret: snapshot.val().twitter_access_token_secret})
                        }
                    );

    })
})
*********/


var initTwitterAPI = function(req, res) {
    return db.ref('api_tokens').once('value').then(snapshot => {
        // ref:  https://www.npmjs.com/package/node-twitter-api
        var twitter = new twitterAPI({
                                  consumerKey: snapshot.val().twitter_consumer_key,
                                  consumerSecret: snapshot.val().twitter_consumer_secret,
                                  callback: 'https://'+req.get('host')+'/callback_from_twitter'
                              })

        // ref:  https://www.npmjs.com/package/node-twitter-api
        return twitter.getRequestToken(function(error, requestToken, requestTokenSecret, results){
            if (error) {
                console.log("Error getting OAuth request token : " + error);
                db.ref('templog2').remove().then(() => { db.ref('templog2').set({twitter_error: error, date: date.asCentralTime()}) })
                return false
            } else {
                //store token and tokenSecret somewhere, you'll need them later; redirect user
                return snapshot.ref.update({'twitter_request_token': requestToken, 'twitter_request_token_secret': requestTokenSecret}).then(() => {
                    return res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+requestToken)
                })
            }
        });
    })
}


var render = function(stuff) {
    var req = stuff.req
    var res = stuff.res
    var html = ''
    html += '<h3>Tweet as <a href="https://twitter.com/realTelePatriot" target="twitter">@realTelePatriot</a> | <a href="/twitter">Refresh</a></h3>'
    return db.ref('users').orderByChild('email').equalTo('bdunklau@yahoo.com').once('value').then(snapshot => {
        var uid
        snapshot.forEach(function(child) { uid = child.key })
        stuff.uid = uid
        html += twitterForm(stuff)
        return db.ref('tweets').once('value').then(snapshot => {
            html += tweetsAsHtml(snapshot.val())
            return db.ref('tweet_requests').once('value').then(snapshot => {
                html += tweetsRequestsAsHtml(snapshot.val())
                return res.status(200).send(html)
            })
        })
    })
}

var tweetsAsHtml = function(tweets) {
    // this is not all of the attributes returned by twitter.statuses(...)
    var html = '<P/>'
    html += '<table border="1" cellspacing="0" cellpadding="2">'
    html += '<tr>'
    html +=     '<th colspan="5">Tweets in /tweets</th>'
    html += '</tr>'
    html += '<tr>'
    html +=     '<th></th>'
    html +=     '<th>id</th>'
    html +=     '<th>id_str</th>'
    html +=     '<th>date</th>'
    html +=     '<th>text</th>'
    html += '</tr>'
    _.each(tweets, function(tweet) {
        html += '<tr>'
        html +=     '<td><a href="https://www.twitter.com/realTelePatriot/status/'+tweet.id_str+'" target="twitter">view</a></td>'
        html +=     '<td>'+tweet.id+'</td>'
        html +=     '<td>'+tweet.id_str+'</td>'
        html +=     '<td>'+tweet.date+'</td>'
        html +=     '<td>'+tweet.text+'</td>'
        html += '</tr>'
    })
    html += '</table>'
    return html
}

var tweetsRequestsAsHtml = function(tweet_requests) {
    // this is not all of the attributes returned by twitter.statuses(...)
    var html = '<P/>'
    html += '<table border="1" cellspacing="0" cellpadding="2">'
    html += '<tr>'
    html +=     '<th colspan="5">Tweets Requests in /tweet_requests</th>'
    html += '</tr>'
    html += '<tr>'
    html +=     '<th>date</th>'
    html +=     '<th>uid</th>'
    html +=     '<th>text</th>'
    html +=     '<th>twitter_callback_url</th>'
    html += '</tr>'
    _.each(tweet_requests, function(tweet_request) {
        html += '<tr>'
        html +=     '<td>'+tweet_request.date+'</td>'
        html +=     '<td>'+tweet_request.uid+'</td>'
        html +=     '<td>'+tweet_request.text+'</td>'
        html +=     '<td>'+tweet_request.twitter_callback_url+'</td>'
        html += '</tr>'
    })
    html += '</table>'
    return html
}

var twitterForm = function(stuff) {
    var req = stuff.req
    var uid = stuff.uid
    var html = ''
    if(stuff.twitter_access_token && stuff.twitter_access_token_secret) {
        html += '<P/><form method="post" action="/testTweet">'
        html += '<textarea name="tweet" rows="10" cols="100"></textarea>'
        html += '<P/><input type="text" name="uid" value="'+uid+'" placeholder="user id / uid">'
        html += '<P/><input type="submit" value="tweet" />'
        html += '<input type="hidden" name="twitter_access_token" value="'+stuff.twitter_access_token+'">'
        html += '<input type="hidden" name="twitter_access_token_secret" value="'+stuff.twitter_access_token_secret+'">'
        html += '</form>'
    }
    else {
        html += '<P/><b>Not authenticated on Twitter</b>'
    }
    return html
}