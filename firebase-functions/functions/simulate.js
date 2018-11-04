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
    return getConfig(stuff).then(st => {
        var html = ''
        html += '<html><head></head><body>'
        html += '<table border="0" cellspacing="5"><tr><td width="50%" valign="top">'
        console.log('thepage(): st.config: ', st.config)
        var st3 = configToHtml(st)
        var h2 = html + st3.html
        st3.html = h2
        return st3
    })
    .then(st => {
        var h2 = ''
        h2 += st.html
        h2 += '</td>'
        h2 += '<td valign="top">'
        h2 += what(st)
        h2 += '</td></tr></table>'
        h2 += '</body></html>'
        return h2
    })
}

var what = function(stuff) {
    console.log('what(): stuff.config: ', stuff.config)
    var html = ''
    html += '<h3>Simulated Parameters</h3>'
    html += 'This page lets you simulate various scenarios, like simulating that the user has signed the petition '
    html += 'and confidentiality agreement when they actually haven\'t'
    html += '<P/>Something else we can simulate: the auth provider (Google or Facebook) not returning the person\'s '
    html += 'name and/or email address <P/>'
    html += '<b>CitizenBuilder API: <a href="https://api.qacos.com/swagger/docs/ios#/ios" target="api">https://api.qacos.com/swagger/docs/ios#/ios</a></b><br/>'
    html += 'Prod '+stuff.config.cb_production_environment.citizen_builder_api_key_name+' = '+stuff.config.cb_production_environment.citizen_builder_api_key_value+'<br/>'
    html += 'QA '+stuff.config.cb_qa_environment.citizen_builder_api_key_name+' = '+stuff.config.cb_qa_environment.citizen_builder_api_key_value+'<br/>'
    return html
}

var getConfig = function(stuff) {
    return db.ref().child('administration/configuration').once('value').then(snapshot => {
        stuff.config = snapshot.val()
        stuff.snapshot = snapshot
        return stuff
    })
}

var configToHtml = function(stuff) {
    var html = ''

    html += '<form id="simulator-form" method="post" action="/testViewSimulatorParameters">'
    var updates = {}
    var env = stuff.config.environment
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


    // on_user_created
    var on_user_created = stuff.config.on_user_created
    var sel1 = 'checked'
    var sel2 = ''
    if(on_user_created == 'volunteers') {
        sel1 = ''
        sel2 = 'checked'
    }
    if(stuff.req.body.on_user_created && stuff.req.body.on_user_created == 'volunteers') {
        sel1 = ''
        sel2 = 'checked'
        updates['on_user_created'] = 'volunteers'
    }
    if(stuff.req.body.on_user_created && stuff.req.body.on_user_created == 'checkVolunteerStatus') {
        sel1 = 'checked'
        sel2 = ''
        updates['on_user_created'] = 'checkVolunteerStatus'
    }
    html += '<P/>On User Created: &nbsp;&nbsp;&nbsp;'
    html += '<input type="radio" name="on_user_created" value="volunteers" '+sel2+' onclick="document.getElementById(\'simulator-form\').submit()"> volunteers'
    html += '&nbsp;&nbsp;&nbsp;&nbsp;'
    html += '<input type="radio" name="on_user_created" value="checkVolunteerStatus" '+sel1+' onclick="document.getElementById(\'simulator-form\').submit()"> checkVolunteerStatus '



    // get_teams_from
    var get_teams_from = stuff.config.get_teams_from
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
        var theVal = stuff.config[prop] == true || stuff.config[prop] == "true"

        if(stuff.req.body[prop]) {
            theVal = stuff.req.body[prop] == true || stuff.req.body[prop] == "true"
            updates[prop] = theVal
        }

        var trueSelected = theVal==true || theVal=="true" ?  'checked' : ''
        var falseSelected = theVal==false || theVal=="false" ? 'checked' : ''

        html += '<P/>'+prop+' &nbsp;&nbsp;&nbsp;'
        html += '<input type="radio" name="'+prop+'" value="false" '+falseSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> false'
        html += '&nbsp;&nbsp;&nbsp;&nbsp;'
        html += '<input type="radio" name="'+prop+'" value="true" '+trueSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> true '

    })

    if(updates != {}) {
        stuff.snapshot.ref.update(updates)
    }
    html += '</form>'
    stuff.html = html
    return stuff
}
