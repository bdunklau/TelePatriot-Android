'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const admin = require('firebase-admin')
const functions = require('firebase-functions')
const date = require('../dateformat')
const log = require('../log')

// for calling CitizenBuilder API
var request = require('request')

// create reference to root of the database
const db = admin.database()


/***
paste this on the command line...
firebase deploy --only functions:testVolunteers,functions:onLogin
***/

//CREATED TO TEST AND SUPPORT THE /volunteers ENDPOINT

exports.testVolunteers = functions.https.onRequest((req, res) => {

    if(req.query.email) {

        return db.ref('administration/configuration').once('value').then(snapshot => {
            var environment = 'cb_production_environment'
            if(snapshot.val().environment && snapshot.val().environment == 'cb_qa_environment') {
                environment = snapshot.val().environment
            }

            var input = {citizen_builder_api_key_name: snapshot.val()[environment].citizen_builder_api_key_name,
                        citizen_builder_api_key_value: snapshot.val()[environment].citizen_builder_api_key_value,
                        domain: snapshot.val()[environment].citizen_builder_domain,
                        email: req.query.email,
                        successFn: function(result) { return res.status(200).send(thePage(result)) },
                        errorFn: function(result) { return res.status(200).send(thePage(result)) }
                        }
            exports.volunteers(input)

        })
    }
    else {
        return res.status(200).send(testEmailList())
    }
})


