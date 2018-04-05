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


    return db.ref(`administration/${req.body.emailType}/pass`).once('value').then(snapshot => {
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


