'use strict';


// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database()

var parseString = require('xml2js').parseString;

// Docker containers call this url when video uploading begins and again when
// processing is complete and the video is ready to be viewed.
exports.video_processing_callback = functions.https.onRequest((req, res) => {

    var stuff = {date: date.asCentralTime()}


})

/***********
Example of a deleted action...

<at:deleted-entry ref="yt:video:xScSTh-gHpQ" when="2018-07-26T17:43:36+00:00">
  <link href="https://www.youtube.com/watch?v=xScSTh-gHpQ"/>
  <at:by>
   <name>TelePatriot-Dev</name>
   <uri>https://www.youtube.com/channel/UCiC2Q-noJ-2uxQeDKC6IHKg</uri>
  </at:by>
 </at:deleted-entry>
***********/
