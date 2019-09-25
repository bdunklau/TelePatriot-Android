'use strict';

// external dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const nodemailer = require('nodemailer')
const citizen_builder_api = require('./citizen_builder_api/checkVolunteerStatus')
const email_js = require('./email')
const log = require('./log')
const volunteers = require('./citizen_builder_api/volunteers')

// for calling CitizenBuilder API
const request = require('request')

// create reference to root of the database
const db = admin.database().ref()

/***
paste this on the command line...
firebase deploy --only functions:userCreated,functions:onCitizenBuilderId

***/


exports.userCreated = functions.auth.user().onCreate(user => {
    // UserRecord is created
    // according to: https://www.youtube.com/watch?v=pADTJA3BoxE&t=31s
    // UserRecord contains: displayName, email, photoUrl, uid
    // all of this is accessible via user

    var uid = user.uid
    var email = user.email
    var name = email // default value if name not present
    console.log('user = ', user)
    if(user.displayName) name = user.displayName
    var photoUrl = user.photoURL || 'https://i.stack.imgur.com/34AD2.jpg'

    log.debug(uid, name, "userCreated.js", "userCreated", "begin func")

//    When the user is created, we have to take his email and send it to CB,
//    either to /volunteers?email=___________ or to /volunteer_validation/check?email=___________
//    The endpoint we use depends on /administration/configuration/on_user_created

    // kinda sucky - this query just to simulate an error condition (not getting name and/or email from auth provider)
    return db.child('administration/configuration').once('value').then(snapshot => {
        var updates = {}
        updates['users/'+uid+'/photoUrl'] = photoUrl
        updates['users/'+uid+'/created'] = date.asCentralTime()
        updates['users/'+uid+'/created_ms'] = date.asMillis()

        var emailMissing = !email || snapshot.val().simulate_missing_email
        var nameMissing = !name || snapshot.val().simulate_missing_name
        var emailPresent = !emailMissing
        var namePresent = !nameMissing

        // email will be null from FB if the person hasn't verified their email with FB
        if(namePresent && emailPresent) {
            updates['users/'+uid+'/account_disposition'] = 'enabled' // admins can disable if needed.  Useful for people that
                                                                     // leave COS but aren't banned
        }
        else {
            updates['users/'+uid+'/account_disposition'] = 'disabled'
        }

        if(namePresent) {
            if(name != email) updates['users/'+uid+'/name'] = name // 9/24/19 kind of a hack - don't set the name to the email address
            if(name != email) updates['users/'+uid+'/name_lower'] = name.toLowerCase()
        }
        if(emailPresent) {
            updates['users/'+uid+'/email'] = email
            // As long as their email is present, we are going to send that email to CB and call
            // either the /volunteer_validation/check endpoint or the /volunteers endpoint, depending on
            // the value of /administration/configuration/on_user_created

            var configuration = snapshot.val()

            if(configuration.on_user_created == 'volunteers') {

                log.debug(uid, name, "userCreated.js", "userCreated", "calling /volunteers endpoint")

                var returnFn = function(result) {
                    if(result.vol) {
                        log.debug(uid, name, "userCreated.js", "userCreated", "OK: result.vol = "+result.vol)
                        // This is what we want to happen: email was found in the CB db
                        volunteers.updateUser({uid: uid, result: result, userInfo: updates})
                        if(result.vol.petition_signed && result.vol.volunteer_agreement_signed && !result.vol.is_banned) {

                            // Sort of a hack/workaround - If the new user satisfies legal, make the person a Volunteer right off the
                            // bat so he can see "My Mission".  Otherwise, you have to assign him the TelePatriot Volunteer role in CB
                            // AND THEN tell him to sign out and sign back in. 
                            return db.child('/users/'+uid+'/roles/Volunteer').set("true") // should really be a boolean, legacy bug from way back
                                    .then(() => {
                                        return email_js.sendWelcomeEmail(email, name)
                                    })
                        }
                    }
                    else {
                        if(result.error) {
                            log.error(uid, name, "userCreated.js", "userCreated", "result.error = "+result.error)
                            // TODO what do we do with an error?
                            return db.child('/').update(updates)
                        }
                        else if(result.notFound) {
                            log.debug(uid, name, "userCreated.js", "userCreated", "result.notFound = "+result.notFound)
                            updates['users/'+uid+'/citizen_builder_id'] = 'No CB Account'
                            updates['users/'+uid+'/has_signed_petition'] = false
                            updates['users/'+uid+'/has_signed_confidentiality_agreement'] = false
                            updates['users/'+uid+'/is_banned'] = false
                            db.child('/').update(updates).then(() => {
                                // this ---v probably works but hasn't been tested yet.
                                //return email_js.sendPetitionCAEmail(email, name)
                            })
                        }
                        else {
                            log.error(uid, name, "userCreated.js", "userCreated", "NOT GOOD: unhandled 'else' clause")
                            return db.child('/').update(updates)
                        }
                    }
                }

                volunteers.getUserInfoFromCB_byEmail(email, returnFn, configuration)
            }
            ///////////////////////////////////////////////////////////////////////////
            // WE CAN GET RID OF THIS ELSE BLOCK NOW.  THIS WILL NEVER BE CALLED
            else { // call the /volunteer_validation/check?email=_______  endpoint
                log.debug(uid, name, "userCreated.js", "userCreated", "calling /volunteer_validation/check endpoint")

                var updates = {}

                if(!configuration.simulate_missing_name) {
                    updates['users/'+uid+'/name'] = name
                }
                if(!configuration.simulate_missing_email) {
                    updates['users/'+uid+'/email'] = email
                }

                updates['users/'+uid+'/account_disposition'] = 'enabled' // admins can disable if needed.  Useful for people that
                                                                         // leave COS but aren't banned


                // call the /volunteer_validation/check?email=___________ endpoint
                citizen_builder_api.checkVolunteerStatus(email,
                    function(valid) {
                        citizen_builder_api.grantAccess(updates, uid, name, email)
                        log.debug(uid, name, "userCreated.js", "userCreated", "granted access to "+name)

                        var resp = {uid: uid,
                                   name: name,
                                   email: email,
                                   event_type: 'check-legal-response',
                                   valid: valid}

                        db.child('cb_api_events/all-events').push().set(resp)
                        db.child('cb_api_events/check-legal-responses/'+uid).push().set(resp)

                    },
                    function(valid) {
                        log.debug(uid, name, "userCreated.js", "userCreated", "access denied to "+name+" (valid: "+valid+")")
                        // called when the user has NOT satisfied the legal requirements for access
                        // In this case, we still have to save the user to /users.  We just don't set
                        // the petition, conf agreement and banned flags like we do above.

                        var resp = {uid: uid,
                                   name: name,
                                   email: email,
                                   event_type: 'check-legal-response',
                                   valid: valid}

                        db.child('cb_api_events/all-events').push().set(resp)
                        db.child('cb_api_events/check-legal-responses/'+uid).push().set(resp)

                        updates['users/'+uid+'/citizen_builder_id'] = 'No CB Account'

                        return db.child('/').update(updates).then(() => {
                            return email_js.sendPetitionCAEmail(email, name)
                        })
                    }
                )
            }


        } // end:  if(emailPresent)
        else {
            // error condition: email not present for this user
            return db.child('/').update(updates)
        }

    }) // end:  return db.child('administration/configuration').once('value').then(snapshot => {
})


