'use strict';

/********************************************************************************
This file was originally created (2/27/18) to support editing and testing the
Welcome email that gets sent out to new people

THIS SCRIPT RELIES ON nodemailer
see:  https://nodemailer.com/usage/
********************************************************************************/

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const nodemailer = require('nodemailer')

var style = "font-family:Arial;font-size:12px"
var tableheading = style + ';background-color:#ededed'

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

/***
paste this on the command line...
firebase deploy --only functions:testEmail,functions:testEmail2,functions:chooseEmailType,functions:chooseEmailType2,functions:renderEmail,functions:renderEmail2,functions:saveEmail,functions:saveEmail2,functions:testSendEmail,functions:testSendEmail2,functions:onReadyToSendEmails,functions:testOnReadyToSendEmails
***/


// TODO get rid of this, replace with email2
exports.testEmail = functions.https.onRequest((req, res) => {

    var html = ''
    html += '<html><head></head><body>'
    html += emailTypeDropdown('noselection')
    html += '</body></html>'

    return res.status(200).send(html)
})


exports.sendWelcomeEmail = function(email, name) {
    return sendEmail('welcome_email', email, name)
}


exports.sendPetitionCAEmail = function(email, name) {
    return sendEmail('petition_ca_email', email, name)
}


// an improvement over email.  We aren't hard-coding email type info in the node keys anymore
// We're putting all email templates under administration/email_types.  But we're leaving the original
// email function for now because that touches on user sign ups.
exports.testEmail2 = functions.https.onRequest((req, res) => {

    var html = ''
    html += '<html><head></head><body>'
    return emailTypeDropdown2('noselection').then(h => {
        html += h
        html += '</body></html>'
        return res.status(200).send(html)
    })
})


var emailTypeDropdown2 = function(selectedValue) {
    var html = '<form name="chooseEmailType" action="chooseEmailType2">'
    html += '<select name="email_type_key" onchange="this.form.submit()">' // emailType is really the key of the node under administration/email_types but I'm trying to reduce the ripple effect of all these changes
    html += '<option value="noselection" '+isSelected(selectedValue, "noselection")+'> - </option>'

    return db.ref('administration/email_types').once('value').then(snapshot => {
        snapshot.forEach(function(child) {
            html += '<option value="'+child.key+'" '+isSelected(selectedValue, child.key)+'>'+child.val().title+'</option>'
        })
        html += '</select>'
        html += '</form>'
//        html += '</body></html>'
//        return res.status(200).send(html)
        return html
    })
}


var emailTypeDropdown = function(selectedValue) {

    var html = ''
    html += '<form name="chooseEmailType" action="chooseEmailType">'
    html += '<select name="emailType" onchange="this.form.submit()">'
    // the values in the option tags correspond to these nodes in the database:
    //  /administration/welcome_email   and   /administration/petition_ca_email
    html += '<option value="noselection" '+isSelected(selectedValue, "noselection")+'> - </option>'
    html += '<option value="welcome_email" '+isSelected(selectedValue, "welcome_email")+'>Welcome Email</option>'
    html += '<option value="petition_ca_email" '+isSelected(selectedValue, "petition_ca_email")+'>Petition, Conf Agreement</option>'
    html += '<option value="video_in_process_email" '+isSelected(selectedValue, "video_in_process_email")+'>Your Video is being processed</option>'
    html += '</select>'
    html += '</form>'
    return html
}


var isSelected = function(val1, val2) {
    if(val1 == val2) {
        return 'selected'
    }
    else return ''
}


// TODO replace this with chooseEmailType2
exports.chooseEmailType = functions.https.onRequest((req, res) => {
    var emailType = req.query.emailType

    return db.ref('administration/'+emailType).once('value').then(snapshot => {

        var formParams = {title: snapshot.val().title,
                        host: snapshot.val().host,
                        port: snapshot.val().port,
                        user: snapshot.val().user,
                        //pass: snapshot.val().pass,
                        to: snapshot.val().to,
                        from: snapshot.val().from,
                        cc: snapshot.val().cc,
                        subject: snapshot.val().subject,
                        message: snapshot.val().message,
                        emailType: emailType}

        var pageData = {formParams: formParams, response: snapshot.val().message}

        return pageData
    })
    .then(pageData => {
        return res.status(200).send(renderPage(pageData))
    })
})


exports.chooseEmailType2 = functions.https.onRequest((req, res) => {
    var email_type_key = req.query.email_type_key

    return db.ref('administration/email_types/'+req.query.email_type_key).once('value').then(snapshot => {

        return db.ref('administration/email_config').once('value').then(snap2 => {

            var formParams = {title: snapshot.val().title
                            ,host: snap2.val().host
                            ,port: snap2.val().port
                            ,user: snap2.val().user
                          //,pass: snap2.val().pass
                            ,to: snapshot.val().to
                            ,from: snap2.val().from
                            ,cc: snapshot.val().cc
                            ,subject: snapshot.val().subject
                            ,message: snapshot.val().message
                            ,emailType: email_type_key
                            }

            var pageData = {formParams: formParams, response: snapshot.val().message}

            return renderPage2(pageData).then(html => {
                return res.status(200).send(html)
            })
        })
    })
})


