'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const admin = require('firebase-admin')
const functions = require('firebase-functions')
const date = require('../dateformat')

// for calling CitizenBuilder API
var request = require('request')

// create reference to root of the database
const db = admin.database()


/***
paste this on the command line...
firebase deploy --only functions:testTeamMissions,functions:createMission
***/

//CREATED TO TEST AND SUPPORT THE /missions/team_missions ENDPOINT

exports.testTeamMissions = functions.https.onRequest((req, res) => {

    if(req.query.team_id) {
        return db.ref('api_tokens').once('value').then(snapshot => {

            // as long as there's an email address, call the CB API endpoint to see if this person
            // has satisfied the legal requirements
            var endpoint = 'https://api.qacos.com/api/ios/v1/missions/team_missions?team_id='+req.query.team_id

            var apiKeyName = snapshot.val().citizen_builder_api_key_name
            var apiKeyValue = snapshot.val().citizen_builder_api_key_value_QA

            var headers = {}
            headers[apiKeyName] = apiKeyValue

            var options = {
                url: endpoint,
                headers: headers
            };

            // see above:   var request = require('request')
            request.get(options, function(error, response, body){
                //console.log(body);
                var json = JSON.parse(body)
                if(error) {
                    return res.status(200).send(thePage({error: error}))
                }
                else return res.status(200).send(thePage({missions: json.missions}))
            })

        })
    }
    else {
        return res.status(200).send(testTeamIdList())
    }
})

exports.createMission = functions.https.onRequest((req, res) => {

    var formData = {author_id: req.body.author_id, name: req.body.name, description: req.body.description, script: req.body.script}

    var endpoint = 'https://api.qacos.com/api/ios/v1/missions'
    request.post(
        {
            url: endpoint,
            form: formData
        },
        function (err, httpResponse, body) {
            console.log(err, body);
            if(err) {
                return res.status(200).send(thePage({error: err}))
            } else {
                return res.status(200).send(thePage({body: body, httpResponse: httpResponse}))
            }
        }
    );
})

var testTeamIdList = function() {
    var html = ''
    var list = [11, 14]
    html += '<table border="0">'
    html += '   <tr><td><b>Click a team_id below to see the missions for this team</b></td></tr>'

    _.each(list, function(team_id) {
        html += '<tr><td><a href="/testTeamMissions?team_id='+team_id+'">'+team_id+'</a></td></tr>'
    })

    html += '</table>'
    return html
}

var testMissionList = function(missions) {
    var html = ''
    html += '<table border="0">'
    html += '   <tr><th colspan="2">Mission Info</th></tr>'
    html += '   <tr><th>id</th><th>name</th><th>description</th><th>script</th><th>status</th></tr>'

    _.each(missions, function(mission) {
        html += '<tr><td>'+mission.id+'</td><td>'+mission.name+'</td><td>'+mission.description+'</td><td>'+mission.script+'</td><td>'+mission.status+'</td></tr>'
    })

    html += '</table>'
    return html
}

var showError = function(stuff) {
    var html = ''
    if(stuff.error) {
        html += '   <tr>'
        html +=         '<td colspan="2">'+stuff.error+'</td>'
        html += '   </tr>'
    }
    return html
}

var createMissionForm = function() {
    var html = ''
    html += '<form method="post" action="/createMission">'
    html += '<table border="0">'
    html +=     '<tr><td>author_id</td><td><input type="text" name="author_id" size="50"></td></tr>'
    html +=     '<tr><td>name</td><td><input type="text" name="name" size="50"></td></tr>'
    html +=     '<tr><td>description</td><td><input type="text" name="description" size="50"></td></tr>'
    html +=     '<tr><td>script</td><td><input type="text" name="script" size="50"></td></tr>'
    html +=     '<tr><td colspan="2"><input type="submit" name="create mission" size="50"></td></tr>'
    html += '</table>'
    html += '</form>'
    return html
}

var thePage = function(stuff) {
    var html = ''
    html += '<table border="0" cellspacing="10">'
    html += showError(stuff)
    html += '   <tr><td colspan="2"><b>Endpoint:</b> GET /missions/team_missions</td></tr>'
    html += '   <tr><td colspan="2"><b>Endpoint:</b> POST /missions</td></tr>'
    html += '   <tr>'
    html +=         '<td valign="top">'+testTeamIdList()+'</td>'
    if(stuff.missions) {
        html +=     '<td valign="top">'+testMissionList(stuff.missions)+'</td>'
    }
    html +=     '<td valign="top">'+createMissionForm()+'</td>'
    if(stuff.body) {
        html +=     '<td valign="top"><b>body: </b>'+stuff.body+'</td>'
    }
    if(stuff.httpResponse) {
        html +=     '<td valign="top"><b>httpResponse: </b>'+JSON.parse(stuff.httpResponse)+'</td>'
    }
    html += '   </tr>'
    html += '</table>'
    return html
}