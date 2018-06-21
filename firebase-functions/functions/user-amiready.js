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

// for callling OpenStates API
var request = require('request')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

var parms = ['phone', 'fb', 'fbknown', 'google', 'googleknown']


var generateText = function(response, historyIds) {
    var id = response.id
    var html = '<tr>'
    html += '<td>'+response.html.text+'</td>'
    if(response.html.choices) {
        html += choices(response, historyIds)
    }
    html += '</tr>'
    return html
}

// creates just one field, not all the hidden fields for each req parm
var generateFormField = function(response, historyIds) {
    var html = '<tr><td colspan="3">'
    html += response.html.text+'<p/><input type="text" name="'+response.html.fieldname+'" size="50" placeholder="'+response.html.placeholder+'"/>'
    html += '&nbsp;&nbsp; <input type="submit" value="submit" style="height:50px"/>'
    html += '</td></tr>'
    return html
}


var responses = [
    {'input':{},
     'id':'0',
     'html': {text: 'What kind of phone do you have?', parm: 'phone', choices:['Android', 'iPhone']},
     'htmlfunction': generateText},

    {'input': {'phone':'Android'},
     'id':'10',
     'html':{text: 'Do you have a Facebook account?', parm:'fb', choices:['yes', 'no']},
     'htmlfunction': generateText},  // next: do you have a facebook account?

    {'input': {'phone':'Android', 'fb':'yes'},
     'id':'20',
     'html': {text: 'Do you remember what your Facebook email address is?', parm:'fbknown', choices:['yes', 'no']},
     'htmlfunction': generateText}, // next: do you know what your facebook email address is?

    {'input': {'phone':'Android', 'fb':'yes', 'fbknown':'yes'},
     'id':'30',
     'html': {text: 'Enter your Facebook email address', fieldname: 'email', placeholder:'Facebook email address'},
     'htmlfunction': generateFormField},    // next: Enter your Facebook email address

    {'input': {'phone':'Android', 'fb':'yes', 'fbknown':'no'},
     'id':'40',
     'html': {text: '<b>You are not ready</b><br/>Android users must have a Facebook account to login to TelePatriot'},
     'htmlfunction': generateText}, // next: Android users must have a facebook account to use TelePatriot

    {'input': {'phone':'Android', 'fb':'no'},
     'id':'50',
     'html': {text: '<b>You are not ready</b><br/>Android users must have a Facebook account to login to TelePatriot'},
     'htmlfunction': generateText},



    {'input': {'phone':'iPhone'},
     'id':'60',
     'html': {text: 'Do you have a Facebook account?', parm:'fb', choices:['yes', 'no']},
     'htmlfunction': generateText},  // next: do you have a facebook account?

    {'input': {'phone':'iPhone', 'fb':'yes'},
     'id':'70',
     'html': {text: 'Do you remember what your Facebook email address is?', parm:'fbknown', choices:['yes', 'no']},
     'htmlfunction': generateText}, // next: do you know what your facebook email address is?

    {'input': {'phone':'iPhone', 'fb':'yes',
     'id':'80',
    'html': {text: 'Enter your Facebook email address', fieldname: 'email', placeholder:'Facebook email address'}},
    'htmlfunction': generateFormField},    // next: Enter your Facebook email address

    {'input': {'phone':'iPhone', 'fb':'yes', 'fbknown':'yes'},
     'id':'85',
     'html': {text: 'Enter your Facebook email address', fieldname: 'email', placeholder:'Facebook email address'},
     'htmlfunction': generateFormField},    // next: Enter your Facebook email address

    {'input': {'phone':'iPhone', 'fb':'yes', 'fbknown':'no'},
     'id':'90',
     'html': {text: 'Do you have a Google account?', parm:'google', choices:['yes', 'no']},
     'htmlfunction': generateText},  // next: do you have a google account?

    {'input': {'phone':'iPhone', 'fb':'yes', 'fbknown':'no', 'google':'yes'},
     'id':'100',
     'html': {text: 'Do you remember what your Google email address is?', parm:'googleknown', choices:['yes', 'no']},
     'htmlfunction': generateText}, // next: do you know what your google email address is?

    {'input': {'phone':'iPhone', 'fb':'yes', 'fbknown':'no', 'google':'yes', 'googleknown':'yes'},
     'id':'110',
     'html': {text: 'Enter your Google email address', fieldname: 'email', placeholder:'Google email address'},
     'htmlfunction': generateFormField},    // next: Enter your Google email address

    {'input': {'phone':'iPhone', 'fb':'yes', 'fbknown':'no', 'google':'yes', 'googleknown':'no'},
     'id':'120',
     'html': {text: '<b>You are not ready</b><br/>iPhone users must login to TelePatriot using either a Facebook account or a Google account'},
     'htmlfunction': generateText},

    {'input': {'phone':'iPhone', 'fb':'yes', 'fbknown':'no', 'google':'no'},
     'id':'130',
     'html': {text: '<b>You are not ready</b><br/>iPhone users must login to TelePatriot using either a Facebook account or a Google account'},
     'htmlfunction': generateText},




    {'input': {'phone':'iPhone', 'fb':'no'},
     'id':'140',
    'html':{text: 'Do you have a Google account?', parm:'google', choices:['yes', 'no']},
    'htmlfunction': generateText},  // next: do you have a google account?

    {'input': {'phone':'iPhone', 'fb':'no', 'google':'yes'},
     'id':'150',
    'html': {text: 'Do you remember what your Google email address is?', parm:'googleknown', choices:['yes', 'no']},
    'htmlfunction': generateText}, // next: do you know what your google email address is?

    {'input': {'phone':'iPhone', 'fb':'no', 'google':'yes', 'googleknown':'yes'},
     'id':'160',
     'html': {text: 'Enter your Google email address', fieldname: 'email', placeholder:'Google email address'},
     'htmlfunction': generateFormField},    // next: Enter your Google email address

    {'input': {'phone':'iPhone', 'fb':'no', 'google':'yes', 'googleknown':'no'},
     'id':'170',
    'html': {text: '<b>You are not ready</b><br/>iPhone users must login to TelePatriot using either a Facebook account or a Google account'},
    'htmlfunction': generateText},

    {'input': {'phone':'iPhone', 'fb':'no', 'google':'no'},
     'id':'180',
     'html': {text: '<b>You are not ready</b><br/>iPhone users must login to TelePatriot using either a Facebook account or a Google account'},
     'htmlfunction': generateText}

]