// TODO replace with renderPage2 at some point
var renderPage = function(pageData) {

    var formParams = pageData.formParams

    var html = '<html><head></head>'
    html += '<body>'

    html += '<table width="100%">'
    html += '<tr><td>'+emailTypeDropdown(formParams.emailType)+'</td></tr>' // only need one column on this row for the "choose email type" dropdown
    html += '<tr>'
    html += '<td valign="top"><form method="post" action="send">'+ emailForm(formParams)+ '</form></td>'
    html += '<td valign="top">'+ responseSection(pageData.response)+ '</td>'
    html += '</tr>'
    html += '</table>'

    html += '</body></html>'
    return html
}


var renderPage2 = function(pageData) {

    var formParams = pageData.formParams

    var html = '<html><head></head>'
    html += '<body>'

    html += '<table width="100%">'
    html += '<tr>'
    html +=     '<td>'

    return emailTypeDropdown2(formParams.emailType).then(h => {
        html += h
        html += '</td></tr>' // only need one column on this row for the "choose email type" dropdown
        html += '<tr>'
        html +=     '<td valign="top"><form method="post" action="send">'+ emailForm2(formParams)+ '</form></td>'
        html +=     '<td valign="top">'+ responseSection(pageData.response)+ '</td>'
        html += '</tr>'
        html += '</table>'

        html += '</body></html>'
        return html
    })
}

var responseSection = function(response) {
    var html = ''
    html += response
    return html
}


// TODO replace with emailForm2 at some point
var emailForm = function(parms) {
    var html = ''

    html += '<table>'
    html += '<tr>'
    html += '<td>'
    html += '<h2>'+parms.title+'</h2>'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="host" value="'+parms.host+'" placeholder="host">'
    html += '<input type="text" name="emailType" value="'+parms.emailType+'">'
    html += '<input type="text" name="title" value="'+parms.title+'">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="port" value="'+parms.port+'" placeholder="port">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="user" value="'+parms.user+'" placeholder="email user">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="to" value="'+parms.to+'" placeholder="email address">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="from" value="'+parms.from+'" placeholder="email address">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="cc" value="'+parms.cc+'" placeholder="cc email address">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="subject" value="'+parms.subject+'" placeholder="Subject">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="submit" value="preview" formaction="/renderEmail"> &nbsp;&nbsp;&nbsp; <input type="submit" value="save" formaction="/saveEmail"> &nbsp;&nbsp;&nbsp; <input type="submit" value="send" formaction="testSendEmail">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<textarea rows="40" cols="80" name="message" placeholder="put your email here\n\ntry html format">'+parms.message+'</textarea>'
    html += '</td>'
    html += '</tr>'

    html += '</table>'
    return html
}

var emailForm2 = function(parms) {
    var html = ''

    html += '<table>'
    html += '<tr>'
    html += '<td>'
    html += '<h2>'+parms.title+'</h2>'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="host" value="'+parms.host+'" placeholder="host">'
    html += '<input type="text" name="emailType" value="'+parms.emailType+'">'
    html += '<input type="text" name="title" value="'+parms.title+'">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="port" value="'+parms.port+'" placeholder="port">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="user" value="'+parms.user+'" placeholder="email user">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="to" value="'+parms.to+'" placeholder="email address">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="from" value="'+parms.from+'" placeholder="email address">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="cc" value="'+parms.cc+'" placeholder="cc email address">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="subject" value="'+parms.subject+'" placeholder="Subject">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="submit" value="preview" formaction="/renderEmail2"> &nbsp;&nbsp;&nbsp; <input type="submit" value="save" formaction="/saveEmail2"> &nbsp;&nbsp;&nbsp; <input type="submit" value="send" formaction="/testSendEmail2">'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<textarea rows="40" cols="80" name="message" placeholder="put your email here\n\ntry html format">'+parms.message+'</textarea>'
    html += '</td>'
    html += '</tr>'

    html += '</table>'
    return html
}


