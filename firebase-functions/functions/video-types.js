'use strict';

/********************************************************************************
See:  https://cloud.google.com/nodejs/docs/reference/compute/0.10.x/
********************************************************************************/

// external dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const email = require('./email')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database()

/***
paste this on the command line...
firebase deploy --only functions:listVideoTypes,functions:testSaveVideoType,functions:testSendLegislatorEmail,functions:testPreviewLegislatorEmail
***/


exports.listVideoTypes = functions.https.onRequest((req, res) => {
    return xxxx({req: req, res: res})
})

var xxxx = function(stuff) {
    var req = stuff.req
    var res = stuff.res

    if(req.query.video_type_key)
        stuff.video_type_key = req.query.video_type_key
    else if(req.body.video_type_key)
        stuff.video_type_key = req.body.video_type_key

    return getTypes(stuff).then(h => {
        var html = ''
        html += '<html><head></head><body>'
        // list all video types - values of /video/types/type
        html += h
        html += '</body></html>'
        return res.status(200).send(html)
    })
}

exports.testSaveVideoType = functions.https.onRequest((req, res) => {
    var updates = {}
    updates['type'] = req.body.type
    updates['video_mission_description'] = req.body.video_mission_description
    updates['youtube_video_description'] = req.body.youtube_video_description
    updates['email_to_legislator_subject'] = req.body.email_to_legislator_subject
    updates['email_to_legislator'] = req.body.email_to_legislator
    updates['email_to_participants_subject'] = req.body.email_to_participants_subject
    updates['email_to_participants'] = req.body.email_to_participants

    return db.ref('video/types/'+req.body.video_type_key).update(updates).then(() => {
        return xxxx(req, res)
    })
})

var getTypes = function(stuff) {
    var video_type_key = stuff.video_type_key
    return db.ref('video/types').once('value').then(snapshot => {
        var html = ''
        html += '<table border="1">'
        html +=     '<tr><td valign="top"><table>'
                var selectedType
                snapshot.forEach(function(child) {
                    html += '<tr>'
                    html +=     '<td><a href="/listVideoTypes?video_type_key='+child.key+'">'+child.val().type+'</a></td>'
                    html += '</tr>'

                    if(video_type_key && video_type_key == child.key) {
                        selectedType = child
                    }

                })
                html += '</table>'
        html += '</td>'
        html += '<td valign="top">'

        if(selectedType) {
            html += getType(selectedType)
        }
        html += '</td>'
        html += '<td>' // this cell on the far right displays the "email preview" if one was asked for
        if(stuff.emailPreview) {
            html +=     stuff.emailPreview.subject+'<P/>'
            html +=     stuff.emailPreview.message+'<P/>'
        }
        html += '</td>'
        html += '</tr></table>'

        return html
    })
}

var getType = function(type) {
    var html = ''
    html += '<form method="post" action="/testSaveVideoType">'
    html += '<input type="text" name="video_type_key" value="'+type.key+'" /><P/>'
    html += '<input type="text" name="type" value="'+type.val().type+'"><P/>'
    html += '<b>Video Mission Description<b/><br/>'
    html += '<textarea name="video_mission_description" rows="10" cols="75">'+type.val().video_mission_description+'</textarea><P/>'
    html += '<b>YouTube Video Description<b/><br/>'
    html += '<textarea name="youtube_video_description" rows="10" cols="100">'+type.val().youtube_video_description+'</textarea><P/>'

    html += '<b>Email to Legislator<b/><br/>'
    html += '<b>Subject<b/><br/>'
    html += '<input type="text" name="email_to_legislator_subject" size="100" value="'+type.val().email_to_legislator_subject+'"><P/>'
    html += '<b>Message<b/><br/>'
    html += '<textarea name="email_to_legislator" rows="10" cols="100">'+type.val().email_to_legislator+'</textarea><P/>'
    html += '<input type="submit" value="preview" formaction="/testPreviewLegislatorEmail"> '
    html += '<input type="submit" value="send" formaction="/testSendLegislatorEmail"><P/>'

    html += '<b>Email to Participants<b/><br/>'
    html += '<b>Subject<b/><br/>'
    html += '<input type="text" name="email_to_participants_subject" size="100" value="'+type.val().email_to_participants_subject+'"><P/>'
    html += '<b>Message<b/><br/>'
    html += '<textarea name="email_to_participants" rows="10" cols="100">'+type.val().email_to_participants+'</textarea><P/>'
    html += '<input type="submit" value="save" />'
    html += '</form>'
    return html
}


exports.testSendLegislatorEmail = functions.https.onRequest((req, res) => {
    return db.ref('video/types/'+req.body.video_type_key).once('value').then(snapshot => {
        email.sendLegislatorEmailRegardingVideo(subject, message, to, cc)

    })

})


exports.testPreviewLegislatorEmail = functions.https.onRequest((req, res) => {
    return db.ref('video/types/'+req.body.video_type_key).once('value').then(snapshot => {
        var subject = snapshot.val().email_to_legislator_subject
        var message = snapshot.val().email_to_legislator
        var to = "bdunklau@yahoo.com"
        var cc = "telepatriot@cosaction.com"
        var emailInfo = email.createLegislatorEmailRegardingVideo(subject, message, to, cc)
        var stuff = {req: req, res: res, emailPreview: emailInfo}
        db.ref('templog2').set({stuff: stuff})
        return xxxx(stuff)
    })
})