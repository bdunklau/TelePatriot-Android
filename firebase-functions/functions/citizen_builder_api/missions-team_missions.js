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
firebase deploy --only functions:testTeamMissions
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
                else return res.status(200).send(thePage({teams: json.missions}))
            })

        })
    }
    else {
        return res.status(200).send(testTeamIdList())
    }
})

var testTeamIdList = function() {
    var html = ''
    var list = [11, 14]
    html += '<table border="0">'
    html += '   <tr><td><b>Click a team_id below to see the missions for this team</b></td></tr>'

    _.each(list, function(person_id) {
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
        html += '<tr><td>'+missions.id+'</td><td>'+missions.name+'</td><td>'+missions.description+'</td><td>'+missions.script+'</td><td>'+missions.status+'</td></tr>'
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

var thePage = function(stuff) {
    var html = ''
    html += '<table border="0" cellspacing="10">'
    html += showError(stuff)
    html += '   <tr>'
    html +=         '<td valign="top">'+testTeamIdList()+'</td>'
    if(stuff.missions) {
        html +=     '<td valign="top">'+testMissionList(stuff.missions)+'</td>'
    }
    html += '   </tr>'
    html += '</table>'
    return html
}