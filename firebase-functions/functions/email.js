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
firebase deploy --only functions:email,functions:chooseEmailType,functions:renderEmail,functions:saveEmail,functions:sendEmail
***/


exports.email = functions.https.onRequest((req, res) => {

    var html = ''
    html += '<html><head></head><body>'
    html += emailTypeDropdown('noselection')
    html += '</body></html>'

    return res.status(200).send(html)
})


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


