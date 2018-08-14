'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

/****
deploy everything in this file...
firebase deploy --only functions:videoEvents
****/

exports.videoEvents = functions.https.onRequest((req, res) => {
    var html = ''
    html = '<html>\
            <head>\
            \
            </head>\
            <body>\
            \
            <!-- Firebase App is always required and must be first -->\
            <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-app.js"></script>\
            \
            <!-- Add additional services that you want to use -->\
            <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-auth.js"></script>\
            <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-database.js"></script>\
            <!-- <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-firestore.js"></script> -->\
            <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-messaging.js"></script>\
            <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-functions.js"></script>\
            \
            <!-- Comment out (or don\'t include) services that you don\'t want to use -->\
            <!-- <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-storage.js"></script> -->\
            \
            <script src="https://www.gstatic.com/firebasejs/5.3.1/firebase.js"></script>\
            <script>\
              var config = {\
                apiKey: "AIzaSyC2hOku8c1EiFdnRKDVtwzN3H8VfiVUl2w",\
                authDomain: "telepatriot-dev.firebaseapp.com",\
                databaseURL: "https://telepatriot-dev.firebaseio.com",\
                projectId: "telepatriot-dev",\
                storageBucket: "telepatriot-dev.appspot.com",\
                messagingSenderId: "739385355816"\
              };\
              firebase.initializeApp(config);\
            </script>\
            \
            ok then\
            \
            \
            </body>\
            </html>'
    return res.status(200).send(html)
})