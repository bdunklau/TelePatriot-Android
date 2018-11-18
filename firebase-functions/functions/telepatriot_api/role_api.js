'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const request = require('request')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

/**
firebase deploy --only functions:testRoleApiForm,functions:testRoleApi,functions:api_add_role,functions:api_remove_role
**/


exports.testRoleApiForm = functions.https.onRequest((req, res) => {

    return res.status(200).send(page({}))

})


exports.testRoleApi = functions.https.onRequest((req, res) => {

    var action = 'api_add_role'
    if(req.body.action) action = req.body.action

    var url = 'https://us-central1-telepatriot-dev.cloudfunctions.net/'+action
    console.log('action = ', action)

    var formData = {citizen_builder_id: req.body.citizen_builder_id, role_name: req.body.role_name}

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
                var htmlRes = page(theresponse)
                return res.status(200).send(htmlRes)
            }
        }
    );
})



var rolemapping = {'TelePatriot Volunteer':'Volunteer', 'TelePatriot Director':'Director',
                    'TelePatriot Admin':'Admin', 'TelePatriot Moderator':'Moderator'}


exports.api_add_role = functions.https.onRequest((req, res) => {
    return setRole(req, res, "true")
})


exports.api_remove_role = functions.https.onRequest((req, res) => {
    return setRole(req, res, null)
})


var setRole = function(req, res, value) {

    var actualkey = req.headers['apikey']
    console.log('apikey = ', actualkey)
    if(apikey != actualkey) {
        return res.status(403).send({response: 'bad key'})
    }

    var role_name = rolemapping[req.body.role_name]

    return db.ref('users').orderByChild('citizen_builder_id').equalTo(parseInt(req.body.citizen_builder_id)).once('value').then(snapshot => {
        // should only be one person with this cb id
        var updates = {}
        snapshot.forEach(function(child) {
            updates['users/'+child.key+'/roles/'+role_name] = value
        })
        return db.ref('/').update(updates).then(() => {
            var msg = 'User '+req.body.citizen_builder_id+' is now a '+role_name
            if(value != "true") msg = 'User '+req.body.citizen_builder_id+' is not a '+role_name+' anymore'
            return res.status(200).send({response: msg})
        })
    })

}


var apikey = 'abcde' // TODO get this from the db


var addRoleForm = function() {
    var html = ''
    html += '<form method="post" action="/testRoleApi">'
    html += '<table border="0">'
    html +=     '<tr><td>api key</td><td><input type="text" name="apikey" size="50" value="'+apikey+'"></td></tr>'
    html +=     '<tr><td>citizen builder id</td><td><input type="text" name="citizen_builder_id" size="50" value="1329"></td></tr>'
    html +=     '<tr><td>role name</td><td><input type="text" name="role_name" size="50" value=""></td></tr>'
    html +=     '<tr><td></td>'
    html +=         '<td><input type="submit" name="action" value="api_add_role">  '
    html +=             '<input type="submit" name="action" value="api_remove_role"></td>'
    html +=     '</tr>'
    html += '</table>'
    html += '</form>'
    return html
}

var page = function(theresponse) {
    var html = ''
    html += '<html><head></head><body>'
    html += '<table border="0">'
    html +=     '<tr><td valign="top">'+addRoleForm()+'</td><td valign="top">'+(theresponse && theresponse.response ? theresponse.response : "")+'</td></tr>'
    html += '</table>'
    html += '</body></html>'
    return html
}