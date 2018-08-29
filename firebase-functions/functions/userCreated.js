'use strict';

// external dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const nodemailer = require('nodemailer')
const citizen_builder_api = require('./citizen_builder_api/checkVolunteerStatus')

// for calling CitizenBuilder API
var request = require('request')

// create reference to root of the database
const db = admin.database().ref()

/***
paste this on the command line...
firebase deploy --only functions:userCreated,functions:approveUserAccount

***/


// TODO fix index.js  This function should not be exported as userCreated.
// TODO keep the names in index.js identical to what they are here
exports.createUserAccount = functions.auth.user().onCreate(event => {
    console.log("userCreated.js: onCreate called")
    // UserRecord is created
    // according to: https://www.youtube.com/watch?v=pADTJA3BoxE&t=31s
    // UserRecord contains: displayName, email, photoUrl, uid
    // all of this is accessible via event.data

    const uid = event.data.uid
    const email = event.data.email
    var name = email // default value if name not present
    if(event.data.displayName) name = event.data.displayName
    const photoUrl = event.data.photoURL || 'https://i.stack.imgur.com/34AD2.jpg'

    var updates = {}
    updates['users/'+uid+'/name'] = name
    updates['users/'+uid+'/photoUrl'] = photoUrl
    updates['users/'+uid+'/created'] = date.asCentralTime()

    // email will be null from FB if the person hasn't verified their email with FB
    if(email) {

        updates['users/'+uid+'/email'] = email

        citizen_builder_api.checkVolunteerStatus(email,
            function() {
                citizen_builder_api.grantAccess(updates, uid, name, email)

                // TODO actually don't need this email anymore
//                return db.update(attributes).then(() => {
//                    return sendEmail2('On-Board This Person', email, name)
//                })
            },
            function() {
                // called when the user has NOT satisfied the legal requirements for access
                // In this case, we still have to save the user to /users.  We just don't set
                // the petition, conf agreement and banned flags like we do above.
                return db.child('/').update(updates).then(() => {
                    return sendEmail('petition_ca_email', email, name)
                })
            }
        )
        return true
    }
    else {
        // no email - geez - send them to the limbo screen also I guess and let them know
        // we never got their email.  Give them a text field to set it.
        // Or maybe give them instructions to go back to FB and tell them how to confirm their email

        return db.child('/').update(updates).then(() => {
            return sendEmail('petition_ca_email', email, name)
        })
    }




//    const newUserRef = db.child('/users/'+uid)
//
//    var created = date.asCentralTime()
//
//    // See comment at very bottom
//    var userrecord = {name:name, photoUrl:photoUrl, email: email, created: created, account_disposition: "enabled"}
//    /**********
//    var userrecord = {name:name, photoUrl:photoUrl, created: created, account_disposition: "enabled"}
//    // for the cases when there IS no email...
//    if(email) {
//        userrecord['email'] = email
//    }
//    ***************/
//
//    // remember, .set() returns a promise
//    // just about everything returns a promise
//
//    return newUserRef.set(userrecord).then(snap => {
//
//        return db.child('/no_roles/'+uid).set(userrecord).then( whatisthis => {
//            return admin.auth().getUser(uid)
//                .then(function(userRecord) {
//                    console.log("Successfully fetched user data:", userRecord.toJSON());
//                    db.child('/users/'+uid+'/name').set(userRecord.displayName) // displayName not ready
//                    // above, but it is at this point
//                    // https://github.com/firebase/firebaseui-web/issues/197
//                    return userRecord.displayName
//                })
//        })
//    })
//    .then(name /*userRecord.displayName*/ => {
//        if(email) {
//            citizen_builder_api.checkVolunteerStatus(email,
//                function() {
//                    // called when the user HAS satisfied the legal requirements for access
//                    // In this case, set these attributes on the user's node
//                    var attributes = {}
//                    attributes['/users/'+uid+'/has_signed_petition'] = true
//                    attributes['/users/'+uid+'/has_signed_confidentiality_agreement'] = true
//                    attributes['/users/'+uid+'/is_banned'] = false
//
//                    // TODO this is where we
//
//                    return db.update(attributes).then(() => {
//                        return sendEmail2('On-Board This Person', email, name)
//                    })
//                },
//                function() {
//                    // called when the user has NOT satisfied the legal requirements for access
//                    // In this case, don't do anything.  The attributes that we set in the other
//                    // callback can be left out here.  Missing attribute will interpreted as "unknown"
//                    // We can't be more specific than "unknown" because we don't know exactly WHY
//                    // the CitizenBuilder API call returned false.
//
//                    // UPDATE 4/5/18 - BUT.... but we do want to send this person the email that
//                    // tells them they have to sign the petition and confidentiality agreement
//                    // Let's do that now...
//
//                    return sendEmail('petition_ca_email', email, name)
//
//                }
//            )
//        }
//    })
})