// a web front end for testing the onReadyToSendEmails() trigger
// All this function does is query video/list for a node where the legislator's email is my own
// Then this function writes ready_to_send_emails:true on that node which causes the onReadyToSendEmails()
// function to fire
exports.testOnReadyToSendEmails = functions.https.onRequest((req, res) => {
    if(!req.query.send) {
        var html = 'This page tests sending emails, specifically the emails that go out when videos are published.<P/>'
        html += '<a href="/testOnReadyToSendEmails?send=true">Click Here</a> to test sending the email(s) that go out when videos are published'
        return res.status(200).send(html)
    }
    else {
        return db.ref('video/list').orderByChild('legislator_email').equalTo('bdunklau@yahoo.com').once('value').then(snapshot => {
            // if there's more than one video node that matches, just pick any one...
            var video_node_key
            var email_to_legislator
            snapshot.forEach(function(child) {
                video_node_key = child.key
                email_to_legislator = child.val().email_to_legislator
            })

            // delete the attribute first because onReadyToSendEmails() on fires onCreate
            return snapshot.child(video_node_key+'/ready_to_send_emails').ref.remove().then(() => {
                return snapshot.child(video_node_key+'/ready_to_send_emails').ref.set(true).then(() => {
                    var html = '<html><head></head><body>'
                    html += 'ok: set video/list/'+video_node_key+'/ready_to_send_emails = true<P/>'
                    var em = '1 email - to yourself as the supporter'
                    var did = 'Did you get this email?'
                    if(email_to_legislator) {
                        em = '2 emails - one to yourself as the supporter and another to you as the legislator'
                        did = 'Did you get these emails?'
                    }
                    html += 'Check your email.  You should have received '+em+'<P/>'
                    html += did+'<P/>'
                    html += 'Run this again?  <a href="/testOnReadyToSendEmails?send=true">Click Here</a>'
                    html += '</body></html>'
                    return res.status(200).send(html)
                })
            })
        })
    }
})


// facebook.js:onFacebookPostId and twitter.js:onTwitterPostId both trigger this function
exports.onReadyToSendEmails = functions.database.ref('video/list/{video_node_key}/ready_to_send_emails').onCreate((snap2, context) => {

    var params = context.params

    if(snap2.val()) {
        // We need to evaluate the 2 emails and the youtube video title and description one last time
        // before the emails go out...
        return exports.evaluate_video_and_email(params.video_node_key).then(() => {

            return db.ref().child('video/list/'+params.video_node_key).once('value').then(snapshot => {
                if(snapshot.val().email_to_legislator) {
                    // send one email to legislator and cc the two participants and I guess telepatriot@cosaction.com also
                    var legemail = emailToLegislator(snapshot.val())

                    return anotherEmailMethod(legemail).then(videoNode /*same as legemail.videoNode*/ => {
                        var upd = {}
                        upd['email_to_legislator_send_date'] = date.asCentralTime() // this is what turns
                                                               // the little gray checkmark to green in video chat screen
                                                               // for the "emailed legislator" status
                        upd['email_to_legislator_send_date_ms'] = date.asMillis()
                        return snapshot.ref.update(upd).then(() => {
                            return {videoNode: snapshot.val() /*aka videoNode*/, snapshot_ref: snapshot.ref}
                        })
                    })
                }
                else {
                    // user chose to not email the legislator
                    return {videoNode: snapshot.val() /*aka videoNode*/, snapshot_ref: snapshot.ref}
                }
            })
            .then(stuff => {
                var videoNode = stuff.videoNode
                var snapshot_ref = stuff.snapshot_ref
                // send another email to the two participants and cc telepatriot@cosaction.com
                var suppemail = emailToSupporter(videoNode)
                return anotherEmailMethod(suppemail).then(vn /*same as suppemail.videoNode*/ => {
                    var upd = {}
                    upd['email_to_participant_send_date'] = date.asCentralTime() // this is what turns
                                                           // the little gray checkmark to green in video chat screen
                                                           // for the "you've got mail" status
                    upd['email_to_participant_send_date_ms'] = date.asMillis()
                    return snapshot_ref.update(upd)
                })

            })
        })

    }
    else {
        return false
    }
})


var anotherEmailMethod = function(input) {

    return db.ref('administration/email_config').once('value').then(snapshot => {
        var smtpTransport = nodemailer.createTransport({
            host: snapshot.val().host,
                  port: snapshot.val().port,
                  secure: true, // true for 465, false for other ports
            auth: {
              user: snapshot.val().user, pass: snapshot.val().pass
            }
        })

        var pemails = []
        _.forOwn(input.participants, function(p, key) { pemails.push(p.email) })

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: snapshot.val().from, //"Fred Foo ✔ <foo@blurdybloop.com>", // sender address
            to: input.emailAddr, //"bar@blurdybloop.com, baz@blurdybloop.com", // list of receivers
            cc: pemails.join(','),
            subject: input.subject, // Subject line
            //text: "plain text: "+snapshot.val().message, // plaintext body
            html: input.message // html body
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
            } else {
                console.log("Message sent: " + response.message);
            }

            // if you don't want to use this transport object anymore, uncomment following line
            smtpTransport.close(); // shut down the connection pool, no more messages


            // what are we going to return here?
        });

        return input.videoNode
    })
}


var emailToSupporter = function(videoNode) {
    var pemails = []
    _.forOwn(videoNode.video_participants, function(p, key) { pemails.push(p.email) })
    var message = videoNode.email_to_participant_body
    var subject = videoNode.email_to_participant_subject
    return {videoNode: videoNode, emailAddr: pemails.join(','), message: message, subject: subject, participants: videoNode.video_participants}
}


