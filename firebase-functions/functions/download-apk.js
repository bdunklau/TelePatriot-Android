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
    html += '<html>'
    html += '<head>'
    html += '<title>TelePatriot for Android</title>'
    html += '<style>'
    html += '.heading { font-family:Tahoma;font-size:36pt;font-weight:bold }'
    html += '.normal { font-family:Tahoma;font-size:28pt; }'
    html += '</style>'
    html += '</head>'
    html += '<body>'
    html += '<P>&nbsp;'
    html += '<center>'
    html += '    <span class="heading">TelePatriot for Android</span>'
    html += '</center>'
    html += '<P>&nbsp;'
    html += '<center>'
    html += '    <a class="heading" href="https://drive.google.com/uc?id=14GxJuGMlC8pzSIp7xi_jVpLOyNrwV5M5">Download v83</a>'
    html += '</center>'

    html += '<P>&nbsp;<P>&nbsp;'
    html += '<span class="heading">Video Instructions</span>'
    html += '<P/><span class="normal">Watch this video <i>or</i> read the rest of the page below for instructions on downloading and installing TelePatriot using the link above</span>'
    html += '<P/><a href="https://www.youtube.com/watch?v=vfE9HbBX4JQ" target="video"><img src="https://drive.google.com/uc?id=1fL6P1wZ_XZjWSA75fIZ1qhiTVwypaFVo" width="90%"></a>'

    html += '<P>&nbsp;<P>&nbsp;'
    html += '<span class="heading">Open With...</span>'
    html += '<P/><span class="normal">If you are asked how you want to open this file, choose "Package installer"</span>'
    html += '<P/><img src="https://drive.google.com/uc?id=17R8DknO9eHftqsTm7I3r8GEK1TCYQWdH">'

    html += '<P>&nbsp;<P>&nbsp;'
    html += '<span class="heading">Trouble Downloading?</span>'
    html += '<P/><span class="normal">Are you seeing this or some similar error when trying to download?</span>'
    html += '<P/><img src="https://drive.google.com/uc?id=1Z0x2ZhkgM3bx4OYa42r8dwCbLlDxnnPT">'

    html += '<P>&nbsp;<P>&nbsp;'
    html += '<span class="heading">Fix It</span>'
    html += '<P/><span class="normal">Here\'s how you fix it...</span>'
    html += '<P/><span class="normal">Touch Settings on your phone and go to Security</span>'
    html += '<P/><span class="normal">Turn off "App permission monitor" (we\'ll turn it back on at the end)</span>'
    html += '<P/><span class="normal">Touch "Install unknown apps"</span>'
    html += '<P/><img src="https://drive.google.com/uc?id=1DIZ4GAgCZuyINhzqLkVt6fkcJVHvzTgv">'

    html += '<P>&nbsp;<P>&nbsp;'
    html += '<P/><span class="heading">Allow from this source</span>'
    html += '<P/><span class="normal">Turn on "Allow from this source"  (Yeah, that\'s a scary looking message but this is the same app that is in the Play store right now, just a later version)</span>'
    html += '<P/><img src="https://drive.google.com/uc?id=1WzWCcdCweY3t4Dgehjwz8qlHRFQcS2RH">'

    html += '<P>&nbsp;<P>&nbsp;'
    html += '<P/><span class="heading">Install</span>'
    html += '<P/><span class="normal">Touch Install on this screen to complete the installation</span>'
    html += '<P/><img src="https://drive.google.com/uc?id=1W1Gq_kYaRj4a4ywqYoH3ZqDjy1N6uMmM">'

    html += '<P>&nbsp;<P>&nbsp;'
    html += '<P/><span class="heading">Finished</span>'
    html += '<P/><span class="normal">When finished, you should see something like this</span>'
    html += '<P/><img src="https://drive.google.com/uc?id=12AmvvhRm-SPi_uRHfwchtNQvv3vR1gjz">'

    html += '<P>&nbsp;<P>&nbsp;'
    html += '<P/><span class="heading">Check Version</span>'
    html += '<P/><span class="normal">Open the app</span>'
    html += '<P/><span class="normal">Pull out the menu and check the version.  It should be at least 81</span>'
    html += '<P/><img src="https://drive.google.com/uc?id=1p0wBHlUALu1tEAHocwLgfasjixLxU2KQ">'

    html += '<P>&nbsp;<P>&nbsp;'
    html += '<P/><span class="heading">Set Security</span>'
    html += '<P/><span class="normal">Go back to the Security screen</span>'
    html += '<P/><span class="normal">Install unknown apps - turn this back <b>off</b></span>'
    html += '<P/><span class="normal">App permission monitor - turn this back <b>on</b></span>'


    html += '</body>'
    html += '</html>'

    return html
}