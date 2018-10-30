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
        var env = snapshot.val().environment
        var prodSelected = 'checked'
        var qaSelected = ''
        if(env && env == 'cb_qa_environment') {
            prodSelected = ''
            qaSelected = 'checked'
        }
        if(stuff.req.body.environment && stuff.req.body.environment == 'cb_production_environment') {
            var prodSelected = 'checked'
            var qaSelected = ''
            updates['environment'] = 'cb_production_environment'
        }
        if(stuff.req.body.environment && stuff.req.body.environment == 'cb_qa_environment') {
            var prodSelected = ''
            var qaSelected = 'checked'
            updates['environment'] = 'cb_qa_environment'
        }
        html += '<P/>Environment: &nbsp;&nbsp;&nbsp;'
        html += '<input type="radio" name="environment" value="cb_production_environment" '+prodSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> Production '
        html += '&nbsp;&nbsp;&nbsp;&nbsp;'
        html += '<input type="radio" name="environment" value="cb_qa_environment" '+qaSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> QA'

        // get_teams_from
        var get_teams_from = snapshot.val().get_teams_from
        var tpSelected = ''
        var cbSelected = 'checked'
        if(get_teams_from && get_teams_from == 'telepatriot') {
            tpSelected = 'checked'
            cbSelected = ''
        }
        if(stuff.req.body.get_teams_from && stuff.req.body.get_teams_from == 'telepatriot') {
            tpSelected = 'checked'
            cbSelected = ''
            updates['get_teams_from'] = 'telepatriot'
        }
        if(stuff.req.body.get_teams_from && stuff.req.body.get_teams_from == 'citizenbuilder') {
            tpSelected = ''
            cbSelected = 'checked'
            updates['get_teams_from'] = 'citizenbuilder'
        }
        html += '<P/>Get Teams from: &nbsp;&nbsp;&nbsp;'
        html += '<input type="radio" name="get_teams_from" value="citizenbuilder" '+cbSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> CitizenBuilder '
        html += '&nbsp;&nbsp;&nbsp;&nbsp;'
        html += '<input type="radio" name="get_teams_from" value="telepatriot" '+tpSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> TelePatriot'


        var simprops = ["simulate_missing_email", "simulate_missing_name", "simulate_passing_legal"]
        _.each(simprops, function(prop) {
            var theVal = snapshot.val()[prop] == true || snapshot.val()[prop] == "true"

            if(stuff.req.body[prop]) {
                theVal = stuff.req.body[prop] == true || stuff.req.body[prop] == "true"
                updates[prop] = theVal
            }

            var trueSelected = theVal==true || theVal=="true" ?  'checked' : ''
            var falseSelected = theVal==false || theVal=="false" ? 'checked' : ''

            html += '<P/>'+prop+' &nbsp;&nbsp;&nbsp;'
            html += '<input type="radio" name="'+prop+'" value="true" '+trueSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> true '
            html += '&nbsp;&nbsp;&nbsp;&nbsp;'
            html += '<input type="radio" name="'+prop+'" value="false" '+falseSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> false'

        })

        if(updates != {}) {
            snapshot.ref.update(updates)
        }
        html += '</form>'
        return html
    })
}