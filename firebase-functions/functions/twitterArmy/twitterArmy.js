'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('../dateformat')
const twitterAPI = require('node-twitter-api')  // ref:  https://www.npmjs.com/package/node-twitter-api

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


/**
firebase deploy --only functions:twitterArmy,functions:twitterArmyTweet,functions:twitterArmyAuthorize,functions:twitterArmyCallback
**/

/**
Twitter API OAuth calls
ref:  https://developer.twitter.com/en/docs/basics/authentication/overview/3-legged-oauth
1) https://twitter.com/oauth/request_token?oauth_consumer_key=LHgnVchHnszDqYaPe4IBU5o6R
    Get oauth_consumer_key from https://developer.twitter.com/en/apps/15676711 > Keys and tokens > (API Key)
2) sign out of twitter
3) https://api.twitter.com/oauth/authorize?oauth_token=[returned from above]
**/

exports.twitterArmy = functions.https.onRequest((req, res) => {

    return res.status(200).send(thePage())
})

var getTweetForm = function() {
    var html = ''
    html += '<form method="post" action="/twitterArmyTweet">'
    html += '<input type="text" name="myTwitterAccount" size="20" placeholder="my twitter account">'
    html += '<P/><input type="text" name="recipientTwitter" size="20" placeholder="tweet to this account">'
    html += '<P/><textarea rows="10" cols="40" name="tweet" placeholder="tweet goes here"></textarea>'
    html += '<P/><input type="submit" value="tweet">'
    html += '</form>'
    return html
}

var thePage = function() {
    var html = ''
    html += '<html><head></head><body>'
    html += '<a href="">authorize</a>'
    html += '<P/>'+getTweetForm();
    html += '</body></html>'
    return html
}

exports.twitterArmyTweet = functions.https.onRequest((req, res) => {
    return res.status(200).send(thePage())
})

exports.twitterArmyAuthorize = functions.https.onRequest((req, res) => {
    return res.status(200).send(thePage())
})

exports.twitterArmyCallback = functions.https.onRequest((req, res) => {
    return res.status(200).send(thePage())
})


var initTwitterAPI = function(req, res) {
    return db.ref('api_tokens').once('value').then(snapshot => {
        // ref:  https://www.npmjs.com/package/node-twitter-api
        var twitter = new twitterAPI({
                                  consumerKey: snapshot.val().twitter_consumer_key,
                                  consumerSecret: snapshot.val().twitter_consumer_secret,
                                  callback: 'https://'+req.get('host')+'/callback_from_twitter'
                              })

        // ref:  https://www.npmjs.com/package/node-twitter-api
        twitter.getRequestToken(function(error, requestToken, requestTokenSecret, results){
            if (error) {
                console.log("Error getting OAuth request token : " + error);
            } else {
                //store token and tokenSecret somewhere, you'll need them later; redirect user
                snapshot.ref.update({'twitter_request_token': requestToken, 'twitter_request_token_secret': requestTokenSecret}).then(() => {
                    return res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+requestToken)
                })
            }
        });
    })
}

