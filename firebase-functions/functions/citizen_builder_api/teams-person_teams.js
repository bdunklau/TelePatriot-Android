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
firebase deploy --only functions:testPersonTeams
***/

//CREATED TO TEST AND SUPPORT THE /teams/person_teams ENDPOINT

exports.testPersonTeams = functions.https.onRequest((req, res) => {

    if(req.query.person_id) {

        return db.ref('administration/configuration').once('value').then(snapshot => {
            var environment = 'cb_production_environment'
            if(snapshot.val().environment && snapshot.val().environment == 'cb_qa_environment') {
                environment = snapshot.val().environment
            }

            var apiKeyName = snapshot.val()[environment].citizen_builder_api_key_name
            var apiKeyValue = snapshot.val()[environment].citizen_builder_api_key_value
            var domain = snapshot.val()[environment].citizen_builder_domain
            var endpoint = 'https://'+domain+'/api/ios/v1/teams/person_teams?person_id='+req.query.person_id

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
                else return res.status(200).send(thePage({teams: json.teams}))
            })

        })
    }
    else {
        return res.status(200).send(testPersonIdList())
    }
})

var testPersonIdList = function() {
    var html = ''
    var list = [1329]
    html += '<table border="0">'
    html += '   <tr><td><b>Click a person_id below to see the teams for this volunteer</b></td></tr>'

    _.each(list, function(person_id) {
        html += '<tr><td><a href="/testPersonTeams?person_id='+person_id+'">'+person_id+'</a></td></tr>'
    })

    html += '</table>'
    return html
}

var testTeamList = function(teams) {
    var html = ''
    html += '<table border="0">'
    html += '   <tr><th colspan="2">Team Info</th></tr>'
    html += '   <tr><th>id</th><th>name</th></tr>'

    _.each(teams, function(team) {
        html += '<tr><td><a href="testTeamMissions?team_id='+team.id+'" title="see missions for this team">'+team.id+'</a></td><td>'+team.name+'</td></tr>'
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
    html +=         '<td colspan="2"><b>Endpoint:</b> /teams/person_teams</td>'
    html += '   </tr>'
    html += '   <tr>'
    html +=         '<td valign="top">'+testPersonIdList()+'</td>'
    if(stuff.teams) {
        html +=     '<td valign="top">'+testTeamList(stuff.teams)+'</td>'
    }
    html += '   </tr>'
    html += '</table>'
    return html
}