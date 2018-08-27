'use strict';

/********************************************************************************
See:  https://cloud.google.com/nodejs/docs/reference/compute/0.10.x/
********************************************************************************/

// external dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const googleCloud = require('./google-cloud')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database()

/***
paste this on the command line...
firebase deploy --only functions:videoListMain,functions:testSelectVideoNode,functions:testSaveEmailTemplates,functions:testReevaluateEmailAttributes
***/


exports.videoListMain = functions.https.onRequest((req, res) => {
    var input = {}
    return showPage(input).then(html => {
        return res.status(200).send(html)
    })
})

exports.testSelectVideoNode = functions.https.onRequest((req, res) => {
    if(!req.query.video_node_key)
        return false
    var input = {video_node_key: req.query.video_node_key}
    return showPage(input).then(html => {
        return res.status(200).send(html)
    })
})

exports.testSaveEmailTemplates = functions.https.onRequest((req, res) => {
    var updates = {}
    updates['video/list/'+req.body.video_node_key+'/email_to_legislator_subject_unevaluated'] = req.body.email_to_legislator_subject_unevaluated
    updates['video/list/'+req.body.video_node_key+'/email_to_legislator_body_unevaluated'] = req.body.email_to_legislator_body_unevaluated
    updates['video/list/'+req.body.video_node_key+'/email_to_participant_subject_unevaluated'] = req.body.email_to_participant_subject_unevaluated
    updates['video/list/'+req.body.video_node_key+'/email_to_participant_body_unevaluated'] = req.body.email_to_participant_body_unevaluated
    return db.ref('/').update(updates).then(() => {
        return showPage({video_node_key: req.body.video_node_key}).then(html => {
            return res.status(200).send(html)
        })
    })
})

// re-evaluates the _unevaluate attributes in the database.  This method does NOT look at what's entered in
// the text fields and text areas.  Save first, then re-evaluate.
exports.testReevaluateEmailAttributes = functions.https.onRequest((req, res) => {
    return googleCloud.evaluate_video_and_email(req.body.video_node_key).then(() => {

        return showPage({video_node_key: req.body.video_node_key}).then(html => {
            return res.status(200).send(html)
        })
    })
})

