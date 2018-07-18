'use strict';

/********************************************************************************
See also video.js.  That file was created to test uploading videos to YouTube
But we aren't going to be uploading videos from firebase functions because of the
timeout limit.  Everything else, like creating playlists and adding videos to playlists,
we ARE going to be doing from firebase functions.  And that's what we're going to
do here
********************************************************************************/

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const twitterAPI = require('node-twitter-api')  // ref:  https://www.npmjs.com/package/node-twitter-api

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


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


exports.tweet = functions.https.onRequest((req, res) => {
    // send the tweet then render...

    return db.ref('api_tokens').once('value').then(snapshot => {
        var twitter = new twitterAPI({
                              consumerKey: snapshot.val().twitter_consumer_key,
                              consumerSecret: snapshot.val().twitter_consumer_secret,
                              callback: 'https://'+req.get('host')+'/callback_from_twitter'
                          })

        console.log('twitter: ', twitter)

        return twitter.statuses("update", {
                            status: req.body.tweet
                        },
                        req.body.twitter_access_token,
                        req.body.twitter_access_token_secret,
                        function(error, data, response) {
                            if (error) {
                                // something went wrong
                            } else {
                                // data contains the data sent by twitter
                                // don't try to log/debug the response object.  It contains a function

                                // add some of my own attrs to data...
                                data.date = date.asCentralTime()
                                data.date_ms = date.asMillis()
                                db.ref('tweets').push().set(data)
                            }
                            return render({req: req, res: res,
                                        twitter_access_token: req.body.twitter_access_token,
                                        twitter_access_token_secret: req.body.twitter_access_token_secret})
                        }
                    );

    })

})


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


var tweetsInDatabase = function() {
    return db.ref('tweets').once('value').then(snapshot => {
        return snapshot.val()
    })
}


var render = function(stuff) {
    var req = stuff.req
    var res = stuff.res
    var html = ''
    html += '<h3>Tweet as <a href="https://twitter.com/realTelePatriot" target="twitter">@realTelePatriot</a></h3>'
    html += twitterForm(stuff)
    return db.ref('tweets').once('value').then(snapshot => {
        html += tweetsAsHtml(snapshot.val())
        return res.status(200).send(html)
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

var twitterForm = function(stuff) {
    var req = stuff.req
    var html = ''
    if(stuff.twitter_access_token && stuff.twitter_access_token_secret) {
        html += '<P/><form method="post" action="/tweet">'
        html += '<textarea name="tweet" rows="10" cols="100"></textarea>'
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