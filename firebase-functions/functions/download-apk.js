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

var thePage = function() {
    var html = ''
    html += '<html><head><title>TelePatriot for Android</title></head><body>'
    html += '<P>&nbsp;'
    html += '<center><span style="font-family:Tahoma;font-size:36pt;font-weight:bold">TelePatriot for Android</center>'

    html += '<P>&nbsp;<P>&nbsp;'
    html += '<center><a style="font-family:Tahoma;font-size:36pt" href="https://drive.google.com/file/d/1Dnu3eoIQ9ooWYzIuS3_vWK8w_ro7CL70/view?usp=sharing">Download v81</a></center>'

    html += '</body></html>'
    return html
}