// See in XCode CenterViewController.checkLoggedIn()
exports.onLogin = functions.database.ref('cb_api_events/all-events/{key}').onCreate(event => {
    if(event.data.val().event_type != 'login')
        return false

    return db.ref('administration/configuration').once('value').then(snapshot => {
        var on_user_login = 'volunteers'
        if(snapshot.val().on_user_login) {
            on_user_login = snapshot.val().on_user_login
        }
        if(on_user_login != 'volunteers') {
            return false // everything below is the "new" way.  If config is not for the "new" way, just quit early
        }

        var environment = 'cb_production_environment'
        if(snapshot.val().environment && snapshot.val().environment == 'cb_qa_environment') {
            environment = snapshot.val().environment
        }

        var simulate_no_petition = snapshot.val().simulate_no_petition
        var simulate_no_confidentiality_agreement = snapshot.val().simulate_no_confidentiality_agreement
        var simulate_banned = snapshot.val().simulate_banned

        // the /volunteers endpoint calls this when it completes successfully (see further down)
        var successFn = function(result) {
            var r = {}
            if(result.vol.id) r.citizen_builder_id = result.vol.id
            if(result.vol.first_name) r.first_name = result.vol.first_name
            if(result.vol.last_name) r.last_name = result.vol.last_name
            if(result.vol.roles) {
                var roles = {}
                _.each(result.vol.roles, function(role) {
                    var substrIndx = role.startsWith("TelePatriot ") ? "TelePatriot ".length : 0
                    var rolename = role.substring(substrIndx)
                    roles[rolename] = "true" // TODO really should be a boolean.  This is a "legacy" bug from way back
                })
                r.roles = roles
            }

            if(result.vol.address) r.address = result.vol.address
            if(result.vol.city) r.city = result.vol.city
            if(result.vol.state) r.state = result.vol.state.toLowerCase()
            if(result.vol.email) r.email = result.vol.email
            if(result.vol.phone) r.phone = result.vol.phone.replace(/\D/g,''); // gets rid of everything that isn't a digit
            if(result.vol.is_banned) r.is_banned = simulate_banned ? true : result.vol.is_banned
            if(result.vol.petition_signed) r.petition_signed = simulate_no_petition ? false : result.vol.petition_signed
            if(result.vol.volunteer_agreement_signed) r.volunteer_agreement_signed = simulate_no_confidentiality_agreement ? false : result.vol.volunteer_agreement_signed
            if(result.vol.legislators) {
                // currently (Dec 2018) we're only storing legislative_house_district
                // and legislative_senate_district.  These are the district numbers only
                // but the response from CB looks like this:
                /*****
                "legislators": [
                    {
                      "name": "Bob Hall",
                      "chamber": "upper",
                      "district": "2",
                      "title": "Senator",
                      "email": "bob.hall@senate.texas.gov",
                      "phone": ""
                    },
                    {
                      "name": "Justin Holland",
                      "chamber": "lower",
                      "district": "33",
                      "title": "Representative",
                      "email": "justin.holland@house.texas.gov",
                      "phone": "(469) 573-0575"
                    }
                  ]
                ****/
                _.each(result.vol.legislators, function(legislator) {
                    if(legislator.chamber && legislator.chamber.toLowerCase() == "lower")
                        r.legislative_house_district = legislator.district
                    else r.legislative_senate_district = legislator.district
                })
            }

            r.event_type = 'login-response'
            if(event.data.val().name) r.name = result.vol.first_name && result.vol.last_name ? result.vol.first_name+' '+result.vol.last_name : event.data.val().name
            if(event.data.val().uid) r.uid = event.data.val().uid

            // timestamping is done by triggers in checkVolunteerStatus.js
            db.ref('cb_api_events/all-events').push().set(r)  // really just for record keeping
            db.ref('cb_api_events/login-responses/'+event.data.val().uid).push().set(r) // really just for record keeping

            var userUpdate = {}
            if(r.citizen_builder_id) userUpdate['citizen_builder_id'] = r.citizen_builder_id
            if(r.name) userUpdate['name'] = r.name
            else userUpdate['name'] = event.data.val().name
            if(r.roles) userUpdate['roles'] = r.roles
            if(r.address) userUpdate['residential_address_line1'] = r.address
            if(r.city) userUpdate['residential_address_city'] = r.city
            if(r.state) userUpdate['residential_address_state'] = r.state
            if(event.data.val().email) userUpdate['email'] = event.data.val().email
            if(r.phone) userUpdate['phone'] = r.phone
            if(r.is_banned) userUpdate['is_banned'] = r.is_banned
            if(r.is_banned) userUpdate.account_disposition = 'disabled'
            else userUpdate.account_disposition = 'enabled'
            if(r.petition_signed) userUpdate['has_signed_petition'] = r.petition_signed
            if(r.volunteer_agreement_signed) userUpdate['has_signed_confidentiality_agreement'] = r.volunteer_agreement_signed
            if(r.legislative_house_district) userUpdate['legislative_house_district'] = r.legislative_house_district
            if(r.legislative_senate_district) userUpdate['legislative_senate_district'] = r.legislative_senate_district

            db.ref('users/'+event.data.val().uid).update(userUpdate)

        }
        var errorFn = function(result) { /*TODO what here if error? */ }

        console.log('event.data.val().email = ', event.data.val().email)
        var input = {citizen_builder_api_key_name: snapshot.val()[environment].citizen_builder_api_key_name,
                    citizen_builder_api_key_value: snapshot.val()[environment].citizen_builder_api_key_value,
                    domain: snapshot.val()[environment].citizen_builder_domain,
                    email: event.data.val().email,
                    successFn: successFn,
                    errorFn: errorFn
                    }

        exports.volunteers(input)

    })
})


