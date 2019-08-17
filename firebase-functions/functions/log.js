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
exports.logByUser = functions.database.ref('log/all-logs/{key}').onCreate((snapshot, context) => {
    var data = snapshot.val()
    if(!data.uid || data.uid == 'uid not available')
        return false    // See User.getUid() and TPUser.getUid() for 'uid not available'

    var entry = {uid: data.uid,
                name: data.name,
                class: data.class,
                method: data.method,
                message: data.message,
                level: data.level,
                date_ms: data.date_ms,
                date: data.date  }

    var key = db.ref('log/by-user').child(data.uid).push().getKey()
    var updates = {}
    updates['log/by-user/'+data.uid+'/'+key+'/uid'] = data.uid
    updates['log/by-user/'+data.uid+'/'+key+'/class'] = data.class
    updates['log/by-user/'+data.uid+'/'+key+'/method'] = data.method
    updates['log/by-user/'+data.uid+'/'+key+'/message'] = data.message
    updates['log/by-user/'+data.uid+'/'+key+'/level'] = data.level
    updates['log/by-user/'+data.uid+'/'+key+'/date'] = data.date
    updates['log/by-user/'+data.uid+'/'+key+'/date_ms'] = data.date_ms
    if(data.name) {
        updates['log/by-user/'+data.uid+'/'+key+'/name'] = data.name
        updates['log/user-list/'+data.uid+'/name'] = data.name
        updates['log/user-list/'+data.uid+'/name_lower'] = data.name.toLowerCase()
    } else {
        updates['log/by-user/'+data.uid+'/'+key+'/name'] = 'undefined'
        updates['log/user-list/'+data.uid+'/name'] = 'undefined'
        updates['log/user-list/'+data.uid+'/name_lower'] = 'undefined'
    }
    updates['log/user-list/'+data.uid+'/updated_ms'] = data.date_ms
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


exports.propTaxRally = functions.https.onRequest((req, res) => {
    var html = ''
    html += '<html><head>'
    html += '<style>'
    html += '.a1 {font-family: Verdana; font-size: 32pt; font-weight:bold}\n'
    html += '.a2 {font-family: Verdana; font-size: 32pt; font-weight:normal}\n'
    html += '.s1 {margin-top:64; margin-bottom:128; margin-left:18; margin-right:18}\n'
    html += '.s2 {margin-top:120; margin-bottom:2; margin-left:18; margin-right:18}\n'
    html += '.s3 {margin-top:0; margin-bottom:0; margin-left:18; margin-right:18}\n'
    html += '.s4 {margin-top:300; margin-bottom:0; margin-left:18; margin-right:18}\n'
    html += '.s5 {margin-top:128; margin-bottom:2; margin-left:18; margin-right:18}\n'
    html += '.s6 {margin-top:16; margin-bottom:2; margin-left:18; margin-right:18}\n'
    html += '.last {margin-top:16; margin-bottom:64; margin-left:18; margin-right:18}\n'
    html += '</style>\n'
    html += '</head>\n'
    html += '<body>\n'
    html += '<img src="https://i.imgur.com/HYOMYhI.png" width="100%"><P/>&nbsp;<P/>&nbsp;\n'
    html += '<center><span class="a1">The Eyes of Texas are Upon <del>You</del> <span style="color:#ff0000"><i>Them</i></span></span> </center>\n'
    html += '<div class="a1 s1">Welcome to the Grassroots Property Tax Rally!</div>\n'

    html += '<div class="a1 s2"><a class="a1" href="https://wrm.capitol.texas.gov/home" target="wrm">Who Represents Me?</a></div>\n'
    html += '<div class="a2 s3">Enter your address to look up your Rep and Senator</div>\n'

    html += '<div class="a1 s2"><a class="a1" href="https://capitol.texas.gov/Members/Members.aspx?Chamber=H" target="house">House Directory</a></div>\n'
    html += '<div class="a2 s3">Find your Representative\'s office and phone number here</div>\n'

    html += '<div class="a1 s2"><a class="a1" href="https://capitol.texas.gov/Members/Members.aspx?Chamber=S" target="senate">Senate Directory</a></div>\n'
    html += '<div class="a2 s3">Find your Senator\'s office and phone number here</div>\n'

    html += '<div class="a1 s2"><a class="a1" href="https://www.youtube.com/playlist?list=PLjKLuNPsBt4oPPdh7tVxbcdv8KlbI3P9I" target="senate">Video: <span class="a2">How to Send a Note to Your Legislators When They are on the House or Senate Floor</span></a></div>\n'
    html += '<div class="a2 s3">This video shows you how to send a hand written note to your Rep or Senator while they are in session.  This is a <b>powerful way to get their attention</b></div>\n'


    html += '<div class="a1 s2"><a class="a1" href="https://www.youtube.com/watch?v=P7bMQQLXGSQ&t=159s" target="tour">Video: <span class="a2">Texas Capitol Virtual Tour</span></a></div>\n'
    html += ' <div class="a2 s3">This video...\n'
    html += ' 	<ul class="a2">\n'
    html += ' 	<li class="a2">shows you how to look up your representatives on the Capitol Directory (North entrance)</li>\n'
    html += ' 	<li class="a2">shows you where the elevators are (North entrance)</li>\n'
    html += ' 	<li class="a2">shows you how to get to the Capitol Extension, where most legislator offices and committee rooms are</li>\n'
    html += ' 	<li class="a2">shows you how to register support or opposition on bills being heard by committees</li>\n'
    html += ' 	</ul>\n'
    html += ' </div>\n'



    html += '<div class="a1 s4">Brought to you by...</div>\n'
    html += '<div class="a2 s3">This awesome page is brought to you by the <a href="https://www.conventionofstates.com" target="cos">Convention of States</a></div>\n'

    html += '<div class="a1 s2">Join the Convention of States <a href="https://www.conventionofstates.com/take_action/volunteer" target="vol">Grassroots Army</a></div>\n'

    html += '<div class="a1 s5">Follow the Convention of States on...</div>\n'
    html += '<div class="a2 s6"><a href="https://www.facebook.com/conventionofstates/" target="cosfb">Facebook</a> | <a href="https://www.twitter.com/COSProject/" target="costw">Twitter</a> | <a href="https://www.youtube.com/channel/UCC0eXtGEMvjxpdYQl2LUiVw" target="cosyt">YouTube</a></div>\n'

    html += '<div class="a1 s5">Follow the Convention of States <i>Texas</i> on...</div>\n'
    html += '<div class="a2 last"><a href="https://www.facebook.com/COSProjectTX/" target="costxfb">Facebook</a> | <a href="https://www.twitter.com/COSProjectTX/" target="costxtw">Twitter</a></div>\n'

    html += '</body></html>'
    return res.status(200).send(html);
})