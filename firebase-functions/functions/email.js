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
firebase deploy --only functions:email,functions:email2,functions:chooseEmailType,functions:chooseEmailType2,functions:renderEmail,functions:saveEmail,functions:sendEmail,functions:onReadyToSendEmails,functions:testOnReadyToSendEmails
***/


// TODO get rid of this, replace with email2
exports.email = functions.https.onRequest((req, res) => {

    var html = ''
    html += '<html><head></head><body>'
    html += emailTypeDropdown('noselection')
    html += '</body></html>'

    return res.status(200).send(html)
})


// an improvement over email.  We aren't hard-coding email type info in the node keys anymore
// We're putting all email templates under administration/email_types.  But we're leaving the original
// email function for now because that touches on user sign ups.
exports.email2 = functions.https.onRequest((req, res) => {

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

    return db.ref(`administration/${emailType}`).once('value').then(snapshot => {

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
        html +=     '<td valign="top"><form method="post" action="send">'+ emailForm(formParams)+ '</form></td>'
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
    html += '<input type="submit" value="preview" formaction="/renderEmail"> &nbsp;&nbsp;&nbsp; <input type="submit" value="save" formaction="/saveEmail"> &nbsp;&nbsp;&nbsp; <input type="submit" value="send" formaction="sendEmail">'
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
exports.onReadyToSendEmails = functions.database.ref('video/list/{video_node_key}/ready_to_send_emails').onCreate(event => {
    if(event.data.val() && event.data.val() == true) {
        // TODO the text of the email needs to be kept on the video node
        return event.data.adminRef.root.child('video/list/'+event.params.video_node_key).once('value').then(snapshot => {

            // send one email to legislator and cc the two participants and I guess telepatriot@cosaction.com also
            var legemail = emailToLegislator(snapshot.val())
            return anotherEmailMethod(legemail)
        })
        .then(videoNode => {

            // send another email to the two participants and cc telepatriot@cosaction.com
            var suppemail = emailToSupporter(videoNode)
            return anotherEmailMethod(suppemail)

        })
    }
    else return false
})


var anotherEmailMethod = function(input) {

    return db.ref('administration/email_connection_parms').once('value').then(snapshot => {
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

    var constituent = getConstituent(videoNode.video_participants)
    var subject = 'Your Rockin\' Awesome Video to '+legislator(videoNode)
    var message = '<html><head></head><body>'
    message = constituent.name+' - You just made a Rockin\' Aweseome video to '+legislator(videoNode)+'!\n\n'
    message += 'Your video is also posted on social media.  Go check it out and share it with your friends!\n\n'

    message += '<b>Watch on YouTube</b>\n'
    message += '<a href="'+videoNode.video_url+'">'+videoNode.video_url+'</a>\n\n'

    if(videoNode.post_to_facebook) {
        message += '<b>Watch on Facebook</b>\n'
        message += '<a href="https://www.facebook.com/'+videoNode.facebook_post_id+'">'+videoNode.facebook_post_id+'</a>\n\n'
    }

    if(videoNode.post_to_twitter) {
        message += '<b>Watch on Twitter</b>\n'
        message += '<a href="https://www.facebook.com/'+videoNode.twitter_post_id+'">'+videoNode.twitter_post_id+'</a>\n\n'
    }

    message += '<b>Next Steps</b>\n'
    message += 'You\'re <i>blazing a trail</i> for Liberty.  And you\'re probably wondering - what next?\n\n'
    message += 'Consider calling '+legislator(videoNode)+' at '+videoNode.legislator_phone
    message += ' and schedule a meeting so you can talk about the Convention of States in person.\n\n'

    message += 'Get Plugged in...\n'
    message += 'Like and follow the <a href="https://www.facebook.com/TelePatriot/">TelePatriot</a> page on Facebook'
    message += 'Follow us on twitter <a href="https://twitter.com/realTelePatriot">@realTelePatriot</a>\n'
    message += 'And share these posts with your friends and family.\n\n'

    message += 'Thanks for being a True TelePatriot !'
    message += '</body></html>'

    var pemails = []
    _.forOwn(videoNode.video_participants, function(p, key) { pemails.push(p.email) })
    return {videoNode: videoNode, emailAddr: pemails.join(','), message: message, subject: subject, participants: videoNode.video_participants}
}


var emailToLegislator = function(videoNode) {

    var constituent = getConstituent(videoNode.video_participants)
    //  (video type) from a constituent, (constituent name) Re: Convention of States
    var subject = videoNode.video_type+' from a constituent, '+constituent.name+' Re: Convention of States'
    var message = '<html><head></head><body>'
    message += legislator(videoNode)+', \n\n'
    message += 'My name is '+constituent.name+' and I am a constituent of yours.  '
    message += 'I would like you to support the Convention of States resolution and I would like you urge your colleagues '
    message += 'to support it also.\n\n'
    message += 'I am sending you a '+videoNode.video_type+' so that you can see my face and hear my voice. \n\n '

    message += '<b>Watch on YouTube</b>\n'
    message += 'You can watch this '+videoNode.video_type+' on YouTube\n'
    message += '<a href="'+videoNode.video_url+'">'+videoNode.video_url+'</a>\n\n'

    if(videoNode.post_to_facebook) {
        message += '<b>Watch on Facebook</b>\n'
        message += 'I have also shared this video Facebook\n'
        message += '<a href="https://www.facebook.com/'+videoNode.facebook_post_id+'">'+videoNode.facebook_post_id+'</a>\n\n'
    }

    if(videoNode.post_to_twitter) {
        message += '<b>Watch on Twitter</b>\n'
        message += 'I have also shared this video Twitter\n'
        message += '<a href="https://www.facebook.com/'+videoNode.twitter_post_id+'">'+videoNode.twitter_post_id+'</a>\n\n'
    }

    message += 'The Convention of States movement is something I feel strongly about.  '
    message += 'And I will be mobilizing support for it among voters our district.\n\n'

    // TODO would be good to have their address also
    message += 'Sincerely,\n'+constituent.name+'\n'+constituent.email
    message += '</body></html>'
    return {videoNode: videoNode, emailAddr: videoNode.legislator_email, message: message, subject: subject, participants: videoNode.video_participants}
}


var legislator = function(videoNode) {
    var rep = videoNode.legislator_chamber == 'lower' ? 'Representative' : 'Senator'
    return rep+' '+videoNode.legislator_first_name+' '+videoNode.legislator_last_name
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
    return db.ref(`administration/${req.body.emailType}`).update(formParams).then(() => {

        var pageData = {formParams: formParams, response: 'OK: email stuff saved'}
        return res.status(200).send(renderPage(pageData))
    })
})



exports.sendEmail = functions.https.onRequest((req, res) => {

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

    sendEmail(stuff)
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


var sendEmail = function(stuff) {

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