var emailToLegislator = function(videoNode) {
    var message = videoNode.email_to_legislator_body
    var subject = videoNode.email_to_legislator_subject
    return {videoNode: videoNode, emailAddr: videoNode.legislator_email, message: message, subject: subject, participants: videoNode.video_participants}
}


var legislator = function(videoNode) {
    var rep = videoNode.legislator_chamber == 'lower' ? 'Representative' : 'Senator'
    return rep+' '+videoNode.legislator_first_name+' '+videoNode.legislator_last_name
}



var evaluate_youtube_video_description = function(videoNode) {
    // evaluate_video_and_email() makes sure that participants exist before calling this method

    var description = videoNode.youtube_video_description_unevaluated
    var ch = videoNode.legislator_chamber && videoNode.legislator_chamber.toLowerCase()=='lower' ? 'HD' : 'SD'
    var rep = videoNode.legislator_chamber && videoNode.legislator_chamber.toLowerCase()=='lower' ? 'Rep' : 'Sen'
    var constituent = getConstituent(videoNode.video_participants).name

    var replace = [
        {"this": "constituent_name", "withThat": constituent},
        {"this": "legislator_chamber_abbrev", "withThat": ch},
        {"this": "legislator_district", "withThat": videoNode.legislator_district},
        {"this": "legislator_email", "withThat": videoNode.legislator_email},
        // TODO would be better to just not include fb and tw handles if they're not known - othwerwise you get http://www.faceboo.com/undefined  that looks crappy
        {"this": "legislator_facebook", "withThat": videoNode.legislator_facebook},
        {"this": "legislator_facebook_id", "withThat": videoNode.legislator_facebook_id},
        {"this": "legislator_twitter", "withThat": videoNode.legislator_twitter},
        {"this": "legislator_rep_type", "withThat": rep},
        {"this": "legislator_first_name", "withThat": videoNode.legislator_first_name},
        {"this": "legislator_last_name", "withThat": videoNode.legislator_last_name},
        {"this": "legislator_phone", "withThat": videoNode.legislator_phone},
        // rather than display links like  https://www.facebook.com/undefined...
        {"this": "https://www.facebook.com/undefined", "withThat": ""},
        {"this": "https://www.twitter.com/undefined", "withThat": ""},
        {"this": "Phone: undefined", "withThat": "Phone:"},
        {"this": "Email: undefined", "withThat": "Email:"}
    ]

    // "internal confusion" about whether I should be using _abbrev or not  LOL
    if(videoNode.legislator_state_abbrev) {
        replace.push({"this": "legislator_state_abbrev_upper", "withThat": videoNode.legislator_state_abbrev.toUpperCase()})
    }
    else if(videoNode.legislator_state) {
        replace.push({"this": "legislator_state_abbrev_upper", "withThat": videoNode.legislator_state.toUpperCase()})
    }

    _.each(replace, function(rep) {
        description = _.replace(description, new RegExp(rep['this'],"g"), rep['withThat'])
    })

    if(!videoNode.legislator_facebook || videoNode.legislator_facebook == '' || !videoNode.legislator_facebook_id || videoNode.legislator_facebook_id == '') {
        description = _.replace(description, new RegExp('Facebook: https://www.facebook.com/',"g"), 'Facebook:')
    }

    if(!videoNode.legislator_twitter || videoNode.legislator_twitter == '') {
        description = _.replace(description, new RegExp('Twitter: https://www.twitter.com/',"g"), 'Twitter:')
    }

    return description
}

var evaluate_video_title = function(videoNode) {
    // evaluate_video_and_email() makes sure that participants exist before calling this method

    // construct the video title...
    var constituent = getConstituent(videoNode.video_participants)
    var from = ' from '+constituent.name

    var to = ''
    // Example: "Video Petition from Brent Dunklau to Rep Justin Holland (TX HD 33)"
    var rep = videoNode.legislator_chamber == 'lower' ? 'Rep' : 'Sen'
    var ch = videoNode.legislator_chamber == 'lower' ? 'HD' : 'SD'
    var video_title = videoNode.video_type+from+' to '+rep+' '+videoNode.legislator_first_name+' '+videoNode.legislator_last_name
    if(videoNode.legislator_state_abbrev)
        video_title += ' ('+videoNode.legislator_state_abbrev.toUpperCase()+' '+ch+' '+videoNode.legislator_district+')'
    return video_title
}