var generateHiddenFields = function(args, historyIds, id) {
    return fieldit(args, 'hidden', historyIds, id)
}

// constructs the <a>yes</a>  <a>no</a>  html string
var choices = function(response, historyIds) {
    var options = _.map(response.html.choices, function(choice) {
        var otherparms = parmit(response.input)
        var allparms = response.html.parm+'='+choice
        if(otherparms && otherparms != '')
            allparms += '&'+otherparms
        if(historyIds)
            allparms += '&historyIds='+historyIds
        allparms += '&id='+response.id
        return '<td><a href="/amiready?'+allparms+'">'+choice+'</a></td>'
    })
    return _.join(options, ' ')
}

exports.amiready = functions.https.onRequest((req, res) => {

    var id
    var historyIds
    if(req.query.id) {
        id = req.query.id
    }
    else if(req.body.id) {
        id = req.body.id
    }

    if(req.query.historyIds)
        historyIds = req.query.historyIds
    else if(req.body.historyIds)
        historyIds = req.body.historyIds

    if(id) {
        if(historyIds) {
            historyIds += ',' + id
        }
        else historyIds = id
    }

    console.log("req.query.id: ", req.query.id, " id: ", id, " historyIds: ", historyIds)

    // What items from 'responses' are we going to display?
    // We're going to display all the items from the history parm, i.e. historyIds=0,10,20

    // We're also going to compare the id parameter with the historyIds parameter in case the
    // user decides to change his answer to a previous question.  So in this case, we take the
    // id parameter and we check to see if it exists in the history.  If it does, we manipulate
    // the historyIds parameter and strip off all the ids in that string beginning with the
    // id parameter.  So historyIds=0,10,20 would become historyIds=0 if id=10
    if(id && historyIds && historyIds.indexOf(',') != -1) {
        var idlist = _.split(historyIds, ',')
        idlist = _.map(idlist, function(ii) { return parseInt(ii) })
        var idx = _.findIndex(idlist, function(ii) { return id == ii })
        console.log('id=', id, " idx=", idx, " idlist=", idlist)
        if(idx != -1) {
            idlist = _.slice(idlist, 0, idx+1)
            historyIds = _.join(idlist, ',')
        }
    }

    // We come to /amiready over and over again but with different parms each time
    // So we have to figure out what parms we got each time...
    var thevals = thevalues(req, parms)
    var hiddenFields = generateHiddenFields(thevals, historyIds, id)
    var nextup = _.find(responses, {'input': thevals})
    if(!nextup)
        nextup = responses[0]
    console.log('thevals:', thevals)
    console.log('nextup:', nextup)

    var pageElements = []
    if(historyIds && historyIds != '') {
        pageElements = _.map(_.split(historyIds, ','), function(hid) {
            console.log('hid: ', hid)
            return _.find(responses, {'id': hid})
        })
    }

    console.log('1) pageElements:', pageElements)
    console.log('historyIds:', historyIds)

    pageElements.push(nextup)
    console.log('2) pageElements:', pageElements)
    pageElements = _.filter(pageElements, function(ele) {
        if(!ele) return false
        if(ele == 'undefined') return false
        return true
    })
    console.log('3) pageElements:', pageElements)


    var pageParms = {}
    pageParms.pageElements = pageElements
    if(hiddenFields)
        pageParms.hiddenFields = hiddenFields
    if(historyIds)
        pageParms.historyIds = historyIds

    if(req.body.email) {
        citizen_builder_api.checkVolunteerStatus(req.body.email,
            function() {
                // good
                pageParms.email = req.body.email
                pageParms.readyOrNot = '<span style="display: inline-block; padding:10px; color:#ffffff; background-color:#009900">You are ready !</span>'
                return res.status(200).send(xxx(pageParms))
            },
            function() {
                // not good
                pageParms.email = req.body.email
                pageParms.readyOrNot = '<span style="display: inline-block; padding:10px;background-color:#ffff00">You are not ready</span><P/>'
                pageParms.readyOrNot += 'You need to sign both the <a href="https://www.conventionofstates.com">petition</a> '
                pageParms.readyOrNot += 'and the <a href="https://esign.coslms.com:8443/S/COS/Transaction/Volunteer_Agreement_Manual">confidentiality agreement</a> using your Facebook or Google email address'
                return res.status(200).send(xxx(pageParms))
            })
    }
    else
        return res.status(200).send(xxx(pageParms))
})

