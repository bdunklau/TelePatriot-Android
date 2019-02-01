'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

/**
firebase deploy --only functions:testConfiguration
**/


exports.testConfiguration = functions.https.onRequest((req, res) => {
    var stuff = {req: req, res: res}
    return thepage(stuff).then(html => {
        return res.status(200).send(html)
    })
})

var thepage = function(stuff) {
    return getConfig(stuff).then(st => {
        var html = ''
        html += '<html><head></head><body>'
        html += '<table border="0" cellspacing="5">'
        html +=     '<tr>'
        html +=         '<td valign="top">'
        html +=         what(st)
        html +=         '</td>'
        html +=     '</tr>'
        html +=     '<tr>'
        html +=         '<td valign="top">'
        html +=         configToHtml(st)
        html +=         '</td>'
        html +=     '</tr>'
        html += '</table>'
        html += '</body></html>'
        return html
    })
}

var what = function(stuff) {
    console.log('what(): stuff.config: ', stuff.config)
    var html = ''
    html += '<h3>Configuration Parameters</h3>'
    html += 'This page supports the transition of TelePatriot from a self-contained app to one that gets most of its data from CitizenBuilder. '
    html += 'To support this transition, this page lets you choose where the app gets its data under various circumstances. '
    html += 'For example, will the app make API calls to the production CitizenBuilder instance at conventionofstates.com?  Or will the app make API '
    html += 'calls against the qacos.com instance?  <b>The "CitizenBuilder database" property lets you decide which database the app will hit.</b>'
    html += '<P/>'
    html += '<h3>Simulated Parameters</h3>'
    html += 'These paramaters let you simulate conditions that are hard to replicate but necessary for testing.  For example, <b>we can simulate '
    html += 'that the user hasn\'t signed the petition or confidentiality agreement.</b>  We can simulate the user is banned to make sure the app '
    html += 'refuses access without actually banning them in CitizenBuilder.'
    html += '<P/><b>We can also simulate the user\'s name and email address not being supplied</b> when the user first logs in and creates his account. '
    html += 'These are basically error conditions, but I have seen them occur.  And when they do occur, we have to route the user to a special page '
    html += 'where the use is required to enter this mission information before they can go any further.  Since it is difficult to reproduce this error, '
    html += 'I instead created a parameter that simulates either a missing name or missing email when the corresponding parameter is true.'
    html += '<P/><b>Prod CitizenBuilder API: <a href="https://api.conventionofstates.com/swagger/docs/ios#/ios" target="api">https://api.conventionofstates.com/swagger/docs/ios#/ios</a></b><br/>'
    html += '<b>QA CitizenBuilder API: <a href="https://api.qacos.com/swagger/docs/ios#/ios" target="api">https://api.qacos.com/swagger/docs/ios#/ios</a></b><br/>'
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

    html += '<form id="simulator-form" method="post" action="/testConfiguration">'
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
    html += '<table border="0" cellpadding="5">'
    html +=     '<tr>'
    html +=         '<th></th>'
    html +=         '<th>"Production" Settings</th>'
    html +=         '<th>"Testing" and "Legacy" Settings</th>'
    html +=         '<th>Node under /administration/configuration</th>'
    html +=     '<tr>'
    html +=     '<tr>'
    html +=         '<td>CitizenBuilder database: </td>'
    html +=         '<td><input type="radio" name="environment" value="cb_production_environment" '+prodSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> conventionofstates.com </td>'
    html +=         '<td><input type="radio" name="environment" value="cb_qa_environment" '+qaSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> qacos.com</td>'
    html +=         '<td>environment</td>'
    html +=     '<tr>'

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
    html +=     '<tr>'
    html +=         '<td>When a User is Created:</td>'
    html +=         '<td><input type="radio" name="on_user_created" value="volunteers" '+sel2+' onclick="document.getElementById(\'simulator-form\').submit()">call /volunteers</td>'
    html +=         '<td><input type="radio" name="on_user_created" value="checkVolunteerStatus" '+sel1+' onclick="document.getElementById(\'simulator-form\').submit()">call /volunteer_validation/check</td>'
    html +=         '<td>on_user_created</td>'
    html +=     '</tr>'


    // on user login
    var on_user_login = stuff.config.on_user_login
    var sel1 = 'checked'
    var sel2 = ''
    if(on_user_login == 'volunteers') {
        sel1 = ''
        sel2 = 'checked'
    }
    if(stuff.req.body.on_user_login && stuff.req.body.on_user_login == 'volunteers') {
        sel1 = ''
        sel2 = 'checked'
        updates['on_user_login'] = 'volunteers'
    }
    if(stuff.req.body.on_user_login && stuff.req.body.on_user_login == 'checkVolunteerStatus') {
        sel1 = 'checked'
        sel2 = ''
        updates['on_user_login'] = 'checkVolunteerStatus'
    }
    html +=     '<tr>'
    html +=         '<td>When a User Logs in:</td>'
    html +=         '<td><input type="radio" name="on_user_login" value="volunteers" '+sel2+' onclick="document.getElementById(\'simulator-form\').submit()">call /volunteers</td>'
    html +=         '<td><input type="radio" name="on_user_login" value="checkVolunteerStatus" '+sel1+' onclick="document.getElementById(\'simulator-form\').submit()">call /volunteer_validation/check </td>'
    html +=         '<td>on_user_login</td>'
    html +=     '</tr>'


    // when citizen_builder_id changes
    var on_citizen_builder_id = stuff.config.on_citizen_builder_id
    var sel1 = 'checked'
    var sel2 = ''
    if(on_citizen_builder_id == 'post_to_slack') {
        sel1 = ''
        sel2 = 'checked'
    }
    if(stuff.req.body.on_citizen_builder_id && stuff.req.body.on_citizen_builder_id == 'post_to_slack') {
        sel1 = ''
        sel2 = 'checked'
        updates['on_citizen_builder_id'] = 'post_to_slack'
    }
    if(stuff.req.body.on_citizen_builder_id && stuff.req.body.on_citizen_builder_id == 'do_nothing') {
        sel1 = 'checked'
        sel2 = ''
        updates['on_citizen_builder_id'] = 'do_nothing'
    }
    html +=     '<tr>'
    html +=         '<td>When CitizenBuilder ID changes:</td>'
    html +=         '<td><input type="radio" name="on_citizen_builder_id" value="post_to_slack" '+sel2+' onclick="document.getElementById(\'simulator-form\').submit()">Post to Slack</td>'
    html +=         '<td><input type="radio" name="on_citizen_builder_id" value="do_nothing" '+sel1+' onclick="document.getElementById(\'simulator-form\').submit()">do nothing </td>'
    html +=         '<td>on_user_login</td>'
    html +=     '</tr>'


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
    html +=     '<tr>'
    html +=         '<td>Get Teams from:</td>'
    html +=         '<td><input type="radio" name="get_teams_from" value="citizenbuilder" '+cbSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> CitizenBuilder</td>'
    html +=         '<td><input type="radio" name="get_teams_from" value="telepatriot" '+tpSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> TelePatriot</td>'
    html +=         '<td>get_teams_from</td>'
    html +=     '</tr>'

    // get_roles_from
    var get_roles_from = stuff.config.get_roles_from
    var tp_role_selected = ''
    var cb_role_selected = 'checked'
    if(get_roles_from && get_roles_from == 'telepatriot') {
        tp_role_selected = 'checked'
        cb_role_selected = ''
    }
    if(stuff.req.body.get_roles_from && stuff.req.body.get_roles_from == 'telepatriot') {
        tp_role_selected = 'checked'
        cb_role_selected = ''
        updates['get_roles_from'] = 'telepatriot'
    }
    if(stuff.req.body.get_roles_from && stuff.req.body.get_roles_from == 'citizenbuilder') {
        tp_role_selected = ''
        cb_role_selected = 'checked'
        updates['get_roles_from'] = 'citizenbuilder'
    }
    html +=     '<tr>'
    html +=         '<td>Get Roles from: </td>'
    html +=         '<td><input type="radio" name="get_roles_from" value="citizenbuilder" '+cb_role_selected+' onclick="document.getElementById(\'simulator-form\').submit()"> CitizenBuilder </td>'
    html +=         '<td><input type="radio" name="get_roles_from" value="telepatriot" '+tp_role_selected+' onclick="document.getElementById(\'simulator-form\').submit()"> TelePatriot</td>'
    html +=         '<td>get_roles_from</td>'
    html +=     '</tr>'


    // get_missions_from
    var get_missions_from = stuff.config.get_missions_from
    var tp_mission_selected = ''
    var cb_mission_selected = 'checked'
    if(get_missions_from && get_missions_from == 'telepatriot') {
        tp_mission_selected = 'checked'
        cb_mission_selected = ''
    }
    if(stuff.req.body.get_missions_from && stuff.req.body.get_missions_from == 'telepatriot') {
        tp_mission_selected = 'checked'
        cb_mission_selected = ''
        updates['get_missions_from'] = 'telepatriot'
    }
    if(stuff.req.body.get_missions_from && stuff.req.body.get_missions_from == 'citizenbuilder') {
        tp_mission_selected = ''
        cb_mission_selected = 'checked'
        updates['get_missions_from'] = 'citizenbuilder'
    }
    html +=     '<tr>'
    html +=         '<td>Get Missions from: </td>'
    html +=         '<td><input type="radio" name="get_missions_from" value="citizenbuilder" '+cb_mission_selected+' onclick="document.getElementById(\'simulator-form\').submit()"> CitizenBuilder </td>'
    html +=         '<td><input type="radio" name="get_missions_from" value="telepatriot" '+tp_mission_selected+' onclick="document.getElementById(\'simulator-form\').submit()"> TelePatriot</td>'
    html +=         '<td>get_missions_from</td>'
    html +=     '</tr>'




    var simprops = [{db_prop: "simulate_missing_email", readable: 'Simulate email is missing'},
                    {db_prop: "simulate_missing_name", readable: 'Simulate name is missing'},
                    {db_prop: "simulate_passing_legal", readable: 'Simulate user has signed petition and conf agreement'},
                    {db_prop: "simulate_no_petition", readable: 'Simulate user has not signed petition'},
                    {db_prop: "simulate_no_confidentiality_agreement", readable: 'Simulate user has not signed conf agreement'},
                    {db_prop: "simulate_banned", readable: 'Simulate user is banned'}]
    _.each(simprops, function(prop) {
        var theVal = stuff.config[prop.db_prop] == true || stuff.config[prop.db_prop] == "true"

        if(stuff.req.body[prop.db_prop]) {
            theVal = stuff.req.body[prop.db_prop] == true || stuff.req.body[prop.db_prop] == "true"
            updates[prop.db_prop] = theVal
        }

        var trueSelected = theVal==true || theVal=="true" ?  'checked' : ''
        var falseSelected = theVal==false || theVal=="false" ? 'checked' : ''

        html +=     '<tr>'
        html +=         '<td>'+prop.readable+'</td>'
        html +=         '<td><input type="radio" name="'+prop.db_prop+'" value="false" '+falseSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> false</td>'
        html +=         '<td><input type="radio" name="'+prop.db_prop+'" value="true" '+trueSelected+' onclick="document.getElementById(\'simulator-form\').submit()"> true </td>'
        html +=         '<td>'+prop.db_prop+'</td>'
        html +=     '</tr>'
    })

    if(updates != {}) {
        stuff.snapshot.ref.update(updates)
    }
    html += '</table>'
    html += '</form>'
    return html
}