var evaluate_email_to_legislator_body = function(videoNode) {
    // evaluate_video_and_email() makes sure that participants exist before calling this method

    var constituent = getConstituent(videoNode.video_participants)

    var replace = [
        {"this": "constituent_name", "withThat": constituent.name},

        {"this": "constituent_address", "withThat": ""},  // not there yet 8/24/18
        {"this": "constituent_city", "withThat": ""},     // not there yet 8/24/18
        {"this": "constituent_state", "withThat": ""},    // not there yet 8/24/18
        {"this": "constituent_zip", "withThat": ""},      // not there yet 8/24/18
        {"this": "constituent_phone", "withThat": ""},    // not there yet 8/24/18
        {"this": "constituent_email", "withThat": constituent.email},

        {"this": "legislator_title", "withThat": videoNode.legislator_chamber == 'lower' ? 'Representative' : 'Senator'},
        {"this": "legislator_first_name", "withThat": videoNode.legislator_first_name},
        {"this": "legislator_last_name", "withThat": videoNode.legislator_last_name},
        {"this": "request_based_on_cos_position", "withThat": ""}, // not there yet 8/24/18

        {"this": "video_url", "withThat": videoNode.video_url},
        {"this": "facebook_post", "withThat": 'https://www.facebook.com/'+videoNode.facebook_post_id},
        {"this": "tweet", "withThat": 'https://www.twitter.com/realTelePatriot/status/'+videoNode.twitter_post_id}
    ]

    var email_to_legislator_body = videoNode.email_to_legislator_body_unevaluated
    _.each(replace, function(rep) {
        email_to_legislator_body = _.replace(email_to_legislator_body, new RegExp(rep['this'],"g"), rep['withThat'])
    })

    // conditionally include the text in the email between post_to_facebook:begin and post_to_facebook:end
    if(videoNode.post_to_facebook && videoNode.facebook_post_id) {
        email_to_legislator_body = _.replace(email_to_legislator_body, new RegExp('post_to_facebook:begin',"g"), '')
        email_to_legislator_body = _.replace(email_to_legislator_body, new RegExp('post_to_facebook:end',"g"), '')
    }
    else {
        var p1 = email_to_legislator_body.substring(0, email_to_legislator_body.indexOf('post_to_facebook:begin'))
        var p2 = email_to_legislator_body.substring(email_to_legislator_body.indexOf('post_to_facebook:end') + 'post_to_facebook:end'.length)
        email_to_legislator_body = p1 + p2
    }

    // conditionally include the text in the email between post_to_twitter:begin and post_to_twitter:end
    if(videoNode.post_to_twitter && videoNode.twitter_post_id) {
        email_to_legislator_body = _.replace(email_to_legislator_body, new RegExp('post_to_twitter:begin',"g"), '')
        email_to_legislator_body = _.replace(email_to_legislator_body, new RegExp('post_to_twitter:end',"g"), '')
    }
    else {
        var p1 = email_to_legislator_body.substring(0, email_to_legislator_body.indexOf('post_to_twitter:begin'))
        var p2 = email_to_legislator_body.substring(email_to_legislator_body.indexOf('post_to_twitter:end') + 'post_to_twitter:end'.length)
        email_to_legislator_body = p1 + p2
    }
    return email_to_legislator_body
}


var evaluate_email_to_legislator_subject = function(videoNode) {
    // evaluate_video_and_email() makes sure that participants exist before calling this method

    var constituent = getConstituent(videoNode.video_participants)

    var replace = [
        {"this": "constituent_name", "withThat": constituent.name},
        {"this": "video_type", "withThat": videoNode.video_type}
    ]

    var email_to_legislator_subject = videoNode.email_to_legislator_subject_unevaluated
    _.each(replace, function(rep) {
        email_to_legislator_subject = _.replace(email_to_legislator_subject, new RegExp(rep['this'],"g"), rep['withThat'])
    })
    return email_to_legislator_subject
}


var evaluate_email_to_participant_body = function(videoNode) {
    // evaluate_video_and_email() makes sure that participants exist before calling this method

    var constituent = getConstituent(videoNode.video_participants)

    var replace = [
        {"this": "constituent_name", "withThat": constituent.name},
        {"this": "legislator_title", "withThat": videoNode.legislator_chamber == 'lower' ? 'Representative' : 'Senator'},
        {"this": "legislator_first_name", "withThat": videoNode.legislator_first_name},
        {"this": "legislator_last_name", "withThat": videoNode.legislator_last_name},
        {"this": "legislator_phone", "withThat": videoNode.legislator_phone},
        {"this": "video_url", "withThat": videoNode.video_url},
        {"this": "facebook_post", "withThat": 'https://www.facebook.com/'+videoNode.facebook_post_id},
        {"this": "tweet", "withThat": 'https://www.twitter.com/realTelePatriot/status/'+videoNode.twitter_post_id}
    ]

    var email_to_participant_body = videoNode.email_to_participant_body_unevaluated
    _.each(replace, function(rep) {
        email_to_participant_body = _.replace(email_to_participant_body, new RegExp(rep['this'],"g"), rep['withThat'])
    })

    // conditionally include the text in the email between post_to_facebook:begin and post_to_facebook:end
    if(videoNode.post_to_facebook && videoNode.facebook_post_id) {
        email_to_participant_body = _.replace(email_to_participant_body, new RegExp('post_to_facebook:begin',"g"), '')
        email_to_participant_body = _.replace(email_to_participant_body, new RegExp('post_to_facebook:end',"g"), '')
    }
    else {
        var p1 = email_to_participant_body.substring(0, email_to_participant_body.indexOf('post_to_facebook:begin'))
        var p2 = email_to_participant_body.substring(email_to_participant_body.indexOf('post_to_facebook:end') + 'post_to_facebook:end'.length)
        email_to_participant_body = p1 + p2
    }

    // conditionally include the text in the email between post_to_twitter:begin and post_to_twitter:end
    if(videoNode.post_to_twitter && videoNode.twitter_post_id) {
        email_to_participant_body = _.replace(email_to_participant_body, new RegExp('post_to_twitter:begin',"g"), '')
        email_to_participant_body = _.replace(email_to_participant_body, new RegExp('post_to_twitter:end',"g"), '')
    }
    else {
        var p1 = email_to_participant_body.substring(0, email_to_participant_body.indexOf('post_to_twitter:begin'))
        var p2 = email_to_participant_body.substring(email_to_participant_body.indexOf('post_to_twitter:end') + 'post_to_twitter:end'.length)
        email_to_participant_body = p1 + p2
    }
    return email_to_participant_body
}