var showPage = function(input) {
    var html = ''
    html += '<html><head></head><body>'
    html += '<style>'
    html += '.videoListCell {}'
    html += '.undef {color:#cbcbcb}'
    html += 'textarea, input {font-size:12pt}'
    html += '</style>'
    return listVideos(input).then(h => {
        html += '<table border="0">'
        html +=     '<tr>'
        html +=         '<td width="300">'


        return getVideoNode(input.video_node_key).then(videoNode => {
            return videoNode
        })
        .then(videoNode => {
            if(videoNode) {
                // show emails to legislator and participants so we can actually test sending them
                var html2 = ''
                // table with 2 columns - the first column is for form fields, the second column displays as labels the stuff in the form fields
                // The column on the right shows us what the subject and message will actually look like
                var textareaCols = 80
                var textareaRows = 50
                var textfieldSize = 75
                html2 += '<form method="post" action="testSaveEmailTemplates">  <input type="hidden" name="video_node_key" value="'+input.video_node_key+'">'
                html2 += '<table border="0" cellspacing="0" cellpadding="2">'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top" colspan="2"><h2>Email to Legislator - Template</h2></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top" colspan="2">'
                html2 +=        '<input type="submit" value="Save Unevaluated Attributes"> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
                html2 +=        '<input type="submit" value="Re-Evaluate Attributes" formaction="/testReevaluateEmailAttributes" title="Save first! Then Re-Evaluate"> <br/>'
                html2 +=        '</td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><b>Subject (unevaluated)</b> </td>'
                html2 +=        '<td valign="top"><b>Subject (unevaluated)</b></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><input type="text" value="'+videoNode.email_to_legislator_subject_unevaluated+'" name="email_to_legislator_subject_unevaluated" size="'+textfieldSize+'"></td>'
                html2 +=        '<td valign="top">'+videoNode.email_to_legislator_subject_unevaluated+'</td>'
                html2 +=     '</tr>'

                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><b>Body (unevaluated)</b></td>'
                html2 +=        '<td valign="top"><b>Body (unevaluated)</b></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><textarea name="email_to_legislator_body_unevaluated" rows="'+textareaRows+'" cols="'+textareaCols+'">'+videoNode.email_to_legislator_body_unevaluated+'</textarea></td>'
                html2 +=        '<td valign="top">'+videoNode.email_to_legislator_body_unevaluated+'</td>'
                html2 +=     '</tr>'

                html2 +=     '<tr>'
                html2 +=        '<td colspan="2"><P/>&nbsp;<P/>&nbsp;<P/></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top" colspan="2"><h2>Email to Legislator</h2></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><b>Subject</b></td>'
                html2 +=        '<td valign="top"><b>Subject</b></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><input type="text" value="'+videoNode.email_to_legislator_subject+'" name="email_to_legislator_subject" size="'+textfieldSize+'"></td>'
                html2 +=        '<td valign="top">'+videoNode.email_to_legislator_subject+'</td>'
                html2 +=     '</tr>'

                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><b>Body</b></td>'
                html2 +=        '<td valign="top"><b>Body</b></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><textarea name="email_to_legislator_body" rows="'+textareaRows+'" cols="'+textareaCols+'">'+videoNode.email_to_legislator_body+'</textarea></td>'
                html2 +=        '<td valign="top">'+videoNode.email_to_legislator_body+'</td>'
                html2 +=     '</tr>'


                html2 +=     '<tr>'
                html2 +=        '<td colspan="2"><P/>&nbsp;<P/>&nbsp;<P/></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top" colspan="2"><h2>Email to Participants - Template</h2></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><b>Subject (unevaluated)</b></td>'
                html2 +=        '<td valign="top"><b>Subject (unevaluated)</b></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><input type="text" value="'+videoNode.email_to_participant_subject_unevaluated+'" name="email_to_participant_subject_unevaluated" size="'+textfieldSize+'"></td>'
                html2 +=        '<td valign="top">'+videoNode.email_to_participant_subject_unevaluated+'</td>'
                html2 +=     '</tr>'

                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><b>Body (unevaluated)</b></td>'
                html2 +=        '<td valign="top"><b>Body (unevaluated)</b></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><textarea name="email_to_participant_body_unevaluated" rows="'+textareaRows+'" cols="'+textareaCols+'">'+videoNode.email_to_participant_body_unevaluated+'</textarea></td>'
                html2 +=        '<td valign="top">'+videoNode.email_to_participant_body_unevaluated+'</td>'
                html2 +=     '</tr>'

                html2 +=     '<tr>'
                html2 +=        '<td colspan="2"><P/>&nbsp;<P/>&nbsp;<P/></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top" colspan="2"><h2>Email to Participants</h2></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><P/><b>Subject</b></td>'
                html2 +=        '<td valign="top"><b>Subject</b></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><input type="text" value="'+videoNode.email_to_participant_subject+'" name="email_to_participant_subject" size="'+textfieldSize+'"></td>'
                html2 +=        '<td valign="top">'+videoNode.email_to_participant_subject+'</td>'
                html2 +=     '</tr>'

                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><b>Body</b></td>'
                html2 +=        '<td valign="top"><b>Body</b></td>'
                html2 +=     '</tr>'
                html2 +=     '<tr>'
                html2 +=        '<td valign="top"><textarea name="email_to_participant_body" rows="'+textareaRows+'" cols="'+textareaCols+'">'+videoNode.email_to_participant_body+'</textarea></td>'
                html2 +=        '<td valign="top">'+videoNode.email_to_participant_body+'</td>'
                html2 +=     '</tr>'
                html2 += '</table>'
                html2 += '</form>'

                html += html2
            }

            html +=         '</td>'
            html +=         '<td valign="top">'
            html += h
            html +=         '</td>'
            html +=     '</tr>'
            html += '</table>'

            html += '</body></html>'
            return html
        })

    })

}

var getVideoNode = function(video_node_key) {
    if(!video_node_key) video_node_key = 'x'
    return db.ref('video/list/'+video_node_key).once('value').then(snapshot => {
        return snapshot.val()
    })
}

