'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const volunteers = require('./citizen_builder_api/volunteers')
const log = require('./log')

var style = "font-family:Arial;font-size:12px"
var tableheading = style + ';background-color:#ededed'

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


/**
firebase deploy --only functions:manageUsers,functions:downloadUsers,functions:updateUser,functions:temp_call_volunteers,functions:temp_not_pop,,functions:temp_not_pop2
**/


exports.manageUsers = functions.https.onRequest((req, res) => {

    var stuff = {res: res}
    if(req.query.role) {
        stuff.role = req.query.role
    }
    return showPage(stuff)

})

var showPage = function(stuff) {
    var res = stuff.res
    return listUsers(stuff)
    .then(userList => {
        stuff.users = userList
        return listUsersAsHtml(stuff)
    })
    .then(userListHtml => {
        var html = '<html><head></head><body><table width="100%"><tr><td colspan="33%">' + userListHtml + '</td><td colspan="33%">&nbsp;</td><td colspan="33%">&nbsp;</td></tr></table></body></html>'
        return res.status(200).send(html)
    })
}


var listUsers = function(stuff) {
    return db.ref('users').orderByChild('name').once('value').then(snapshot => {
        var users = []
        snapshot.forEach(function(child) {
            var roles = []
            var auser = child.val()
            auser.uid = child.key

            var hasRole /*we're looking for*/ = false
            if(child.val().roles) {
                _.each(Object.keys(child.val().roles), function(role) {
                    if(child.val().roles[role] == "true" || child.val().roles[role] == true) {
                        roles.push(role)
                        if(stuff.role && stuff.role == role)
                            hasRole = true
                    }
                })
            }
            auser.roles = roles
            if((stuff.role && hasRole) || !stuff.role )
                users.push(auser)
        })
        return users
    })
}


var listUsersAsHtml = function(stuff) {
    var users = stuff.users
    var roleParm = stuff.role ? '?role='+stuff.role : ''
    var stuff = ''
    stuff += '<table>'
    stuff +=    '<tr>'
    stuff +=        '<td colspan="8">'
    stuff +=            '<b> <a href="/downloadUsers'+roleParm+'">Download</a> All Users</b> &nbsp;&nbsp;&nbsp;&nbsp;'
    stuff +=            '<a href="/manageUsers?role=Admin">Admin</a> &nbsp;&nbsp;&nbsp;&nbsp;'
    stuff +=            '<a href="/manageUsers?role=Director">Director</a> &nbsp;&nbsp;&nbsp;&nbsp;'
    stuff +=            '<a href="/manageUsers?role=Volunteer">Volunteer</a> &nbsp;&nbsp;&nbsp;&nbsp;'
    stuff +=            '<a href="/manageUsers?role=Video Creator">Video Creator</a> &nbsp;&nbsp;&nbsp;&nbsp;'
    stuff +=        '</td>'
    stuff +=    '</tr>'
    stuff += '<tr>'
    stuff += '<th style="'+tableheading+'">UID</th>'
    stuff += '<th style="'+tableheading+'">Name</th>'
    stuff += '<th style="'+tableheading+'">CB ID</th>'
    stuff += '<th style="'+tableheading+'">Email</th>'
    stuff += '<th style="'+tableheading+'">Petition</th>'
    stuff += '<th style="'+tableheading+'">CA</th>'
    stuff += '<th style="'+tableheading+'">Banned</th>'
    stuff += '<th style="'+tableheading+'">Phone</th>'
    stuff += '<th style="'+tableheading+'">Save</th>'
    stuff += '<th style="'+tableheading+'">Roles</th>'
    stuff += '</tr>'
    for(var i=0; i < users.length; i++) {
        var pcolor = color(users[i].has_signed_petition, true)
        var ccolor = color(users[i].has_signed_confidentiality_agreement, true)
        var bcolor = color(users[i].is_banned, false)
        var pstyle = style+";background-color:"+pcolor
        var cstyle = style+";background-color:"+ccolor
        var bstyle = style+";background-color:"+bcolor

        stuff += '<tr>'
        stuff += '<form method="post" action="/updateUser"><input type="hidden" name="uid" value="'+users[i].uid+'"/>'
        stuff += '<td style="'+style+'" valign="top">'+users[i].uid+'</td>'
        stuff += '<td style="'+style+'" valign="top">'+users[i].name+'</td>'
        stuff += '<td style="'+style+'" valign="top">'+users[i].citizen_builder_id+'</td>'
        stuff += '<td style="'+style+'" valign="top">'+users[i].email+'</td>'
        stuff += '<td style="'+pstyle+'" valign="top">'+users[i].has_signed_petition+'</td>'
        stuff += '<td style="'+cstyle+'" valign="top">'+users[i].has_signed_confidentiality_agreement+'</td>'
        stuff += '<td style="'+bstyle+'" valign="top">'+users[i].is_banned+'</td>'
        stuff += '<td style="'+style+'" valign="top"><input type="text" name="phone" placeholder="phone" size="15" value="'+users[i].phone+'"/></td>'
        stuff += '<td style="'+style+'"><input type="submit" value="save"></td>'
        stuff += '<td style="'+style+'" valign="top">'+users[i].roles+'</td>'
        stuff += '</form>'
        stuff += '</tr>'
    }
    stuff += '</table>'
    return stuff
}