/**
Calls the webhook into the TelePatriot slack team.  Messages the new-users channel
**/
exports.onCitizenBuilderId = functions.database.ref('users/{uid}/citizen_builder_id').onWrite((change, context) => {

    if(!change.after.exists()) return false
    if(change.after.val() == 'not populated yet') return false

    /********
    Example post to new-dev-users
    curl -X POST -H 'Content-type: application/json' --data '{"text":"<!channel> Hello, World!"}' (get url from administration/configuration/new_user_webhook)


    Example post to new-users
    curl -X POST -H 'Content-type: application/json' --data '{"text":"<!channel> Hello, World!"}' (get url from administration/configuration/new_user_webhook)
    ********/
    var params = context.params

    log.debug(params.uid, "(not known yet)", "userCreated.js", "onCitizenBuilderId", "begin func")

    return db.child('administration/configuration').once('value').then(snapshot => {
        if(snapshot.val().on_citizen_builder_id == 'do_nothing')
            return false
        var url = snapshot.val().new_user_webhook
        log.debug(params.uid, "(not known yet)", "userCreated.js", "onCitizenBuilderId", "new_user_webhook = "+url)
        return db.child('users/'+params.uid).once('value').then(snap2 => {

            log.debug(params.uid, snap2.val().name, "userCreated.js", "onCitizenBuilderId", "params.uid = "+params.uid)

            var bannedWarning = snap2.val().is_banned && snap2.val().is_banned == true ?
                        "\n================================\n"
                       +"NOTE: THIS PERSON IS BANNED. THEY ARE NOT ALLOWED TO USE TELEPATRIOT\n"
                       +"================================\n": ""

            var petitionWarning = !snap2.val().has_signed_petition ?
                        "\n================================\n"
                       +"NOTE: THIS PERSON HAS NOT SIGNED THE PETITION. THEY ARE NOT ALLOWED TO USE TELEPATRIOT\n"
                       +"================================\n": ""
            var caWarning = !snap2.val().has_signed_confidentiality_agreement ?
                        "\n================================\n"
                       +"NOTE: THIS PERSON HAS NOT SIGNED THE VOLUNTEER AGREEMENT. THEY ARE NOT ALLOWED TO USE TELEPATRIOT\n\nThis is the Volunteer Agreement\n"
                       +"https://legal.conventionofstates.com/S/COS/Transaction/Volunteer_Agreement_Manual\n"
                       +"This person should have already received an email with a link to the Volunteer Agreement.  We only need to send them this link if they say they never got the email.\n"
                       +"================================\n" : ""

            var msg = snap2.val().name+' CB ID: '+change.after.val()+' just downloaded TelePatriot '
                        +(snap2.val().phone ? '\nPhone: '+formatPhone(snap2.val().phone)+'   ' : '')
                        +(snap2.val().email ? snap2.val().email : '')
                        +(snap2.val().residential_address_line1 ? '\n'+snap2.val().residential_address_line1 : '')
                        +(snap2.val().residential_address_city ? ', '+snap2.val().residential_address_city+', ' : '')
                        +(snap2.val().residential_address_state_abbrev ? snap2.val().residential_address_state_abbrev.toUpperCase() : '')
                        +'\nPetition: '+(snap2.val().has_signed_petition ? 'signed' : 'not signed')
                        +'  Volunteer Agreement: '+(snap2.val().has_signed_confidentiality_agreement ? 'signed' : 'not signed')
                        +'  Banned: '+(snap2.val().is_banned ? 'yes' : 'no')
                        + bannedWarning
                        + petitionWarning
                        + caWarning
                        +'\n\n\n'

            var formData = {"text": '@channel '+msg,
                            "link_names": 1,
                            "parse": "full"}

            request.post(
                {
                    url: url,
                    form: JSON.stringify(formData)
                    ,headers: {'Content-type': 'application/json'}
                },
                function (err, httpResponse, body) {
                    // should just get a simple 'ok'
                    if(err) log.error(params.uid, snap2.val().name, "userCreated.js", "onCitizenBuilderId", "error = "+err)
                    else log.debug(params.uid, snap2.val().name, "userCreated.js", "onCitizenBuilderId", "body = "+body)
                }
            );

        })
    })


})


var formatPhone = function(str) {
    if(!str) return ''
    if(str.length != 10) return str
    var cleaned = ('' + str).replace(/\D/g, '')
    var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
    if (match) {
        return match[1] + '-' + match[2] + '-' + match[3]
    }
    else return str
}


// return email_js.sendWelcomeEmail(email, name)

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