var listVideos = function(input) {
    var html = ''
    html += '<table border="1" cellspacing="0" cellpadding="2">'
    html += '<tr>'
    html +=     '<th>video_node_key</th>'
    html +=     '<th>email_to_legislator</th>'
    html +=     '<th>email_to_legislator_body</th>'
    html +=     '<th>email_to_legislator_body_unevaluated</th>'
    html +=     '<th>email_to_legislator_subject</th>'
    html +=     '<th>email_to_legislator_subject_unevaluated</th>'
    html +=     '<th>email_to_participant_body</th>'
    html +=     '<th>email_to_participant_body_unevaluated</th>'
    html +=     '<th>email_to_participant_subject</th>'
    html +=     '<th>email_to_participant_subject_unevaluated</th>'
    html +=     '<th>facebook_post_id</th>'
    html +=     '<th>leg_id</th>'
    html +=     '<th>legislator_chamber</th>'
    html +=     '<th>legislator_district</th>'
    html +=     '<th>legislator_email</th>'
    html +=     '<th>legislator_facebook</th>'
    html +=     '<th>legislator_facebook_id</th>'
    html +=     '<th>legislator_first_name</th>'
    html +=     '<th>legislator_full_name</th>'
    html +=     '<th>legislator_last_name</th>'
    html +=     '<th>legislator_name</th>'
    html +=     '<th>legislator_phone</th>'
    html +=     '<th>legislator_state</th>'
    html +=     '<th>legislator_state_abbrev</th>'
    html +=     '<th>legislator_twitter</th>'
    html +=     '<th>node_create_date</th>'
    html +=     '<th>node_create_date_ms</th>'
    html +=     '<th>post_to_facebook</th>'
    html +=     '<th>post_to_twitter</th>'
    html +=     '<th>recording_completed</th>'
    html +=     '<th>recording_started</th>'
    html +=     '<th>recording_started_ms</th>'
    html +=     '<th>recording_stopped</th>'
    html +=     '<th>recording_stopped_ms</th>'
    html +=     '<th>room_id</th>'
    html +=     '<th>twitter_post_id</th>'
    html +=     '<th>video_mission_description</th>'
    
    html +=     '<th>JSON.stringify(participant[0])</th>'
    html +=     '<th>video_participants[0]/key</th>'
    html +=     '<th>connect_date[0]</th>'
    html +=     '<th>connect_date_ms[0]</th>'
    html +=     '<th>connected[0]</th>'
    html +=     '<th>disconnect_date[0]</th>'
    html +=     '<th>disconnect_date_ms[0]</th>'
    html +=     '<th>email[0]</th>'
    html +=     '<th>end_date[0]</th>'
    html +=     '<th>end_date_ms[0]</th>'
    html +=     '<th>name[0]</th>'
    html +=     '<th>present[0]</th>'
    html +=     '<th>start_date[0]</th>'
    html +=     '<th>start_date_ms[0]</th>'
    html +=     '<th>uid[0]</th>'

    html +=     '<th>JSON.stringify(participant[1])</th>'
    html +=     '<th>video_participants[1]/key</th>'
    html +=     '<th>connect_date[1]</th>'
    html +=     '<th>connect_date_ms[1]</th>'
    html +=     '<th>connected[1]</th>'
    html +=     '<th>disconnect_date[1]</th>'
    html +=     '<th>disconnect_date_ms[1]</th>'
    html +=     '<th>email[1]</th>'
    html +=     '<th>end_date[1]</th>'
    html +=     '<th>end_date_ms[1]</th>'
    html +=     '<th>name[1]</th>'
    html +=     '<th>present[1]</th>'
    html +=     '<th>start_date[1]</th>'
    html +=     '<th>start_date_ms[1]</th>'
    html +=     '<th>uid[1]</th>'

    html +=     '<th>video_title</th>'
    html +=     '<th>video_type</th>'
    html +=     '<th>youtube_video_description</th>'
    html +=     '<th>youtube_video_description_unevaluated</th>'
    html += '</tr>'
    return db.ref('video/list').orderByChild('node_create_date_ms').limitToLast(25).once('value').then(snapshot => {
        snapshot.forEach(function(child) {
            html += '<tr'+isSelected(child.key, input)+'>'
            
            
            html +=     '<td nowrap class="videoListCell"><a href="/testSelectVideoNode?video_node_key='+child.key+'">'+child.key+'</a></td>'
            html +=     '<td class="videoListCell">'+display(child.val().email_to_legislator)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().email_to_legislator_body)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().email_to_legislator_body_unevaluated)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().email_to_legislator_subject)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().email_to_legislator_subject_unevaluated)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().email_to_participant_body)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().email_to_participant_body_unevaluated)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().email_to_participant_subject)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().email_to_participant_subject_unevaluated)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().facebook_post_id)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().leg_id)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().legislator_chamber)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().legislator_district)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().legislator_email)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().legislator_facebook)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().legislator_facebook_id)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().legislator_first_name)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().legislator_full_name)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().legislator_last_name)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().legislator_name)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().legislator_phone)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().legislator_state)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().legislator_state_abbrev)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().legislator_twitter)+'</td>'
            html +=     '<td nowrap class="videoListCell">'+display(child.val().node_create_date)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().node_create_date_ms)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().post_to_facebook)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().post_to_twitter)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().recording_completed)+'</td>'
            html +=     '<td nowrap class="videoListCell">'+display(child.val().recording_started)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().recording_started_ms)+'</td>'
            html +=     '<td nowrap class="videoListCell">'+display(child.val().recording_stopped)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().recording_stopped_ms)+'</td>'
            html +=     '<td nowrap class="videoListCell">'+display(child.val().room_id)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().twitter_post_id)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().video_mission_description)+'</td>'

            var pkeys = Object.keys(child.val().video_participants)

            _.each(pkeys, function(key) {

                html += '<td class="videoListCell">'+JSON.stringify(child.val().video_participants[key])+'</td>'
                html += '<td class="videoListCell">'+display(key)+'</td>'
                html += '<td nowrap class="videoListCell">'+display(child.val().video_participants[key].connect_date)+'</td>'
                html += '<td class="videoListCell">'+display(child.val().video_participants[key].connect_date_ms)+'</td>'
                html += '<td class="videoListCell">'+display(child.val().video_participants[key].connected)+'</td>'
                html += '<td nowrap class="videoListCell">'+display(child.val().video_participants[key].disconnect_date)+'</td>'
                html += '<td class="videoListCell">'+display(child.val().video_participants[key].disconnect_date_ms)+'</td>'
                html += '<td class="videoListCell">'+display(child.val().video_participants[key].email)+'</td>'
                html += '<td nowrap class="videoListCell">'+display(child.val().video_participants[key].end_date)+'</td>'
                html += '<td class="videoListCell">'+display(child.val().video_participants[key].end_date_ms)+'</td>'
                html += '<td class="videoListCell">'+display(child.val().video_participants[key].name)+'</td>'
                html += '<td class="videoListCell">'+display(child.val().video_participants[key].present)+'</td>'
                html += '<td nowrap class="videoListCell">'+display(child.val().video_participants[key].start_date)+'</td>'
                html += '<td class="videoListCell">'+display(child.val().video_participants[key].start_date_ms)+'</td>'
                html += '<td class="videoListCell">'+display(child.val().video_participants[key].uid)+'</td>'
            })
            if(pkeys.length < 2) {
                var xxxxxxx
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
                html += '<td class="videoListCell">'+display(xxxxxxx)+'</td>'
            }
        
            html +=     '<td class="videoListCell">'+display(child.val().video_title)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().video_type)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().youtube_video_description)+'</td>'
            html +=     '<td class="videoListCell">'+display(child.val().youtube_video_description_unevaluated)+'</td>'
            
            html += '</tr>'
            html += '</table>'
        })
        return html
    })
}

var display = function(val) {
    if(val === undefined)
        return '<span class="undef">undef</span>'
    else if(val.length > 40)
        return val.substring(0, 40)+'...'
    else return val
}

var isSelected = function(video_node_key, input) {
    if(input.video_node_key && input.video_node_key == video_node_key) {
        return ' style="background-color:#cdcdcd"'
    }
    else return ''
}

