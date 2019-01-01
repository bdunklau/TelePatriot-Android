'use strict';

// external dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const nodemailer = require('nodemailer')
const citizen_builder_api = require('./citizen_builder_api/checkVolunteerStatus')
const email_js = require('./email')
const volunteers = require('./citizen_builder_api/volunteers')

// for calling CitizenBuilder API
var request = require('request')

// create reference to root of the database
const db = admin.database().ref()

/***
paste this on the command line...
firebase deploy --only functions:userCreated,functions:approveUserAccount,functions:onEmailEstablished,functions:onCitizenBuilderId,functions:onPetition,functions:onConfidentialityAgreement,functions:onBanned

***/


exports.userCreated = functions.auth.user().onCreate(event => {
    console.log("userCreated.js: onCreate called")
    // UserRecord is created
    // according to: https://www.youtube.com/watch?v=pADTJA3BoxE&t=31s
    // UserRecord contains: displayName, email, photoUrl, uid
    // all of this is accessible via event.data

    var uid = event.data.uid
    var email = event.data.email
    var name = email // default value if name not present
    if(event.data.displayName) name = event.data.displayName
    var photoUrl = event.data.photoURL || 'https://i.stack.imgur.com/34AD2.jpg'

    var updates = {}


    // kinda sucky - this query just to simulate an error condition (not getting name and/or email from auth provider)
    return db.child('administration/configuration').once('value').then(snapshot => {
        if(!snapshot.val().simulate_missing_name) {
            updates['users/'+uid+'/name'] = name
            updates['users/'+uid+'/name_lower'] = name.toLowerCase()
        }
        if(!snapshot.val().simulate_missing_email) {
            updates['users/'+uid+'/email'] = email
        }

        updates['users/'+uid+'/photoUrl'] = photoUrl
        updates['users/'+uid+'/created'] = date.asCentralTime()
        updates['users/'+uid+'/created_ms'] = date.asMillis()

        // email will be null from FB if the person hasn't verified their email with FB
        if(updates['users/'+uid+'/email'] && updates['users/'+uid+'/name']) {
            updates['users/'+uid+'/account_disposition'] = 'enabled' // admins can disable if needed.  Useful for people that
                                                                     // leave COS but aren't banned
        }
        else {
            updates['users/'+uid+'/account_disposition'] = 'disabled'
        }

        return db.child('/').update(updates)

    }) // end:  return db.child('administration/configuration').once('value').then(snapshot => {
})


// fires when a user's email is first added to his record in the firebase db
exports.onEmailEstablished = functions.database.ref('users/{uid}/email').onCreate(event => {
    var uid = event.params.uid
    var email = event.data.val()
    return db.child('administration/configuration').once('value').then(snapshot => {
        var configuration = snapshot.val()
        if(configuration.on_user_created == 'volunteers') {
            var returnFn = function(result) {
                if(result.returnEarly) return false
                else if(result.error) {
                    // TODO what do we do with an error?
                }
                else if(result.notFound) {
                    // TODO what to do when the user isn't in the CB db?
                }
                else if(result.vol) {
                    // This is what we want to happen: email was found in the CB db
                    volunteers.updateUser(uid, result)
                }
                else return false
            }

            volunteers.getUserInfoFromCB_byEmail(email, returnFn, configuration)
        }
    })

    return true
})


// fires when a user's email is first added to his record in the firebase db
// When the CB ID is first written to the user's record, we will take this as our cue to make an API
// call to CB.  The API call will tell CB to put this user on his state training team.  CB will respond
// with the team_name and team_id of this team so that we can write this team info to the user's
// current_team node
exports.onCitizenBuilderId = functions.database.ref('users/{uid}/citizen_builder_id').onCreate(event => {
    return addTrainingTeam(event)
})

exports.onPetition = functions.database.ref('users/{uid}/has_signed_petition').onCreate(event => {
    return addTrainingTeam(event)
})

exports.onConfidentialityAgreement = functions.database.ref('users/{uid}/has_signed_confidentiality_agreement').onCreate(event => {
    return addTrainingTeam(event)
})

exports.onBanned = functions.database.ref('users/{uid}/is_banned').onCreate(event => {
    return addTrainingTeam(event)
})


