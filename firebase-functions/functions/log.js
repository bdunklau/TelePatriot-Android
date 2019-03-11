'use strict';

/********************************************************************************
See:  https://cloud.google.com/nodejs/docs/reference/compute/0.10.x/
********************************************************************************/

// external dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database()

/***
firebase deploy --only functions:testLog,functions:logByUser
***/

exports.testLog = functions.https.onRequest((req, res) => {
    var limit = 25
    var orderNamesBy = req.query.orderNamesBy ? req.query.orderNamesBy : 'updated_ms'
    if(req.query.limit) limit = parseInt(req.query.limit)
    var path = req.query.uid ? "log/by-user/"+req.query.uid : "log/all-logs"
    var orderLogsBy = req.query.level ? 'level' : 'date_ms'
    var expr = db.ref(path).orderByChild(orderLogsBy)
    if(req.query.level) expr = expr.equalTo(req.query.level)
    expr = expr.limitToLast(limit)
    return expr.once('value').then(snapshot => {
        var stuff = {logs: snapshot.val(), limit: limit, orderNamesBy: orderNamesBy}
        var html = logentries(stuff)
        stuff.logsAsHtml = html
        return stuff
    })
    .then(stuff => {
        return getUserList(stuff).then(userListHtml => {
            stuff.userList = userListHtml
            return stuff
        })
    })
    .then(stuff => {
        var html = page(stuff)
        return res.status(200).send(html)
    })
})

// display users sorted either alphabetically or sorted chronologically, so that the most
// recently active users are listed first
var getUserList = function(stuff) {
    var orderNamesBy = stuff.orderNamesBy ? stuff.orderNamesBy : 'updated_ms'
    var limit = stuff.limit ? stuff.limit : 25
    return db.ref('log/user-list').orderByChild(orderNamesBy).limitToLast(limit).once('value').then(snapshot => {
        var html = ''
        html += '<table border="1" cellspacing="0" cellpadding="2">'
        html +=     '<tr><th>Name</th></tr>'
        snapshot.forEach(function(child) {
            html += '<tr><td nowrap><a href="/testLog?uid='+child.key+'&limit='+limit+'&orderNamesBy='+orderNamesBy+'" title="View logs for '+child.val().name+'">'+child.val().name+'</a></td></tr>'
        })
        html += '</table>'
        return html
    })
}

// When a log entry is written at log/all-logs, we write essentially the same log entry at
// log/by-user/[user id] so that we can query for and display the log entries for a single user.
// Otherwise, we would have to write a "compound key" node containing user id and date_ms
// But sorting on user_id-date_ms isn't guaranteed to preserve the chronological order of the
// log entries
exports.logByUser = functions.database.ref('log/all-logs/{key}').onCreate(event => {
    if(!event.data.val().uid || event.data.val().uid == 'uid not available')
        return false    // See User.getUid() and TPUser.getUid() for 'uid not available'

    var entry = {uid: event.data.val().uid,
                name: event.data.val().name,
                class: event.data.val().class,
                method: event.data.val().method,
                message: event.data.val().message,
                level: event.data.val().level,
                date_ms: event.data.val().date_ms,
                date: event.data.val().date  }

    var key = db.ref('log/by-user').child(event.data.val().uid).push().getKey()
    var updates = {}
    updates['log/by-user/'+event.data.val().uid+'/'+key+'/uid'] = event.data.val().uid
    updates['log/by-user/'+event.data.val().uid+'/'+key+'/class'] = event.data.val().class
    updates['log/by-user/'+event.data.val().uid+'/'+key+'/method'] = event.data.val().method
    updates['log/by-user/'+event.data.val().uid+'/'+key+'/message'] = event.data.val().message
    updates['log/by-user/'+event.data.val().uid+'/'+key+'/level'] = event.data.val().level
    updates['log/by-user/'+event.data.val().uid+'/'+key+'/date'] = event.data.val().date
    updates['log/by-user/'+event.data.val().uid+'/'+key+'/date_ms'] = event.data.val().date_ms
    if(event.data.val().name) {
        updates['log/by-user/'+event.data.val().uid+'/'+key+'/name'] = event.data.val().name
        updates['log/user-list/'+event.data.val().uid+'/name'] = event.data.val().name
        updates['log/user-list/'+event.data.val().uid+'/name_lower'] = event.data.val().name.toLowerCase()
    } else {
        updates['log/by-user/'+event.data.val().uid+'/'+key+'/name'] = 'undefined'
        updates['log/user-list/'+event.data.val().uid+'/name'] = 'undefined'
        updates['log/user-list/'+event.data.val().uid+'/name_lower'] = 'undefined'
    }
    updates['log/user-list/'+event.data.val().uid+'/updated_ms'] = event.data.val().date_ms
    return db.ref('/').update(updates);
})