var evaluate_email_to_participant_subject = function(videoNode) {
    // evaluate_video_and_email() makes sure that participants exist before calling this method

    var replace = [
        {"this": "legislator_title", "withThat": videoNode.legislator_chamber == 'lower' ? 'Representative' : 'Senator'},
        {"this": "legislator_first_name", "withThat": videoNode.legislator_first_name},
        {"this": "legislator_last_name", "withThat": videoNode.legislator_last_name}
    ]

    var email_to_participant_subject = videoNode.email_to_participant_subject_unevaluated
    _.each(replace, function(rep) {
        email_to_participant_subject = _.replace(email_to_participant_subject, new RegExp(rep['this'],"g"), rep['withThat'])
    })
    return email_to_participant_subject
}


var getVideoNode = function(video_node_key) {
    return db.ref('video/list/'+video_node_key).once('value').then(snapshot => {
        return snapshot.val()
    })
}


exports.evaluate_video_and_email = function(video_node_key) {
    return getVideoNode(video_node_key).then(videoNode => {
        if(!videoNode || !videoNode.video_participants || videoNode.video_participants.length == 0) {
            console.log('videoNode=',videoNode);
            console.log('videoNode.video_participants=',videoNode.video_participants);
            console.log('videoNode.video_participants.length=',videoNode.video_participants.length);
            return false
        }

        var updates = {}
        updates['video/list/'+video_node_key+'/email_to_legislator_body'] = evaluate_email_to_legislator_body(videoNode)
        updates['video/list/'+video_node_key+'/email_to_legislator_subject'] = evaluate_email_to_legislator_subject(videoNode)
        updates['video/list/'+video_node_key+'/email_to_participant_body'] = evaluate_email_to_participant_body(videoNode)
        updates['video/list/'+video_node_key+'/email_to_participant_subject'] = evaluate_email_to_participant_subject(videoNode)
        updates['video/list/'+video_node_key+'/youtube_video_description'] = evaluate_youtube_video_description(videoNode)
        updates['video/list/'+video_node_key+'/video_title'] = evaluate_video_title(videoNode)
        return db.ref('/').update(updates)
    })
}



var getConstituent = function(participants) {

    var uids = Object.keys(participants)
    var max_date = 0
    var constituent
    for(var i=0; i < uids.length; i++) {
        var participant = participants[uids[i]]
        if(max_date < participant.start_date_ms) {
            max_date = participant.start_date_ms
            constituent = participant
        }
    }
    return constituent
}


// TODO replace this with renderEmail2 at some point
exports.renderEmail = functions.https.onRequest((req, res) => {
    var message = req.body.message


    var formParams = {title: req.body.title,
                    host: req.body.host,
                    port: req.body.port,
                    user: req.body.user,
                    //pass: req.body.pass,
                    to: req.body.to,
                    from: req.body.from,
                    cc: req.body.cc,
                    subject: req.body.subject,
                    message: req.body.message,
                    emailType: req.body.emailType}

    var pageData = {formParams: formParams, response: message}

    return res.status(200).send(renderPage(pageData))
})


exports.renderEmail2 = functions.https.onRequest((req, res) => {
    var message = req.body.message


    var formParams = {title: req.body.title,
                    host: req.body.host,
                    port: req.body.port,
                    user: req.body.user,
                    //pass: req.body.pass,
                    to: req.body.to,
                    from: req.body.from,
                    cc: req.body.cc,
                    subject: req.body.subject,
                    message: req.body.message,
                    emailType: req.body.emailType}

    var pageData = {formParams: formParams, response: message}

    return renderPage2(pageData).then(html => {
        return res.status(200).send(html)
    })
})


