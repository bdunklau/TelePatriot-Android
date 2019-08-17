'use strict';

/*************************************************************************************************
This is a web page that people can go to to tell them if they are ready to download TelePatriot

We don't want people downloading the app if they haven't first met the legal obligations to participate.

Legal Obligations:
1) Petition signed
2) Conf agreement signed

This page asks them if they've signed both of these WITH THEIR FACEBOOK OR GOOGLE EMAIL ADDRESS
because that's how they will be logging in to TP.
*************************************************************************************************/

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const citizen_builder_api = require('./citizen_builder_api/checkVolunteerStatus')
const volunteers = require('./citizen_builder_api/volunteers')

// for callling OpenStates API
var request = require('request')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


/***
paste this on the command line...
firebase deploy --only functions:amiready
***/
exports.amiready = functions.https.onRequest((req, res) => {

    var allinfo = false
    if(req.query.allinfo=='true' || req.body.allinfo=='true') allinfo = true

    if(req.body.email) {
        var email = req.body.email.trim()
        return db.ref().child('administration/configuration').once('value').then(snap2 => {
            var configuration = snap2.val()
            var returnFn = function(result) {
                if(result.vol) {
                    // email was found in CB
                    // now display whether the person is permitted or not
                    var html = thePage({results: true, found: true, email: email, vol: result.vol, allinfo: allinfo})
                    return res.status(200).send(html)
                }
                else {
                    // email not found in CB
                    var html = thePage({results: true, found: false, email: email})
                    return res.status(200).send(html)
                }
            }

            volunteers.getUserInfoFromCB_byEmail(email, returnFn, configuration)
        })
    }
    else {
        var html = thePage({results: false, allinfo: allinfo})
        return res.status(200).send(html)
    }
})

var thePage = function(stuff) {
    var petitionLink = '<a href="https://conventionofstates.com/?ref=1930" target="petition">COS petition</a>'
    var caLink = '<a href="https://legal.conventionofstates.com/S/COS/Transaction/Volunteer_Agreement_Manual" target="ca">COS volunteer agreement</a>'

    var html = ''
    html += '<html><head>'
    html += '<title>Am I Ready for TelePatriot?</title>'
    html += '<style>'
    html += 'body, div, table, tr, td, h2 { font-family:\'Tahoma\' }'
    html += 'input { height:30px; font-size: 1em; }'
    html += '</style>'
    html += '</head>'
    html += '<body style="margin-left:100">'
    html += '<h2>Are You Ready to Download TelePatriot?<P/></h2>'
    html += '<h3>TelePatriot has legal requirements<P/>Enter your email address below to see if you\'re ready...</h3>'
    html += '<form method="post" action="/amiready">'
    html +=     '<input type="text" name="email" placeholder="Email" size="35" > <input type="submit" value="Check Email">'
    html +=     '<input type="hidden" name="allinfo" value="'+stuff.allinfo+'">'
    if(stuff.results) {
        if(stuff.found) {
            html += '<P/>'
            html += isAllowed(stuff)
            html += '<P/>Petition Signed: '
            html += coloredVal(stuff.vol.petition_signed, "Yes")+', '
            html += 'Volunteer Agreement Signed: '
            html += coloredVal(stuff.vol.volunteer_agreement_signed, "Yes")+', '
            var needToSignCA = !stuff.vol.volunteer_agreement_signed // will be either true or false
                            || (stuff.vol.volunteer_agreement_signed+'').toLowerCase() == 'no'
                            || (stuff.vol.volunteer_agreement_signed+'').toLowerCase() == 'false'
            if(needToSignCA) {
                html += '<P/><b>In order to use TelePatriot, you must sign the '+caLink+' using the email address '+stuff.email+'</b>'
            }

//            html += 'Banned: '
//            html += coloredVal(stuff.vol.is_banned, "No")
            if(stuff.allinfo) {
                html += '<P/>'
                html += '<table border="0">'
                var s1 = '<B>'
                var s2 = '</B>'
                html += '<tr><td>'+s1+'CitizenBuilder ID:'+s2+'</td><td>'+stuff.vol.id+'</td></tr>'
                html += '<tr><td>'+s1+'Name:'+s2+'</td><td>'+stuff.vol.first_name+' '+stuff.vol.last_name+'</td></tr>'
                html += '<tr><td>'+s1+'Roles:'+s2+'</td><td>'+_.join(stuff.vol.roles, ', ')+'</td></tr>'
                html += '<tr><td>'+s1+'Address:'+s2+'</td><td>'+stuff.vol.address+'</td></tr>'
                html += '<tr><td>'+s1+'City:'+s2+'</td><td>'+stuff.vol.city+'</td></tr>'
                html += '<tr><td>'+s1+'State:'+s2+'</td><td>'+stuff.vol.state+'</td></tr>'
                html += '<tr><td>'+s1+'Primary Email in CB:'+s2+'</td><td>'+stuff.vol.email+'</td></tr>'
                html += '<tr><td>'+s1+'Phone:'+s2+'</td><td>'+stuff.vol.phone+'</td></tr>'
                html += '</table>'
            }
        }
        else {
            html += '<P/><b>'+stuff.email+' has not signed the '+petitionLink+' or the '+caLink+'</b>'
            html += '<P/>Please sign each by clicking the links above. <b>You must sign each document using the email address '+stuff.email+'</b>'
            html += '<P/>If you are certain this email address belongs to a COS supporter, ask that person to add this address to '
            html += 'his/her CB profile and then resubmit this form.'
        }
    }
    html += '</form></body></html>'
    return html
}


var isAllowed = function(stuff) {
    var vol = stuff.vol
    var email = stuff.email
    var p = vol.petition_signed
    var c = vol.volunteer_agreement_signed
    var b = vol.is_banned
    var y = p==true && c==true && b!=true
    if(y) return '<span style="color:#008B00"><b>'+email+' is allowed to use TelePatriot</b></span>'
    else return '<span style="color:#e5125d"><b>'+email+' is not allowed to use TelePatriot</b></span>'
}


var coloredVal = function(b, goodVal) {
    var val = yesno(b)
    var c = color(val, goodVal)
    return '<span style="color:'+c+'">'+val+'</span>'
}


var color = function(val, goodVal) {
    var good = "#008B00"
    var bad = "#e5125d"
    var neutral = "#000000"
    if(val == "unknown") return neutral
    else if(val == goodVal) return good
    else return bad
}

var yesno = function(val) {
    if(val == true) return "Yes"
    else if(val == false) return "No"
    else return "unknown"
}