var color = function(val, goodVal) {
    var good = "#008B00"
    var bad = "#e5125d"
    var neutral = "#ffffff"
    if(val == null) return neutral
    else if(val == goodVal) return good
    else return bad
}


exports.downloadUsers = functions.https.onRequest((req, res) => {
    var filename = 'TelePatriotUsers' // just a default value, expect this to be overwritten below

    var stuff = {res: res}
    if(req.query.role) {
        stuff.role = req.query.role
        filename = 'TelePatriot-'+stuff.role+'s'
    }

    return listUsers(stuff)
    .then(userList => {
        var stuff = '' // csv data, really tab-delimited
        stuff = 'Name\tEmail\tPhone\n'
        _.forEach(userList, function(user) {
            stuff += user.name+'\t'
            stuff += user.email+'\t'
            stuff += user.phone+'\t'
            stuff += '\n'
        })

        return res.set({'Content-Type': 'application/vnd.ms-excel', 'Content-Disposition': 'attachment;filename='+filename+'.xls'}).status(200).send(stuff)

    })
})


// This function just reports on all the users that don't have a citizen_builder_id attribute.
// This function does not update the database at all.  The updating happens in not_pop2
exports.temp_not_pop = functions.https.onRequest((req, res) => {
    return db.ref('users').once('value').then(snapshot => {
        var outcome = '<html><head></head><body>'
        outcome += '<h4>'
        outcome += 'This is a report of every user that does not have a citizen_builder_id attribute'
        outcome += '<P/>If you do not see any names below, then it means every user has <i>some</i> value for citizen_builder_id'
        outcome += '</h4>'
        outcome += '<P/>To set citizen_builder_id="not populated yet" for all of these users, <a target="temp_not_pop2" href="/temp_not_pop2">CLICK HERE</a><P/>'
        outcome += '<table border="0" cellspacing="0" cellpadding="2">'
        snapshot.forEach(function(child) {
            if(!child.val().citizen_builder_id) {
                //child.ref.update({citizen_builder_id: 'not populated yet'})
                outcome += '<tr><td>'+child.key+'</td><td>'+child.val().name+'</td></tr>'
            }
        })
        outcome += '</table></body></html>'

        return res.status(200).send(outcome)
    })
})


//
exports.temp_not_pop2 = functions.https.onRequest((req, res) => {
    return db.ref('users').once('value').then(snapshot => {
        var outcome = '<html><head></head><body>'
        outcome += '<h4>'
        outcome += 'This is a report of every user that had their citizen_builder_id attribute set to "not populated yet"'
        outcome += '<P/>If you do not see any names below, then it means every user has <i>some</i> value for citizen_builder_id'
        outcome += '</h4>'
        outcome += '<table border="0" cellspacing="0" cellpadding="2">'
        snapshot.forEach(function(child) {
            if(!child.val().citizen_builder_id) {
                child.ref.update({citizen_builder_id: 'not populated yet'})
                outcome += '<tr><td>'+child.key+'</td><td>'+child.val().name+'</td><td>citizen_builder_id=not populated yet</td></tr>'
            }
        })
        outcome += '</table></body></html>'

        return res.status(200).send(outcome)
    })
})


// Called whenever the citizen_builder_id node is written to.  And if the value of the node is "not populated yet",
// this function will call the /volunteers endpoint at CB and get the user's info.
exports.temp_call_volunteers = functions.database.ref('users/{uid}/citizen_builder_id').onWrite((change, context) => {
    var params = context.params
    if(change.after.val() != 'not populated yet')
        return false
    return db.ref().child('users/'+params.uid).once('value').then(snapshot => {
        return db.ref().child('administration/configuration').once('value').then(snap2 => {
            var configuration = snap2.val()
            var returnFn = function(result) {
                if(result.vol) {
                    log.debug(params.uid, snapshot.val().name, "userList.js", "callVolunteers", "OK: citizen_builder_id = "+result.vol.id)
                    // This is what we want to happen: email was found in the CB db
                    volunteers.updateUser({uid: params.uid, result: result, userInfo: {}})
                }
                else {
                    // If email not found in CB, result.vol will be null
                    // do nothing in this case
                    log.debug(params.uid, snapshot.val().name, "userList.js", "callVolunteers", "EMAIL NOT FOUND IN CB: "+snapshot.val().email)
                }
            }

            volunteers.getUserInfoFromCB_byEmail(snapshot.val().email, returnFn, configuration)
        })
    })
})


exports.updateUser = functions.https.onRequest((req, res) => {

    var uid = req.body.uid
    var phone = req.body.phone

    return db.ref('/users/'+uid+'/phone').set(phone)
    .then(() => {
        return showPage(res)
    })

})