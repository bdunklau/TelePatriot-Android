'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const date = require('../dateformat')
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const citizen_builder_api = require('../citizen_builder_api/checkVolunteerStatus')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


// ad hoc - just whatever api method you want to test at the moment
exports.testApi = functions.https.onRequest((req, res) => {

    var email = req.query.email
    return citizen_builder_api.checkVolunteerStatus(email,
            function() {
                res.status(200).send('you are good !!!!')
            },
            function() {
                res.status(200).send('no way !!!!!!!')
            })
})


exports.testPing = functions.https.onRequest((req, res) => {
    var parm = req.query.parm
    var val = {}
    if(parm)
        val.parm = parm
    val['date'] = date.asCentralTime()
    return db.ref('templog2/ping').set(val).then(() => {
        return res.status(200).send('Receive: '+parm+' at '+date.asCentralTime())
    })
})