// TODO replace with saveEmail2 at some point
exports.saveEmail = functions.https.onRequest((req, res) => {

    var formParams = {title: req.body.title,
                    host: req.body.host,
                    port: req.body.port,
                    user: req.body.user,
                    //pass: req.body.pass,
                    to: req.body.to,
                    from: req.body.from,
                    cc: req.body.cc,
                    subject: req.body.subject,
                    message: req.body.message,
                    emailType: req.body.emailType}

    // NOTICE the update() call instead of set() - update() is how you do multi-path updates
    // You won't replace every other node under welcome_email if you use update()
    return db.ref('administration/'+req.body.emailType).update(formParams).then(() => {

        var pageData = {formParams: formParams, response: 'OK: email stuff saved'}
        return res.status(200).send(renderPage(pageData))
    })
})



exports.saveEmail2 = functions.https.onRequest((req, res) => {

    var formParams = {title: req.body.title,
                    host: req.body.host,
                    port: req.body.port,
                    user: req.body.user,
                    //pass: req.body.pass,
                    to: req.body.to,
                    from: req.body.from,
                    cc: req.body.cc,
                    subject: req.body.subject,
                    message: req.body.message,
                    emailType: req.body.emailType}

    // NOTICE the update() call instead of set() - update() is how you do multi-path updates
    // You won't replace every other node under welcome_email if you use update()
    return db.ref('administration/email_types/'+req.body.emailType).update(formParams).then(() => {

        var pageData = {formParams: formParams, response: 'OK: email stuff saved'}

        return renderPage2(pageData).then(html => {
            return res.status(200).send(html)
        })
    })
})


// TODO replace with testSendEmail2 at some point
exports.testSendEmail = functions.https.onRequest((req, res) => {

    var formParams = {title: req.body.title,
                    host: req.body.host,
                    port: req.body.port,
                    user: req.body.user,
                    //pass: req.body.pass,
                    to: req.body.to,
                    from: req.body.from,
                    cc: req.body.cc,
                    subject: req.body.subject,
                    message: req.body.message,
                    emailType: req.body.emailType}


    return db.ref('administration/'+req.body.emailType+'/pass').once('value').then(snapshot => {
        var pass = snapshot.val()

        var smtpTransport = nodemailer.createTransport({
          host: formParams.host,
                  port: formParams.port,
                  secure: true, // true for 465, false for other ports
          auth: {
            user: formParams.user, pass: pass
          }
        })

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: formParams.from, //"Fred Foo ✔ <foo@blurdybloop.com>", // sender address
            to: formParams.to, //"bar@blurdybloop.com, baz@blurdybloop.com", // list of receivers
            cc: formParams.cc,
            subject: formParams.subject, // Subject line
            text: "plain text: "+formParams.message, // plaintext body
            html: formParams.message // html body
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
            }else{
                console.log("Message sent: " + response.message);
            }

            // if you don't want to use this transport object anymore, uncomment following line
            smtpTransport.close(); // shut down the connection pool, no more messages

            var pageData = {formParams: formParams, response: 'OK: email sent<P/>May take up to 5 mins for email to be received'}
            return res.status(200).send(renderPage(pageData))
        });
    })
})


exports.testSendEmail2 = functions.https.onRequest((req, res) => {

    var formParams = {title: req.body.title,
                    host: req.body.host,
                    port: req.body.port,
                    user: req.body.user,
                    //pass: req.body.pass,
                    to: req.body.to,
                    from: req.body.from,
                    cc: req.body.cc,
                    subject: req.body.subject,
                    message: req.body.message,
                    emailType: req.body.emailType}


    return db.ref('administration/email_types/'+req.body.emailType+'/pass').once('value').then(snapshot => {
        var pass = snapshot.val()

        var smtpTransport = nodemailer.createTransport({
          host: formParams.host,
                  port: formParams.port,
                  secure: true, // true for 465, false for other ports
          auth: {
            user: formParams.user, pass: pass
          }
        })

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: formParams.from, //"Fred Foo ✔ <foo@blurdybloop.com>", // sender address
            to: formParams.to, //"bar@blurdybloop.com, baz@blurdybloop.com", // list of receivers
            cc: formParams.cc,
            subject: formParams.subject, // Subject line
            text: "plain text: "+formParams.message, // plaintext body
            html: formParams.message // html body
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
            }else{
                console.log("Message sent: " + response.message);
            }

            // if you don't want to use this transport object anymore, uncomment following line
            smtpTransport.close(); // shut down the connection pool, no more messages

            var pageData = {formParams: formParams, response: 'OK: email sent<P/>May take up to 5 mins for email to be received'}
            return renderPage2(pageData).then(html => {
                return res.status(200).send(html)
            })
        });
    })
})


// called from google-cloud:socialMediaPostsCreated() - that file was just getting too big
// and this file is for creating/sending emails anyway
exports.sendLegislatorEmailRegardingVideo = function(subject, message, to /*legislator*/, cc) {
    /**************
    Dear Sen/Rep Legislator,
    My name is (second participant) and I am a constituent of yours.  I recorded a short video message to
    you letting you know that I support the Convention of States resolution and I'd like you to support it also.

    <b>Watch on YouTube</b> - [video_url]

    [if posted to facebook...]
    <b>Watch on Facebook</b>
    This video was also shared on Facebook here - [facebook_post_id]

    [if posted to twitter...]
    <b>Watch on Twitter</b>
    This video was also shared on Twitter here - [facebook_post_id]

    Sincerely,
    [second participant]
    [address if available]
    [email address]
    ***************/

    var stuff = exports.createLegislatorEmailRegardingVideo(subject, message, to /*legislator*/, cc)

    sendEmail3(stuff)
}


