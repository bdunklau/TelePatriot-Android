'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

var style = "font-family:Arial;font-size:12px"
var tableheading = style + ';background-color:#ededed'

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


/**
firebase deploy --only functions:manageUsers,functions:downloadUsers,functions:updateUser
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
            var phone = ''
            if(child.val().phone && child.val().phone.trim() != '') {
                phone = child.val().phone
            }
            var roles = []
            var auser = {uid: child.key, name: child.val().name, email: child.val().email, phone: phone,
                        has_signed_petition: child.val().has_signed_petition, has_signed_confidentiality_agreement: child.val().has_signed_confidentiality_agreement,
                        is_banned: child.val().is_banned}
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
    stuff += '<th style="'+tableheading+'">Name</th>'
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
        stuff += '<td style="'+style+'" valign="top">'+users[i].name+'</td>'
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


exports.updateUser = functions.https.onRequest((req, res) => {

    var uid = req.body.uid
    var phone = req.body.phone

    return db.ref('/users/'+uid+'/phone').set(phone)
    .then(() => {
        return showPage(res)
    })

})