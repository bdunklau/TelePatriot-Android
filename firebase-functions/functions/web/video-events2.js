'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('../dateformat')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

/****
deploy everything in this file...
firebase deploy --only functions:videoEvents
****/

exports.videoEvents = functions.https.onRequest((req, res) => {
    var html = ''

    return db.ref('api_tokens').once('value').then(snapshot => {

        html = '<html>\n\
            <head>\n\
            \n\
            </head>\n\
            <body>\n\
            \n\
            <!-- Firebase App is always required and must be first -->\n\
            <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-app.js"></script>\n\
            \n\
            <!-- Add additional services that you want to use -->\n\
            <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-auth.js"></script>\n\
            <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-database.js"></script>\n\
            <!-- <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-firestore.js"></script> -->\n\
            <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-messaging.js"></script>\n\
            <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-functions.js"></script>\n\
            \n\
            <!-- Comment out (or don\n\'t include) services that you don\n\'t want to use -->\n\
            <!-- <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-storage.js"></script> -->\n\
            \n\
            <script src="https://www.gstatic.com/firebasejs/5.3.1/firebase.js"></script>\n\
            <script>\n\
              var config = {\n\
                apiKey: "'+snapshot.val().firebase_api_key+'",\n\
                authDomain: "'+snapshot.val().firebase_auth_domain+'",\n\
                databaseURL: "'+snapshot.val().firebase_database_url+'",\n\
                projectId: "'+snapshot.val().firebase_project_id+'",\n\
                storageBucket: "'+snapshot.val().firebase_storage_bucket+'",\n\
                messagingSenderId: "'+snapshot.val().firebase_messaging_sender_id+'"\n\
              };\n\
              firebase.initializeApp(config);\n\
            </script>\n\
            \n\
            ok then 2\n\
            \n\
            \n\
            </body>\n\
            </html>'
        return res.status(200).send(html)
    })

})