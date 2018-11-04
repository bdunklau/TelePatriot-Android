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
firebase deploy --only functions:testVolunteers
***/

//CREATED TO TEST AND SUPPORT THE /volunteers ENDPOINT

exports.testVolunteers = functions.https.onRequest((req, res) => {

    if(req.query.email) {

        return db.ref('administration/configuration').once('value').then(snapshot => {
            var environment = 'cb_production_environment'
            if(snapshot.val().environment && snapshot.val().environment == 'cb_qa_environment') {
                environment = snapshot.val().environment
            }

            var input = {citizen_builder_api_key_name: snapshot.val()[environment].citizen_builder_api_key_name,
                        citizen_builder_api_key_value: snapshot.val()[environment].citizen_builder_api_key_value,
                        domain: snapshot.val()[environment].citizen_builder_domain,
                        email: req.query.email,
                        successFn: function(result) { return res.status(200).send(thePage(result)) },
                        errorFn: function(result) { return res.status(200).send(thePage(result)) }
                        }
            exports.volunteers(input)

        })
    }
    else {
        return res.status(200).send(testEmailList())
    }
})

exports.volunteers = function(input) {

    // as long as there's an email address, call the CB API endpoint to see if this person
    // has satisfied the legal requirements
    var endpoint = 'https://'+input.domain+'/api/ios/v1/volunteers?email='+input.email

    var apiKeyName = input.citizen_builder_api_key_name
    var apiKeyValue = input.citizen_builder_api_key_value

    var headers = {}
    headers[input.citizen_builder_api_key_name] = input.citizen_builder_api_key_value

    var options = {
        url: endpoint,
        headers: headers
    };

    // see above:   var request = require('request')
    request.get(options, function(error, response, body){
        //console.log(body);
        var vol = JSON.parse(body)

//        // test/mock code...
//        vol.petition_signed = true
//        vol.volunteer_agreement_signed = true
//        vol.is_banned = true
//        // test/mock code...

        if(error) {
            //return res.status(200).send(thePage({error: error}))
            input.errorFn({error: error})
        }
        else input.successFn({vol: vol}) //return res.status(200).send(thePage({vol: vol}))
    })
}

var testEmailList = function() {
    var html = ''
    var emails = ['bdunklau@yahoo.com', 'bdunklautest@yahoo.com', 'ttpvolunteer@m.ri', 'chdn6@m.ri', 'chlb8@m.ri', 'someuser5@mailinator.com', 'chlb2@m.ri']
    html += '<table border="0">'
    html += '   <tr><td><b>Click an email below to see the volunteer\'s info</b></td></tr>'

    _.each(emails, function(email) {
        html += '<tr><td><a href="/testVolunteers?email='+email+'">'+email+'</a></td></tr>'
    })

    html += '</table>'
    return html
}

var testVolunteerInfo = function(vol) {
    var html = ''
    html += '<table border="0">'
    html += '   <tr><th colspan="2">Volunteer Info</th></tr>'
    html += '   <tr><td>id</td><td><a href="/testPersonTeams?person_id='+vol.id+'" title="see teams for this person">'+vol.id+'</a></td></tr>'
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
    html +=         '<td colspan="2"><b>Endpoint:</b> /volunteers</td>'
    html += '   </tr>'
    html += '   <tr>'
    html +=         '<td valign="top">'+testEmailList()+'</td>'
    if(stuff.vol) {
        html +=     '<td valign="top">'+testVolunteerInfo(stuff.vol)+'</td>'
    }
    html += '   </tr>'
    html += '</table>'
    return html
}