// called from userCreated.js: onEmailEstablished()
exports.updateUser = function(parameters) {
    var uid = parameters.uid
    var result = parameters.result
    var userInfo = parameters.userInfo

    var r = {}

    if(userInfo) {
        if(userInfo['users/'+uid+'/photoUrl']) r.photoUrl = userInfo['users/'+uid+'/photoUrl']
        if(userInfo['users/'+uid+'/created']) r.created = userInfo['users/'+uid+'/created']
        if(userInfo['users/'+uid+'/created_ms']) r.created_ms = userInfo['users/'+uid+'/created_ms']
        if(userInfo['users/'+uid+'/account_disposition']) r.account_disposition = userInfo['users/'+uid+'/account_disposition']
        if(userInfo['users/'+uid+'/name']) r.name = userInfo['users/'+uid+'/name']
        if(userInfo['users/'+uid+'/name_lower']) r.name_lower = userInfo['users/'+uid+'/name_lower']
        if(userInfo['users/'+uid+'/email']) r.email = userInfo['users/'+uid+'/email']
    }


    if(result.vol.id) r.citizen_builder_id = result.vol.id
    if(result.vol.roles) {
        var roles = {}
        _.each(result.vol.roles, function(role) {
            // "TelePatriot Director" in CB = "Director" in the TelePatriot database
            var substrIndx = role.startsWith("TelePatriot ") ? "TelePatriot ".length : 0
            var rolename = role.substring(substrIndx)
            var rnode = {}
            roles[rolename] = "true" // TODO really should be a boolean.  This is a "legacy" bug from way back
        })
        r.roles = roles
    }

    if(result.vol.address) r.residential_address_line1 = result.vol.address
    if(result.vol.city) r.residential_address_city = result.vol.city
    if(result.vol.state) r.residential_address_state_abbrev = result.vol.state.toLowerCase()
    if(result.vol.email) r.email = result.vol.email
    if(result.vol.phone) r.phone = result.vol.phone.replace(/\D/g,''); // gets rid of everything that isn't a digit
    r.is_banned = result.configuration.simulate_banned ? true : result.vol.is_banned
    if(result.vol.petition_signed) r.has_signed_petition = result.configuration.simulate_no_petition ? false : result.vol.petition_signed
    if(result.vol.volunteer_agreement_signed) r.has_signed_confidentiality_agreement = result.configuration.simulate_no_confidentiality_agreement ? false : result.vol.volunteer_agreement_signed
    if(result.vol.legislators) {
        // currently (Dec 2018) we're only storing legislative_house_district
        // and legislative_senate_district.  These are the district numbers only
        // but the response from CB looks like this:
        /*****
        "legislators": [
            {
              "name": "Bob Hall",
              "chamber": "upper",
              "district": "2",
              "title": "Senator",
              "email": "bob.hall@senate.texas.gov",
              "phone": ""
            },
            {
              "name": "Justin Holland",
              "chamber": "lower",
              "district": "33",
              "title": "Representative",
              "email": "justin.holland@house.texas.gov",
              "phone": "(469) 573-0575"
            }
          ]
        ****/
        _.each(result.vol.legislators, function(legislator) {
            if(legislator.chamber && legislator.chamber.toLowerCase() == "lower")
                r.legislative_house_district = legislator.district
            else r.legislative_senate_district = legislator.district
        })
    }

    r.name = result.vol.first_name+' '+result.vol.last_name
    r.name_lower = r.name.toLowerCase()
    return db.ref('users/'+uid).update(r)
}



exports.getUserInfoFromCB_byEmail = function(email, returnFn, configuration) {

    var environment = configuration.environment ? configuration.environment : "cb_production_environment"
    var domain = configuration[environment].citizen_builder_domain
    var apiKeyName = configuration[environment].citizen_builder_api_key_name
    var apiKeyValue = configuration[environment].citizen_builder_api_key_value

    var headers = {}
    headers[apiKeyName] = apiKeyValue

    var endpoint = 'https://'+domain+'/api/ios/v1/volunteers?email='+email

    var options = {
        url: endpoint,
        headers: headers
    }

    // see above:   var request = require('request')
    request.get(options, function(error, response, body){
        console.log('volunteers:  body = ',body);
        var ret = JSON.parse(body)

//        // test/mock code...
//        vol.petition_signed = true
//        vol.volunteer_agreement_signed = true
//        vol.is_banned = true
//        // test/mock code...

        if(error) {
            //return res.status(200).send(thePage({error: error}))
            console.log('return error = ',error,  ' not what we wanted')
            returnFn({error: error})
        }
        else if(ret.error) {
            console.log('notFound: true')
            returnFn({notFound: true})
        }
        else {
            console.log('found: ', email, ' in CB')
            returnFn({vol: ret, configuration: configuration})
        }

        // If there's no one in CB with this email, the API call will
        // return {"error": "Not found"}
    })

}