exports.debug = function(uid, name, file, funcName, message) {
    logit(uid, name, file, funcName, message, "debug")
}

exports.error = function(uid, name, file, funcName, message) {
    logit(uid, name, file, funcName, message, "error")
}

var logit = function(uid, name, file, funcName, message, level) {
    var entry = {class: file, date: date.asCentralTime(), date_ms: date.asMillis(), level: level, message: message,
                method: funcName, name: name, uid: uid}
    db.ref('log/all-logs').push().set(entry)
}

var page = function(stuff) {
    var orderNamesBy = stuff.orderNamesBy ? stuff.orderNamesBy : 'updated_ms'
    var limit = stuff.limit ? stuff.limit : 25
    var html = ''
    html += '<html><head></head><body>'
    html += '<h4>'
    html +=     'Sort Names: '
    html +=     '<a href="/testLog?limit='+limit+'&orderNamesBy=name_lower">A - Z</a> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; '
    html +=     '<a href="/testLog?limit='+limit+'&orderNamesBy=updated_ms">Most Recent</a>'
    html +=     '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; '
    html +=     'Logs: '
    html +=     '<a href="/testLog?limit='+limit+'&orderNamesBy='+orderNamesBy+'">View All</a> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; '
    html +=     '<a href="/testLog?level=error&limit='+limit+'&orderNamesBy='+orderNamesBy+'">View Errors</a>'
    html += '</h4>'
    html += '<table border="0" cellspacing="0" cellpadding="2">'
    html += '<tr>'
    html +=     '<td valign="top">'+stuff.userList+'</td>'
    html +=     '<td valign="top">'+stuff.logsAsHtml+'</td>'
    html += '</tr>'
    html += '</table>'
    html += '</body></html>'
    return html
}

var logentries = function(stuff) {
    var orderNamesBy = stuff.orderNamesBy ? stuff.orderNamesBy : 'updated_ms'
    var limit = stuff.limit ? stuff.limit : 25
    var logs = stuff.logs
    var html = ''
    html += '<table border="1" cellspacing="0" cellpadding="2">'
    html += '<tr>'
    html +=     '<th>date</th>'
    html +=     '<th>level</th>'
    html +=     '<th>name</th>'
    html +=     '<th>class</th>'
    html +=     '<th>method</th>'
    html +=     '<th>message</th>'
    html +=     '<th>uid</th>'
    html += '</tr>'
    _.each(logs, function(log) {
        var style = log.level == 'error' ? 'style="background-color:#ff0000;color:#ffffff"' : ''
        html += '<tr '+style+'>'
        html +=     '<td nowrap>'+log.date+'</td>'
        html +=     '<td>'+log.level+'</td>'
        html +=     '<td nowrap><a href="/testLog?limit='+limit+'&uid='+log.uid+'&orderNamesBy='+orderNamesBy+'">'+log.name+'</a></td>'
        html +=     '<td nowrap>'+log.class+'</td>'
        html +=     '<td>'+log.method+'</td>'
        html +=     '<td>'+log.message+'</td>'
        html +=     '<td>'+log.uid+'</td>'
        html += '</tr>'
    })
    html += '</table>'
    return html
}