var addTrainingTeam = function(event) {
    var uid = event.params.uid
    var state_abbrev = event.data.val()

    return event.data.adminRef.root.child('users/'+uid).once('value').then(snapshot => {
        var citizen_builder_id = snapshot.val().citizen_builder_id
        // ok to place on training team?...
        var ok = snapshot.val().citizen_builder_id && snapshot.val().has_signed_petition && snapshot.val().has_signed_confidentiality_agreement
                    && !snapshot.val().is_banned
        if(!ok) return false

        // TODO : POST citizen_builder_id and team_name to CB to add this person to the team
        // TODO response from CB should contain the team_id
        // TODO Need to call a CB endpoint that doesn't exist yet.  Once it does exist,
        // TODO we'll put the stuff below into the success call fn
//        var updates = {}
//        updates['users/'+uid+'/current_team/'+team_name+'/team_name'] = team_name
//        updates['users/'+uid+'/current_team/'+team_name+'/team_id'] = team_id
//        return event.data.adminRef.root.child('/').update(updates)
    })
}


/***
This _backup version is just here until I get the new userCreated function is done
***/
exports.userCreated_backup = functions.auth.user().onCreate(event => {
    console.log("userCreated.js: onCreate called")
    // UserRecord is created
    // according to: https://www.youtube.com/watch?v=pADTJA3BoxE&t=31s
    // UserRecord contains: displayName, email, photoUrl, uid
    // all of this is accessible via event.data

    var uid = event.data.uid
    var email = event.data.email
    var name = email // default value if name not present
    if(event.data.displayName) name = event.data.displayName
    var photoUrl = event.data.photoURL || 'https://i.stack.imgur.com/34AD2.jpg'

    var updates = {}


    // kinda sucky - this query just to simulate an error condition (not getting name and/or email from auth provider)
    return db.child('administration/configuration').once('value').then(snapshot => {
        if(!snapshot.val().simulate_missing_name) {
            updates['users/'+uid+'/name'] = name
        }
        if(!snapshot.val().simulate_missing_email) {
            updates['users/'+uid+'/email'] = email
        }


        updates['users/'+uid+'/photoUrl'] = photoUrl
        updates['users/'+uid+'/created'] = date.asCentralTime()

        // email will be null from FB if the person hasn't verified their email with FB
        if(updates['users/'+uid+'/email']) {

            updates['users/'+uid+'/account_disposition'] = 'enabled' // admins can disable if needed.  Useful for people that
                                                                     // leave COS but aren't banned

//          Which endpoint are we going to call?  The new one: volunteers, or the old one: checkVolunteerStatus ?
            if(snapshot.val().on_user_created == "volunteers") {
                var environment = snapshot.val().environment
                var input = {
                    citizen_builder_api_key_name: snapshot.val()[environment].citizen_builder_api_key_name,
                    citizen_builder_api_key_value: snapshot.val()[environment].citizen_builder_api_key_value,
                    email: email,
                    successFn: function(result) {
                        var vol = result.vol
                        var allowed = vol.petition_signed && vol.volunteer_agreement_signed && !vol.is_banned
                        updates['users/'+uid+'/has_signed_petition'] = vol.petition_signed ? vol.petition_signed : false
                        updates['users/'+uid+'/has_signed_confidentiality_agreement'] = vol.volunteer_agreement_signed ? vol.volunteer_agreement_signed : false
                        updates['users/'+uid+'/is_banned'] = vol.is_banned ? vol.is_banned : false

                        if(vol.id)
                            updates['users/'+uid+'/citizen_builder_id'] = vol.id
                        if(vol.address)
                            updates['users/'+uid+'/residential_address_line1'] = vol.address
                        if(vol.city)
                            updates['users/'+uid+'/residential_address_city'] = vol.city
                        if(vol.state)
                            updates['users/'+uid+'/residential_address_state'] = vol.state.toLowerCase()
                        if(vol.phone)
                            updates['users/'+uid+'/phone'] = vol.phone.replace(/\D/g,'') // get rid of everything that isn't a digit
                        var thename = ''
                        if(vol.first_name)
                            thename = vol.first_name
                        if(vol.last_name)
                            thename = thename + ' ' + vol.last_name
                        if(name != '')
                            updates['users/'+uid+'/name'] = thename

                        if(allowed) {
                            citizen_builder_api.grantAccess(updates, uid, name, email)
                        }
                        else {
                            if(vol.is_banned) {
                                // not going to give you any help at all
                                console.log('banned?! - unhandled case: vol = ', vol)
                                return db.child('/').update(updates)
                            }
                            // need to figure out what requirement they don't meet and send an email
                            // about just those things
                            else if(!vol.petition_signed && !vol.volunteer_agreement_signed) {
                                console.log('no petition or CA signed')
                                return db.child('/').update(updates).then(() => {
                                    return email_js.sendPetitionCAEmail(email, name)
                                })
                            }
                            else if(!vol.volunteer_agreement_signed) {
                                console.log('no CA signed')
                                return db.child('/').update(updates).then(() => {
                                    // send email just about the conf agreement
                                    // TODO improve this - send email that only mentions the CA
                                    return email_js.sendPetitionCAEmail(email, name)
                                })
                            }
                            else {
                                // We're not handling the case where the conf agreement is signed but not
                                // the petition because that's not a realistic use case.  No one signs
                                // the conf agreement but not the petition
                            }
                               // not going to have the case of petition:no but conf_agreement:yes
                        }
                    },
                    errorFn: function(result) { console.log("error: result: ", result) /*http error*/ }
                }

                volunteers.volunteers(input)

            }
            else { /* use checkVolunteerStatus */

                citizen_builder_api.checkVolunteerStatus(email,
                    function(valid) {
                        citizen_builder_api.grantAccess(updates, uid, name, email)

                        var resp = {uid: uid,
                                   name: name,
                                   email: event.data.email,
                                   event_type: 'check-legal-response',
                                   valid: valid}

                        db.child('cb_api_events/all-events').push().set(resp)
                        db.child('cb_api_events/check-legal-responses/'+uid).push().set(resp)

                    },
                    function(valid) {
                        // called when the user has NOT satisfied the legal requirements for access
                        // In this case, we still have to save the user to /users.  We just don't set
                        // the petition, conf agreement and banned flags like we do above.

                        var resp = {uid: uid,
                                   name: name,
                                   email: event.data.email,
                                   event_type: 'check-legal-response',
                                   valid: valid}

                        db.child('cb_api_events/all-events').push().set(resp)
                        db.child('cb_api_events/check-legal-responses/'+uid).push().set(resp)

                        return db.child('/').update(updates).then(() => {
                            return email_js.sendPetitionCAEmail(email, name)
                        })
                    }
                )
            }

//            call the /volunteers endpoint using the email address
//            get the values of: is_banned, petition_signed, volunteer_agreement_signed
//
//            If the person is found you get this...
//            {
//              "id": 1329,
//              "first_name": "Brent",
//              "last_name": "Xxxxxx",
//              "address": "street number and street",
//              "city": "city",
//              "state": "AA",
//              "email": "email@yahoo.com",
//              "phone": "(214) 000-0000",
//              "is_banned": false,
//              "petition_signed": true,
//              "volunteer_agreement_signed": true
//            }
//
//            If the person isn't found, you get this...
//            {
//              "error": "Not found"
//            }


            return true
        }
        else {
            // no email - geez - send them to the limbo screen also I guess and let them know
            // we never got their email.  Give them a text field to set it.
            // Or maybe give them instructions to go back to FB and tell them how to confirm their email

            return db.child('/').update(updates).then(() => {
                return email_js.sendPetitionCAEmail(email, name)
            })
        }

    }) // end:  return db.child('administration/configuration').once('value').then(snapshot => {
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
        return email_js.sendWelcomeEmail(email, name)

    })
})


var sendEmail2 = function(emailType, email, name) {

    return db.child('/administration/email_types').orderByChild('title').equalTo(emailType).once('value').then(snapshot => {

        // not sure if I like having to do a second query just to get the email password
        return db.child('/administration/email_config/pass').once('value').then(snap => {

            var atype
            snapshot.forEach(function(child) { atype = child.val() })

            var rep = "newbie"
            var message = _.replace(atype.message, new RegExp(rep,"g"), name) //snapshot.val().message.replace(rep, name)

            email_js.sendEmail({message: message, email: email, host: atype.host, port: atype.port,
                        user: atype.user, pass: snap.val(), from: atype.from, cc: atype.cc,
                        subject: atype.subject})

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






