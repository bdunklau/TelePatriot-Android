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

// for callling OpenStates API
var request = require('request')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

var parms = ['phone', 'fb', 'fbknown', 'google', 'googleknown']


var generateText = function(response, ids) {
    var id = response.id
    var html = ''
    html += response.html.text
    if(response.html.choices) {
        html += ' '+choices(response, ids)
    }
    return html
}

// creates just one field, not all the hidden fields for each req parm
var generateFormField = function(args) {
    return args.text+'<br/><input type="text" name="'+args.fieldname+'" placeholder="'+args.placeholder+'"/> &nbsp;&nbsp; <input type="submit" value="submit"/>'
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
     'html': {text: 'Do you remember what email address you use for Facebook?', parm:'fbknown', choices:['yes', 'no']},
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
     'html': {text: 'Do you remember what email address you use for Facebook?', parm:'fbknown', choices:['yes', 'no']},
     'htmlfunction': generateText}, // next: do you know what your facebook email address is?

    {'input': {'phone':'iPhone', 'fb':'yes',
     'id':'80',
    'html': {text: 'Enter your Facebook email address', fieldname: 'email', placeholder:'Facebook email address'}},
    'htmlfunction': generateFormField},    // next: Enter your Facebook email address

    {'input': {'phone':'iPhone', 'fb':'yes', 'fbknown':'no'},
     'id':'90',
     'html': {text: 'Do you have a Google account?', parm:'google', choices:['yes', 'no']},
     'htmlfunction': generateText},  // next: do you have a google account?

    {'input': {'phone':'iPhone', 'fb':'yes', 'fbknown':'no', 'google':'yes'},
     'id':'100',
     'html': {text: 'Do you remember what email address you use for Google?', parm:'googleknown', choices:['yes', 'no']},
     'htmlfunction': generateText}, // next: do you know what your google email address is?

    {'input': {'phone':'iPhone', 'fb':'yes', 'fbknown':'no', 'google':'yes', 'googleknown':'yes'},
     'id':'110',
     'html': {text: 'Enter your Google email address', fieldname: 'email', placeholder:'Google email address'},
     'htmlfunction': generateText},    // next: Enter your Google email address

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
    'html': {text: 'Do you remember what email address you use for Google?', parm:'googleknown', choices:['yes', 'no']},
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

var generateHiddenFields = function(args) {
    return fieldit(args, 'hidden')
}

// constructs the <a>yes</a>  <a>no</a>  html string
var choices = function(response, ids) {
    var options = _.map(response.html.choices, function(choice) {
        var otherparms = parmit(response.input)
        var allparms = response.html.parm+'='+choice
        if(otherparms && otherparms != '')
            allparms += '&'+otherparms
        allparms += '&'+ids
        allparms += '&id='+response.id
        return '<a href="/amiready?'+allparms+'">'+choice+'</a>'
    })
    return _.join(options, '&nbsp;&nbsp;&nbsp;')
}

exports.amiready = functions.https.onRequest((req, res) => {

    var ids = ''

    // We come to /amiready over and over again but with different parms each time
    // So we have to figure out what parms we got each time...
    var thevals = thevalues(req, parms)
    var hiddenFields = generateHiddenFields(thevals)
    var nextup = _.find(responses, {'input': thevals})
    console.log('thevals:', thevals)
    console.log('nextup:', nextup)

    // The first time we come to this page, we have no parms
    // so we take the first item from 'responses' and display it
    if(!req.query.ids) {
        ids = responses[0].id
    }
    else {
        ids = req.query.ids
        ids += ','+nextup.id
    }

    var id = ''
    if(!req.query.id) {
        id = responses[0].id
    }
    else id = req.query.id


    return res.status(200).send(xxx({id: id, ids: ids, hiddenFields: hiddenFields, nextup: nextup}))
})

var xxx = function(stuff) {
    var ids = 'ids='+stuff.ids

    // the id's give us the history of how the user answered
    var idList = _.split(stuff.ids, ',')
    var responseHistory = getResponseHistory(stuff.id, idList)

    //responseHistory.push(stuff.nextup)
    console.log('responseHistory:', responseHistory)

    var html = ''
    html += '<html><head></head><body>'
    html += '<form method="post" action="/amiready">'
    html += stuff.hiddenFields
    var htmls = _.map(responseHistory, function(response) {
        var htmlfunc = response.htmlfunction
        return htmlfunc(response, ids)
    })
    html += _.join(htmls, '<br/>')

    html += '</form></body></html>'
    return html
}

var getResponseHistory = function(id, idListX) {
    console.log('idList:', idListX)
    var idx = _.findIndex(idListX, id)
    var idList = _.slice(0, idx+2)

    var responseHistory = _.map(idList,
        function(iterId) {
            return _.find(responses, {'id': iterId})
        }
    )

    console.log('1) responseHistory:', responseHistory)

    _.remove(responseHistory, function(response) {
        if(response) return false // don't remove if the object is defined
        else return true  // only removed undefined objects
    })

    console.log('2) responseHistory:', responseHistory)
    return responseHistory
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
var fieldit = function(stuff, type) {
    var keys = Object.keys(stuff)
    var fields = _.map(keys, function(key) {
        return '<input type="'+type+'" name="'+key+'" value="'+stuff[key]+'"/>'
    })
    return _.join(fields, ' ')
}