'use strict';

// dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const jsSHA = require('jssha')  // specifically needed to generate the vidyo token
const btoa = require('btoa')    // specifically needed to generate the vidyo token

// originally created so that we could create access tokens using my developer key
// and my app id from https://developer.vidyo.io/dashboard

// Get the api_tokens node because under it is the developer key and the app id from Vidyo

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database().ref()


exports.generateVidyoToken = functions.https.onRequest((req, res) => {

    // ref:   https://static.vidyo.io/4.1.11.4/docs/VidyoConnectorDeveloperGuide.html

    // node.js Ex:  node generateToken.js --key=rUlaMASgt1Byi4Kp3sKYDeQzo --appID=ApplicationID --userName=user1 --expiresInSecs=10000

    var userName = req.query.userName  
    var expiresInSecs = 600

    db.child(`api_tokens`).once('value').then(snapshot => {
        var devKey = snapshot.val().vidyo_developer_key
        var appID = snapshot.val().vidyo_app_id

        var EPOCH_SECONDS = 62167219200;
        var expires = Math.floor(Date.now() / 1000) + expiresInSecs + EPOCH_SECONDS;
        var shaObj = new jsSHA("SHA-384", "TEXT");
        shaObj.setHMACKey(devKey, "TEXT");
        var jid = userName + '@' + appID;
        var vCard = ""
        var body = 'provision' + '\x00' + jid + '\x00' + expires + '\x00' + vCard;
        shaObj.update(body);
        var mac = shaObj.getHMAC("HEX");
        var serialized = body + '\0' + mac;
        var token = btoa(serialized)
        var ret = {token: token}
        //console.log("\nGenerated Token: \n" + btoa(serialized));


        return res.set({'Content-Type': 'application/json'}).status(200).send(ret)

    })



})