exports.volunteers = function(input) {

    console.log('input.email = ', input.email)

    // as long as there's an email address, call the CB API endpoint to see if this person
    // has satisfied the legal requirements
    var endpoint = 'https://'+input.domain+'/api/ios/v1/volunteers?email='+input.email

    var apiKeyName = input.citizen_builder_api_key_name
    var apiKeyValue = input.citizen_builder_api_key_value

    var headers = {}
    headers[input.citizen_builder_api_key_name] = input.citizen_builder_api_key_value

    var options = {
        url: endpoint,
        headers: headers
    };

    // see above:   var request = require('request')
    request.get(options, function(error, response, body){
        console.log('volunteers:  body = ',body);
        var vol = JSON.parse(body)

//        // test/mock code...
//        vol.petition_signed = true
//        vol.volunteer_agreement_signed = true
//        vol.is_banned = true
//        // test/mock code...

        if(error) {
            //return res.status(200).send(thePage({error: error}))
            input.errorFn({error: error})
        }
        else input.successFn({vol: vol}) //return res.status(200).send(thePage({vol: vol}))
    })
}

var testEmailList = function() {
    var html = ''
    var emails = ['bdunklau@yahoo.com', 'bdunklautest@yahoo.com', 'ttpvolunteer@m.ri', 'chdn6@m.ri', 'chlb8@m.ri', 'someuser5@mailinator.com', 'chlb2@m.ri']
    html += '<table border="0">'
    html += '   <tr><td><b>Click an email below to see the volunteer\'s info</b></td></tr>'

    _.each(emails, function(email) {
        html += '<tr><td><a href="/testVolunteers?email='+email+'">'+email+'</a></td></tr>'
    })

    html += '</table>'
    return html
}

var testVolunteerInfo = function(vol) {
    var html = ''
    html += '<table border="0">'
    html += '   <tr><th colspan="2">Volunteer Info</th></tr>'
    html += '   <tr><td>id</td><td><a href="/testPersonTeams?person_id='+vol.id+'" title="see teams for this person">'+vol.id+'</a></td></tr>'
    html += '   <tr><td>first_name</td><td>'+vol.first_name+'</td></tr>'
    html += '   <tr><td>last_name</td><td>'+vol.last_name+'</td></tr>'
    html += '   <tr><td>address</td><td>'+vol.address+'</td></tr>'
    html += '   <tr><td>city</td><td>'+vol.city+'</td></tr>'
    html += '   <tr><td>state</td><td>'+vol.state+'</td></tr>'
    html += '   <tr><td>email</td><td>'+vol.email+'</td></tr>'
    html += '   <tr><td>phone</td><td>'+vol.phone+'</td></tr>'
    html += '   <tr><td>is_banned</td><td>'+vol.is_banned+'</td></tr>'
    html += '   <tr><td>petition_signed</td><td>'+vol.petition_signed+'</td></tr>'
    html += '   <tr><td>volunteer_agreement_signed</td><td>'+vol.volunteer_agreement_signed+'</td></tr>'
    html += '</table>'
    return html
}

var showError = function(stuff) {
    var html = ''
    if(stuff.error) {
        html += '   <tr>'
        html +=         '<td colspan="2">'+stuff.error+'</td>'
        html += '   </tr>'
    }
    return html
}

var thePage = function(stuff) {
    var html = ''
    html += '<table border="0" cellspacing="10">'
    html += showError(stuff)
    html += '   <tr>'
    html +=         '<td colspan="2"><b>Endpoint:</b> /volunteers</td>'
    html += '   </tr>'
    html += '   <tr>'
    html +=         '<td valign="top">'+testEmailList()+'</td>'
    if(stuff.vol) {
        html +=     '<td valign="top">'+testVolunteerInfo(stuff.vol)+'</td>'
    }
    html += '   </tr>'
    html += '</table>'
    return html
}