// TODO we can probably get rid of this because are automatically approving users now (8/28/18) if
// TODO if we determine they have signed legal
exports.approveUserAccount = functions.database.ref('/no_roles/{uid}').onDelete(event => {

    var uid = event.params.uid
    var name = event.data.previous.val().name
    var email = event.data.previous.val().email

    // put new users on this team by default...
    return db.child('/administration/newusers/assign_to_team').once('value').then(snapshot => {
        var team_name = snapshot.val()
        return team_name // return value here becomes the inbound parameter in the next "then" clause
    })
    .then(team_name => {
        return db.child('teams/'+team_name+'/members').child(uid).set({name: name, email: email, date_added: date.asCentralTime()})
    })
    .then(() => {
        // send the welcome email
        return sendEmail('welcome_email', email, name)

    })
})


// TODO move to sendEmail2 at some point
var sendEmail = function(emailType, email, name) {

        return db.child('/administration/'+emailType).once('value').then(snapshot => {

            var rep = "(newbie)"
            var message = snapshot.val().message.replace(rep, name)

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
                to: email, //"bar@blurdybloop.com, baz@blurdybloop.com", // list of receivers
                cc: snapshot.val().cc,
                subject: snapshot.val().subject, // Subject line
                //text: "plain text: "+snapshot.val().message, // plaintext body
                html: message // html body
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


var sendEmail2 = function(emailType, email, name) {

    return db.child('/administration/email_types').orderByChild('title').equalTo(emailType).once('value').then(snapshot => {

        // not sure if I like having to do a second query just to get the email password
        return db.child('/administration/email_config/pass').once('value').then(snap => {

            var atype
            snapshot.forEach(function(child) { atype = child.val() })

            var rep = "newbie"
            var message = _.replace(atype.message, new RegExp(rep,"g"), name) //snapshot.val().message.replace(rep, name)

            var smtpTransport = nodemailer.createTransport({
                host: atype.host,
                port: atype.port,
                secure: true, // true for 465, false for other ports
                auth: {
                    user: atype.user, pass: snap.val()
                }
            })

            // setup e-mail data with unicode symbols
            var mailOptions = {
                from: atype.from, //"Fred Foo ✔ <foo@blurdybloop.com>", // sender address
                to: email, //"bar@blurdybloop.com, baz@blurdybloop.com", // list of receivers
                cc: atype.cc,
                subject: atype.subject, // Subject line
                //text: "plain text: "+snapshot.val().message, // plaintext body
                html: message // html body
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
    })
}


/***********************************************
In createUserAccount() above, we have this code:

    var userrecord = {name:name, photoUrl:photoUrl, email: email, created: created, account_disposition: "enabled"}



We also have this code that is currently commented out:

    var userrecord = {name:name, photoUrl:photoUrl, created: created, account_disposition: "enabled"}
    // for the cases when there IS no email...
    if(email) {
        userrecord['email'] = email
    }


What do each of these do and why are they there?

The first line is what we've always had.  The second block is new and works but we're not using
it just yet.

What's the problem:  MISSING EMAILS - Facebook is not sending emails over for some users

What happens when the first line above is executed with no email:  Crash/Exception that prevents
the user node under /users from being created.  So these users with no emails are NOT sent to the
Limbo screen.  They are let right into the app, albeit with no permissions.

In MainActivity, we now display a warning in yellow where the email address should be.  The user
can touch this warning and be taken to a screen where he can supply his email (EditMyAccountFragment.java)
Once the user supplies his email, we write the user's record to the /no_roles node so that the
admins can properly on-board him.

Is there anything wrong/confusing with the second block?  Yes

The second block does avoid the crash/exception that occurs when there's no email.  And using
this second block of code, new users without emails ARE sent to the Limbo screen which is good.
The problem is, they still don't have an eamil.  So once we grant them permissions on the
Unassigned Users screen, they are let in to the app but they still don't have an email address
on file.

Emails are pretty much assumed to always exist, so if one doesn't, that's an exception waiting
to happen.

Ideally, the UnassignedUsers screen would alert the admins to any user that doesn't have
an email.  I haven't added that to the AssignUserFragment yet though.  I can roll out the
new EditMyAccountFragment screen and get people to enter their emails without having to implement
the second block of code and modifying the AssignUserFragment screen.
***********************************************/






