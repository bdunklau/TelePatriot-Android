'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const request = require('request')
const log = require('../log')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

/**
firebase deploy --only functions:testAccountDisposition,functions:api_account_disposition
**/


exports.testAccountDisposition = functions.https.onRequest((req, res) => {

    if(!req.body.account_disposition) {
        return db.ref('administration/configuration/telepatriot_api_key_value').once('value').then(snapshot => {
            var apikey = snapshot.val()
            var htmlRes = page({apiKeyValue: apikey})
            return res.status(200).send(htmlRes)
        })
    }

    var url = "https://"+req.get('host')+"/api_account_disposition"

    var formData = {citizen_builder_id: req.body.citizen_builder_id, account_disposition: req.body.account_disposition}

    request.post(
        {
            url: url,
            form: formData,
            headers: {apikey: req.body.apikey}
        },
        function (err, httpResponse, body) {
            console.log(err, body);
            if(err) return res.status(500).send({problem: 'had a problem'})
            else {
                var theresponse = JSON.parse(body)
                theresponse.apiKeyValue = req.body.apikey
                var htmlRes = page(theresponse)
                return res.status(200).send(htmlRes)
            }
        }
    );
})



exports.api_account_disposition = functions.https.onRequest((req, res) => {

    if(!req.body.account_disposition)
        return false

    var value = req.body.account_disposition.toLowerCase()

    var actualkey = req.headers['apikey']

    return db.ref('administration/configuration/telepatriot_api_key_value').once('value').then(snap2 => {
        if(snap2.val() != actualkey) {
            log.debug("system", "system", "account_api.js", "api_account_disposition", "telepatriot_api_key_value = '"+snap2.val()+"' <br/>actualkey = '"+actualkey+"'")
            return res.status(403).send({response: 'bad key'})
        }
        else {

            return db.ref('users').orderByChild('citizen_builder_id').equalTo(parseInt(req.body.citizen_builder_id)).once('value').then(snapshot => {
                // should only be one person with this cb id
                var updates = {}
                var name
                var uid
                snapshot.forEach(function(child) {
                    updates['users/'+child.key+'/account_disposition'] = value
                    name = child.val().name
                    uid = child.key
                })

                return db.ref('/').update(updates).then(() => {
                    return db.ref('users/'+uid).once('value').then(snap3 => {
                        return res.status(200).send({citizen_builder_id: req.body.citizen_builder_id,
                                                    account_disposition: snap3.val().account_disposition,
                                                    name: name})
                    })
                })
            })
        }
    })

})



var theForm = function(apiKeyValue) {
    var html = ''
    html += '<form method="post" action="/testAccountDisposition">'
    html += '<table border="0">'
    html +=     '<tr><td>api key</td><td><input type="text" name="apikey" size="50" value="'+apiKeyValue+'"></td></tr>'
    html +=     '<tr><td>citizen builder id</td><td><input type="text" name="citizen_builder_id" size="50" value="1329"></td></tr>'
    html +=     '<tr><td>Account Disposition</td><td><input type="text" name="account_disposition" size="50" value="disabled"></td></tr>'
    html +=     '<tr><td></td>'
    html +=         '<td><input type="submit" value="Set Account Disposition"></td>'
    html +=     '</tr>'
    html += '</table>'
    html += '</form>'
    return html
}

var page = function(theresponse) {
    var html = ''
    html += '<html><head></head><body>'
    html += '<table border="0">'
    html +=     '<tr><td valign="top">'+theForm(theresponse.apiKeyValue)+'</td>'
    html +=         '<td valign="top">'+(theresponse && theresponse.response ? theresponse.response : "")
    if(theresponse && theresponse.citizen_builder_id) {
        html +=         '<p/>CitizenBuilder ID: '+theresponse.citizen_builder_id
    }
    if(theresponse && theresponse.name) {
        html +=         '<p/>Name: '+theresponse.name
    }
    if(theresponse && theresponse.account_disposition) {
        html +=         '<p/>Account Disposition: '+theresponse.account_disposition
    }
    html +=         '</td>'
    html +=     '</tr>'
    html += '</table>'
    html += '</body></html>'
    return html
}