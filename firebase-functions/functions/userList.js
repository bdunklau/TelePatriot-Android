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


exports.manageUsers = functions.https.onRequest((req, res) => {

    return showPage(res)

})

var showPage = function(res) {
    return listUsers()
    .then(userList => {
        return listUsersAsHtml(userList)
    })
    .then(userListHtml => {
        var html = '<html><head></head><body><table width="100%"><tr><td colspan="33%">' + userListHtml + '</td><td colspan="33%">&nbsp;</td><td colspan="33%">&nbsp;</td></tr></table></body></html>'
        return res.status(200).send(html)
    })
}


var listUsers = function() {

    return db.ref(`users`).orderByChild('name').once('value').then(snapshot => {
        var users = []
        snapshot.forEach(function(child) {
            var phone = ''
            if(child.val().phone && child.val().phone.trim() != '') {
                phone = child.val().phone
            }
            users.push({uid: child.key, name: child.val().name, email: child.val().email, phone: phone})
        })
        return users
    })
}


var listUsersAsHtml = function(users) {
    var stuff = ''
    stuff += '<table><tr><td colspan="4"><b> <a href="/downloadUsers">Download</a> All Users</b></td></tr>'
    stuff += '<tr>'
    stuff += '<th style="'+tableheading+'">Name</th>'
    stuff += '<th style="'+tableheading+'">Email</th>'
    stuff += '<th style="'+tableheading+'">Phone</th>'
    stuff += '<th style="'+tableheading+'"></th>'
    stuff += '</tr>'
    for(var i=0; i < users.length; i++) {
        stuff += '<tr>'
        stuff += '<form method="post" action="/updateUser"><input type="hidden" name="uid" value="'+users[i].uid+'"/>'
        stuff += '<td style="'+style+'" valign="top">'+users[i].name+'</td>'
        stuff += '<td style="'+style+'" valign="top">'+users[i].email+'</td>'
        stuff += '<td style="'+style+'" valign="top"><input type="text" name="phone" placeholder="phone" size="15" value="'+users[i].phone+'"/></td>'
        stuff += '<th style="'+style+'"><input type="submit" value="save"></th>'
        stuff += '</form>'
        stuff += '</tr>'
    }
    stuff += '</table>'
    return stuff
}


exports.downloadUsers = functions.https.onRequest((req, res) => {
    var filename = 'TelePatriotUsers' // just a default value, expect this to be overwritten below

    return listUsers()
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

    return db.ref(`/users/${uid}/phone`).set(phone)
    .then(() => {
        return showPage(res)
    })

})