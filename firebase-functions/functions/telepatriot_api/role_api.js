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
firebase deploy --only functions:testRoleApiForm,functions:testRoleApi,functions:api_add_role,functions:api_remove_role
**/


exports.testRoleApiForm = functions.https.onRequest((req, res) => {

    return db.ref('administration/configuration').once('value').then(snapshot => {
        var apiKeyValue = snapshot.val().telepatriot_api_key_value
        console.log('snapshot.val().telepatriot_api_key_value = ', snapshot.val().telepatriot_api_key_value)
        return res.status(200).send(page({apiKeyValue: apiKeyValue}))
    })


})


exports.testRoleApi = functions.https.onRequest((req, res) => {

    var action = 'api_add_role'
    if(req.body.action) action = req.body.action

    var url = "https://"+req.get('host')+"/"+action
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
                theresponse.apiKeyValue = req.body.apikey
                var htmlRes = page(theresponse)
                return res.status(200).send(htmlRes)
            }
        }
    );
})



var rolemapping = {'TelePatriot Volunteer':'Volunteer',
                    'TelePatriot Director':'Director',
                    'TelePatriot Video Creator':'Video Creator',
                    'TelePatriot Admin':'Admin',
                    'TelePatriot Moderator':'Moderator'}


exports.api_add_role = functions.https.onRequest((req, res) => {
    return setRole(req, res, "true")
})


exports.api_remove_role = functions.https.onRequest((req, res) => {
    return setRole(req, res, null)
})

// a "short-term" fix function
// CB does not recognize the TelePatriot Video Creator role.  So we can set this role for a user through
// the TP API, but every time the user logs back in, CB overwrites the user's roles and deletes the
// TelePatriot Video Creator role.  So this trigger watches for that and restores the role for anyone that has
// that role.
exports.restoreVideoCreator = functions.database.ref('/users/{uid}/roles/Video Creator').onDelete( (snap, context) => {
    return db.ref().child('/users/'+context.params.uid+'/roles/Video Creator').set("true");
});





// This function only works if the user has a CitizenBuilder ID on his record
// And the user won't have a CB ID if we are using the /volunteer_validation/check endpoint
// Only the /volunteers endpoint will look up the user's CB ID
var setRole = function(req, res, value) {

    var actualkey = req.headers['apikey']

    return db.ref('administration/configuration/telepatriot_api_key_value').once('value').then(snap2 => {
        if(snap2.val() != actualkey) {
            return res.status(403).send({response: 'bad key'})
        }
        else {
            var role_name = rolemapping[req.body.role_name]

            // see the note at the top of this function
            return db.ref('users').orderByChild('citizen_builder_id').equalTo(parseInt(req.body.citizen_builder_id)).once('value').then(snapshot => {
                // should only be one person with this cb id
                var updates = {}
                var name
                var roles
                var uid
                snapshot.forEach(function(child) {
                    updates['users/'+child.key+'/roles/'+role_name] = value
                    name = child.val().name
                    roles = child.val().roles
                    uid = child.key
                })

                log.debug(uid, name, "role_api.js", "setRole", "check uid: "+uid)

                return db.ref('/').update(updates).then(() => {
                    var msg = 'User '+req.body.citizen_builder_id+' is now a '+role_name
                    if(value != "true") msg = 'User '+req.body.citizen_builder_id+' is not a '+role_name+' anymore'
                    return db.ref('users/'+uid).once('value').then(snap3 => {
                        log.debug(uid, name, "role_api.js", "setRole", snap3.val())
                        return res.status(200).send({response: msg,
                                                    citizen_builder_id: req.body.citizen_builder_id,
                                                    roles: snap3.val().roles,
                                                    name: name})
                    })
                })
            })
        }
    })

}


var addRoleForm = function(apiKeyValue) {
    var html = ''
    html += '<form method="post" action="/testRoleApi">'
    html += '<table border="0">'
    html +=     '<tr><td>api key</td><td><input type="text" name="apikey" size="50" value="'+apiKeyValue+'"></td></tr>'
    html +=     '<tr><td>citizen builder id</td><td><input type="text" name="citizen_builder_id" size="50" value="1329"></td></tr>'
    html +=     '<tr><td>role name</td><td><input type="text" name="role_name" size="50" value=""></td></tr>'
    html +=     '<tr><td></td>'
    html +=         '<td><input type="submit" name="action" value="api_add_role">  '
    html +=             '<input type="submit" name="action" value="api_remove_role"></td>'
    html +=     '</tr>'
    html +=     '<tr>'
    html +=         '<td>Valid Roles:'
    html +=             '<ul>'
    html +=                 '<li>TelePatriot Volunteer</li>'
    html +=                 '<li>TelePatriot Director</li>'
    html +=                 '<li>TelePatriot Moderator</li>'
    html +=                 '<li>TelePatriot Video Creator</li>'
    html +=                 '<li>TelePatriot Admin</li>'
    html +=             '</ul>'
    html +=         '</td>'
    html +=     '</tr>'
    html += '</table>'
    html += '</form>'
    return html
}

var page = function(theresponse) {
    var html = ''
    html += '<html><head></head><body>'
    html += '<table border="0">'
    html +=     '<tr><td valign="top">'+addRoleForm(theresponse.apiKeyValue)+'</td>'
    html +=         '<td valign="top">'+(theresponse && theresponse.response ? theresponse.response : "")
    if(theresponse && theresponse.citizen_builder_id) {
        html +=         '<p/>CitizenBuilder ID: '+theresponse.citizen_builder_id
    }
    if(theresponse && theresponse.name) {
        html +=         '<p/>Name: '+theresponse.name
    }
    if(theresponse && theresponse.roles) {
        html +=         '<p/>Roles: '+_.join(Object.keys(theresponse.roles), ', ')
    }
    html +=         '</td>'
    html +=     '</tr>'
    html += '</table>'
    html += '</body></html>'
    return html
}