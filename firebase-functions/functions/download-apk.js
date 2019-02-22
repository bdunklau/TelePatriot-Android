'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')

/**
firebase deploy --only functions:downloadApk
**/

exports.downloadApk = functions.https.onRequest((req, res) => {
    var html = thePage()
    return res.status(200).send(html)
})

var downloadUrl = 'https://drive.google.com/open?id=1KgFGMDyLZsHzSlT0Lc2bZOpd1i1p4wZY'
var version = 'v79'

var thePage = function() {
    var html = ''
    html += '<html><head></head><body>'
    html += '<P>&nbsp;'
    html += '<center><span style="font-family:Tahoma;font-size:36pt;font-weight:bold">TelePatriot for Android</center>'
    html += '<P>&nbsp;<P>&nbsp;'
    html += '<center><a style="font-family:Tahoma;font-size:36pt" href="'+downloadUrl+'">Download '+version+'</a></center>'
    html += '</body></html>'
    return html
}