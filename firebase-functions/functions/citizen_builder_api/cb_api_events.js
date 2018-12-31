'use strict';

const admin = require('firebase-admin')
const functions = require('firebase-functions')
const date = require('../dateformat')
const email_js = require('../email')

// create reference to root of the database
const db = admin.database()


/***
paste this on the command line...
firebase deploy --only functions:testViewCBAPIEvents
***/

exports.testViewCBAPIEvents = functions.https.onRequest((req, res) => {
    var limit = 50
    if(req.query.limit) limit = parseInt(req.query.limit)
    var html = ''
    html += '<html><head></head><body>'

    return getCBAPIEvents({limit: limit}).then(eventHtml => {
        html += eventHtml

        html += '</body></html>'
        return res.status(200).send(html)
    })
})

var blank = function(val) {
    return val ? val : ''
}


//            if(result.vol.state)
//                r.state = result.vol.state.toLowerCase()
//            r.uid = event.data.val().uid
//            r.volunteer_agreement_signed = result.vol.volunteer_agreement_signed


var getCBAPIEvents = function(stuff) {
    return db.ref('cb_api_events/all-events').orderByChild('date_ms').limitToLast(stuff.limit).once('value').then(snapshot => {
        var html = '<h3>cb_api_event/all-events</h3>'
        html += '<table border="1" cellspacing="0" cellpadding="2">'
        html += '<tr>'
        html +=     '<th>key</th>'
        html +=     '<th>address</th>'
        html +=     '<th>citizen_builder_id</th>'
        html +=     '<th>city</th>'
        html +=     '<th>date</th>'
        html +=     '<th>date_ms</th>'
        html +=     '<th>email</th>'
        html +=     '<th>event_type</th>'
        html +=     '<th>first_name</th>'
        html +=     '<th>is_banned</th>'
        html +=     '<th>last_name</th>'
        html +=     '<th>name</th>'
        html +=     '<th>petition_signed</th>'
        html +=     '<th>phone</th>'
        html +=     '<th>state</th>'
        html +=     '<th>uid</th>'
        html +=     '<th>valid</th>'
        html +=     '<th>volunteer_agreement_signed</th>'
        html += '</tr>'
        snapshot.forEach(function(child) {
            html += '<tr>'
            html +=     '<td nowrap>'+blank(child.key)+'</td>'
            html +=     '<td nowrap>'+blank(child.val().address)+'</td>'
            html +=     '<td>'+blank(child.val().citizen_builder_id)+'</td>'
            html +=     '<td>'+blank(child.val().city)+'</td>'
            html +=     '<td nowrap>'+blank(child.val().date)+'</td>'
            html +=     '<td>'+blank(child.val().date_ms)+'</td>'
            html +=     '<td>'+blank(child.val().email)+'</td>'
            html +=     '<td>'+blank(child.val().event_type)+'</td>'
            html +=     '<td>'+blank(child.val().first_name)+'</td>'
            html +=     '<td>'+blank(child.val().is_banned)+'</td>'
            html +=     '<td>'+blank(child.val().last_name)+'</td>'
            html +=     '<td nowrap>'+blank(child.val().name)+'</td>'
            html +=     '<td>'+blank(child.val().petition_signed)+'</td>'
            html +=     '<td>'+blank(child.val().phone)+'</td>'
            html +=     '<td>'+blank(child.val().state)+'</td>'
            html +=     '<td>'+blank(child.val().uid)+'</td>'
            html +=     '<td>'+blank(child.val().valid)+'</td>'
            html +=     '<td>'+blank(child.val().volunteer_agreement_signed)+'</td>'
            html += '</tr>'
        })
        html += '</table>'
        return html
    })
}