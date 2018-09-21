'use strict';

const admin = require('firebase-admin')
const functions = require('firebase-functions')
const date = require('../dateformat')

// for calling CitizenBuilder API
var request = require('request')

// create reference to root of the database
const db = admin.database()


/***
paste this on the command line...
firebase deploy --only functions:testVolunteers
***/

//CREATED TO TEST AND SUPPORT THE /volunteers ENDPOINT

exports.testVolunteers = functions.https.onRequest((req, res) => {

    if(req.query.email) {
        return db.ref('api_tokens').once('value').then(snapshot => {

            // as long as there's an email address, call the CB API endpoint to see if this person
            // has satisfied the legal requirements
            var endpoint = 'https://api.qacos.com/api/ios/v1/volunteers?email='+req.query.email

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
                var vol = JSON.parse(body)
                if(error) {
                    return res.status(200).send(thePage({error: error}))
                }
                else return res.status(200).send(thePage({vol: vol}))
            })

        })
    }
    else {
        return res.status(200).send(testEmailList())
    }
})

var testEmailList = function() {
    var html = ''
    var emails = ['bdunklau@yahoo.com', 'ttpvolunteer@m.ri', 'chdn6@m.ri', 'chlb8@m.ri', 'someuser5@mailinator.com', 'chlb2@m.ri']
    html += '<table border="0">'
    html += '   <tr><td>Click an email below to see the volunteer\'s info</td></tr>'

    _.each(emails, function(email) {
        html += '<tr><td><a href="/testVolunteers?email='+email+'>'+email+'</a></td></tr>'
    })

    html += '</table>'
    return html
}

var testVolunteerInfo = function(vol) {
    var html = ''
    html += '<table border="0">'
    html += '   <tr><th colspan="2">Volunteer Info</th></tr>'
    html += '   <tr><td>id</td><td>'+vol.id+'</td></tr>'
    html += '   <tr><td>first_name</td><td>'+vol.first_name+'</td></tr>'
    html += '   <tr><td>last_name</td><td>'+vol.last_name+'</td></tr>'
    html += '   <tr><td>address</td><td>'+vol.address+'</td></tr>'
    html += '   <tr><td>city</td><td>'+vol.city+'</td></tr>'
    html += '   <tr><td>state</td><td>'+vol.state+'</td></tr>'
    html += '   <tr><td>email</td><td>'+vol.email+'</td></tr>'
    html += '   <tr><td>phone</td><td>'+vol.phone+'</td></tr>'
    html += '   <tr><td>is_banned</td><td>'+vol.is_banned+'</td></tr>'
    html += '   <tr><td>petition_signed</td><td>'+vol.petition_signed+'</td></tr>'
    html += '   <tr><td>volunteer_agreement_signed</td><td>'+vol.volunteer_agreement_signed+'</td></tr>'
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
    html +=         '<td valign="top">'+testEmailList()+'</td>'
    if(stuff.vol) {
        html +=     '<td valign="top">'+testVolunteerInfo(stuff.vol)+'</td>'
    }
    html += '   </tr>'
    html += '</table>'
    return html
}