var xxx = function(stuff) {

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
    html += '<h3>TelePatriot has legal and technical requirements<P/>Let\'s see if you\'re ready...</h3>'
    html += '<form method="post" action="/amiready">'
    if(stuff.hiddenFields)
        html += stuff.hiddenFields

    //console.log('stuff.pageElements:', stuff.pageElements)
    html += '<table border="0" cellpadding="3">'
    var htmls = _.map(stuff.pageElements, function(response) {
        var htmlfunc = response.htmlfunction
        return htmlfunc(response, stuff.historyIds)
    })
    html += _.join(htmls, ' ')
    html += '</table>'

    if(stuff.readyOrNot)
        html += '<P/>'+stuff.readyOrNot

    html += '</form></body></html>'
    return html
}


var thevalues = function(req, names) {
    var parmvalues = {}
    _.each(names, function(name) {
        if(req.query[name])
            parmvalues[name] = req.query[name]
        else if(req.body[name])
            parmvalues[name] = req.body[name]
    })
    return parmvalues
}

// create an http req parm string out of this object
// i.e.  {phone: 'iPhone', fb: 'yes'} => phone=iPhone&fb=yes
var parmit = function(stuff) {
    var keys = Object.keys(stuff)
    var keyVals = _.map(keys, function(key) {
        return key+'='+stuff[key]
    })
    return _.join(keyVals, '&')
}

// sort of like parmit, except that this function creates hidden form fields
// for every request parameter
var fieldit = function(stuff, type, historyIds, id) {
    var keys = Object.keys(stuff)
    var fields = _.map(keys, function(key) {
        return '<input type="'+type+'" name="'+key+'" value="'+stuff[key]+'"/>'
    })
    fields.push('<input type="'+type+'" name="historyIds" value="'+historyIds+'"/>')
    fields.push('<input type="'+type+'" name="id" value="'+id+'"/>')
    return _.join(fields, ' ')
}