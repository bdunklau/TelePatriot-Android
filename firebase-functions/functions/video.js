'use strict';

/********************************************************************************
This file was originally created (2/27/18) to test uploading videos to YouTube
********************************************************************************/

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

var style = "font-family:Arial;font-size:12px"
var tableheading = style + ';background-color:#ededed'

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


exports.video = functions.https.onRequest((req, res) => {

    return db.ref(`administration/video_parameters`).once('value').then(snapshot => {

        var formParams = {

                        }

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
    html += '<form method="post" action="send">'

    html += '<table width="100%">'
    html += '<tr><td valign="top">'+ emailForm(formParams)+ '</td>  <td valign="top">'+ responseSection(pageData.response)+ '</td></tr>'
    html += '</table>'

    html += '</form>'
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
    html += '<h2>Videos</h2>'
    html += '</td>'
    html += '</tr>'

    html += '<tr>'
    html += '<td>'
    html += '<input type="text" size="75" name="host" value="'+parms.host+'" placeholder="host">'
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

    html += '</table>'
    return html
}


exports.renderEmail = functions.https.onRequest((req, res) => {
    var message = req.body.message


    var formParams = {host: req.body.host,
                    port: req.body.port,
                    user: req.body.user,
                    //pass: req.body.pass,
                    to: req.body.to,
                    from: req.body.from,
                    cc: req.body.cc,
                    subject: req.body.subject,
                    message: req.body.message}

    var pageData = {formParams: formParams, response: message}

    return res.status(200).send(renderPage(pageData))
})



exports.saveEmail = functions.https.onRequest((req, res) => {

    var formParams = {host: req.body.host,
                    port: req.body.port,
                    user: req.body.user,
                    //pass: req.body.pass,
                    to: req.body.to,
                    from: req.body.from,
                    cc: req.body.cc,
                    subject: req.body.subject,
                    message: req.body.message}

    // NOTICE the update() call instead of set() - update() is how you do multi-path updates
    // You won't replace every other node under welcome_email if you use update()
    return db.ref(`administration/welcome_email`).update(formParams).then(() => {

        var pageData = {formParams: formParams, response: 'OK: email stuff saved'}
        return res.status(200).send(renderPage(pageData))
    })
})



exports.sendEmail = functions.https.onRequest((req, res) => {

    var formParams = {host: req.body.host,
                    port: req.body.port,
                    user: req.body.user,
                    //pass: req.body.pass,
                    to: req.body.to,
                    from: req.body.from,
                    cc: req.body.cc,
                    subject: req.body.subject,
                    message: req.body.message}


    return db.ref(`administration/welcome_email/pass`).once('value').then(snapshot => {
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


