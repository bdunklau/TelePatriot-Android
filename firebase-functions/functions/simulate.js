'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

/**
firebase deploy --only functions:testViewSimulatorParameters
**/


exports.testViewSimulatorParameters = functions.https.onRequest((req, res) => {
    var stuff = {req: req, res: res}
    return thepage(stuff).then(html => {
        return res.status(200).send(html)
    })
})

var thepage = function(stuff) {
    var html = ''
    html += '<html><head></head><body>'
    html += what()
    return simParms(stuff).then(h => {
        html += h
        html += '</body></html>'
        return html
    })
}

var what = function() {
    var html = ''
    html += '<h3>Simulated Parameters</h3>'
    html += 'This page lets you simulate various scenarios, like simulating that the user has signed the petition '
    html += 'and confidentiality agreement when they actually haven\'t'
    html += '<P/>Something else we can simulate: the auth provider (Google or Facebook) not returning the person\'s '
    html += 'name and/or email address'
    return html
}

var simParms = function(stuff) {
    var html = ''
    return db.ref().child('administration/configuration').once('value').then(snapshot => {
        html += '<form id="simulator-form" method="post" action="/testViewSimulatorParameters">'
        var updates = {}
        snapshot.forEach(function(child) {
            var theVal = child.val() == true || child.val() == "true"

            if(stuff.req.body[child.key]) {
                theVal = stuff.req.body[child.key] == true || stuff.req.body[child.key] == "true"
                updates[child.key] = theVal
            }

            var trueSelected = theVal==true || theVal=="true" ?  'checked' : ''
            var falseSelected = theVal==false || theVal=="false" ? 'checked' : ''

            html += '<P/>'+child.key+' &nbsp;&nbsp;&nbsp;'
            html += '<input type="radio" name="'+child.key+'" value="true" '+trueSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> true '
            html += '&nbsp;&nbsp;&nbsp;&nbsp;'
            html += '<input type="radio" name="'+child.key+'" value="false" '+falseSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> false'
        })
        if(updates != {}) {
            snapshot.ref.update(updates)
        }
        html += '</form>'
        return html
    })
}