exports.createLegislatorEmailRegardingVideo = function(subject, message, to /*legislator*/, cc) {
    var replace = [
    {'this': 'video_type', 'withThat': 'Video Petition'},
    {'this': 'legislator_title', 'withThat': 'Rep'},
    {'this': 'legislator_first_name', 'withThat': 'Justin'},
    {'this': 'legislator_last_name', 'withThat': 'Holland'},
    {'this': 'constituent_name', 'withThat': 'John Smith'},
    {'this': 'request_based_on_cos_position', 'withThat': 'I just want to thank you for supporting the Convention of States resolution.'},
    {'this': 'video_url', 'withThat': 'https://www.youtube.com/watch?v=dfldjewk'},
    {'this': 'facebook_post_id', 'withThat': 'https://www.facebook.com/234523452345234_31243423452345'},
    {'this': 'twitter_post_id', 'withThat': 'https://www.twitter.com/345634563456345635764567456'},
    {'this': 'constituent_address', 'withThat': '2070 Belfry Ct'},
    {'this': 'constituent_city', 'withThat': 'Dallas'},
    {'this': 'constituent_state', 'withThat': 'TX'},
    {'this': 'constituent_zip', 'withThat': '75214'},
    {'this': 'constituent_phone', 'withThat': '214-000-0000'},
    {'this': 'constituent_email', 'withThat': 'jsmith@yahoo.com'}
    ]

    var subj = mailMerge(subject, replace)
    var msg = mailMerge(message, replace)
    var stuff = {subject: subj, message: msg, to: to, cc: cc}
    return stuff
}


var sendEmail3 = function(stuff) {

    return db.ref('administration/email_config').once('value').then(snapshot => {
        var smtpTransport = nodemailer.createTransport({
            host: snapshot.val().host,
            port: snapshot.val().port,
            secure: true, // true for 465, false for other ports
            auth: {
                user: snapshot.val().user, pass: snapshot.val().pass
            }
        })

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: snapshot.val().from, //"Fred Foo ✔ <foo@blurdybloop.com>", // sender address
            to: stuff.to, //"bar@blurdybloop.com, baz@blurdybloop.com", // list of receivers
            cc: stuff.cc,
            subject: stuff.subject, // Subject line
            //text: "plain text: "+snapshot.val().message, // plaintext body
            html: stuff.message // html body
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
            }else{
                console.log("Message sent: " + response.message);
            }

            // if you don't want to use this transport object anymore, uncomment following line
            smtpTransport.close(); // shut down the connection pool, no more messages


            // what are we going to return here?
        });
    })
}


exports.sendEmail = function(input) {

      var smtpTransport = nodemailer.createTransport({
          host: input.host,
          port: input.port,
          secure: true, // true for 465, false for other ports
          auth: {
              user: input.user, pass: input.pass
          }
      })

      // setup e-mail data with unicode symbols
      var mailOptions = {
          from: input.from, //"Fred Foo ✔ <foo@blurdybloop.com>", // sender address
          to: input.email, //"bar@blurdybloop.com, baz@blurdybloop.com", // list of receivers
          cc: input.cc,
          subject: input.subject, // Subject line
          //text: "plain text: "+snapshot.val().message, // plaintext body
          html: input.message // html body
      }

      // send mail with defined transport object
      smtpTransport.sendMail(mailOptions, function(error, response){
          if(error){
              console.log(error);
          }else{
              console.log("Message sent: " + response.message);
          }

          // if you don't want to use this transport object anymore, uncomment following line
          smtpTransport.close(); // shut down the connection pool, no more messages


          // what are we going to return here?
      });
}


var sendEmail = function(emailType, email, name) {

    return db.ref('/administration/'+emailType).once('value').then(snapshot => {

        var rep = "(newbie)"
        var message = snapshot.val().message.replace(rep, name)

        sendEmail4({message: message, email: email, host: snapshot.val().host, port: snapshot.val().port,
                    user: snapshot.val().user, pass: snapshot.val().pass, from: snapshot.val().from, cc: snapshot.val().cc,
                    subject: snapshot.val().subject})
    })
}


var sendEmail4 = function(input) {

    exports.sendEmail(input)
}


var mailMerge = function(str, replace) {
    _.each(replace, function(rep) {
        str = _.replace(str, new RegExp(rep['this'],"g"), rep['withThat'])
    })
    return str
}


// called from google-cloud:socialMediaPostsCreated() - that file was just getting too big
// and this file is for creating/sending emails anyway
exports.sendCongratulatoryEmailRegardingVideo = function(video_node) {

}


