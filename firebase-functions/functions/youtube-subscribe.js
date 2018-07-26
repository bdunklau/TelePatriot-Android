'use strict';


// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database()


exports.youtube_subscribe_callback = functions.https.onRequest((req, res) => {

    var stuff = {nothing: 'nothing', date: date.asCentralTime()}
    if(req.body)

    db.ref('templog2').push().set(req)
        return res.status(200).send("hub_challenge")
})
