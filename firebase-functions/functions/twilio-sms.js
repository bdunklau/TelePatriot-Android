'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const twilio = require('twilio')
const request = require('request')


// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();



// firebase deploy --only functions:displaySms,functions:receiveSms,functions:onSmsReceived,functions:sendSms


// This is a webhook that receives POST's when an SMS message is received by Twilio
exports.receiveSms = functions.https.onRequest((req, res) => {

    if(!req.body) {
        return res.status(200).send({notok: 'no request body'})
    }

    var postThis = req.body
    postThis.date = date.asCentralTime()
    postThis.date_ms = date.asMillis()
    return db.ref('/sms').push().set(postThis).then(() => {
        return res.status(200).send({ok: 'ok'})
    })

})


var getTableOfMessages = function(smsMessages) {
    var html = ''
    html += '<table border="0" cellspacing="2" cellpadding="2">'
    html += '<tr>'
    html +=     '<th>Date</th>'
    html +=     '<th>From</th>'
    html +=     '<th>Phone</th>'
    html +=     '<th>Message</th>'
    html += '</tr>'
    _.each(smsMessages, function(message) {
        html += '<tr>'
        html +=     '<td>'+message.date+'</td>'
        html +=     '<td><a href="https://dashboard.conventionofstates.com/admin/people/'+message.FromId+'" target="cb" title="See '+message.FromName+' in CitizenBuilder">'+message.FromName+'</a></td>'
        html +=     '<td><a href="tel:'+message.From+'">'+message.From+'</td>'
        html +=     '<td>'+message.Body+'</td>'
        html += '</tr>'
    })
    html += '</table>'
    return html
}


exports.displaySms = functions.https.onRequest((req, res) => {
    var limit = 50
    if(req.query.limit) limit = parseInt(req.query.limit)
    return thePage({limit: limit}).then(html => {
        return res.status(200).send(html)
    })
})


var getSmsMessages = function(limit) {
    return db.ref('/sms').orderByChild('date_ms').limitToLast(limit).once('value').then(snapshot => {
        var messages = []
        snapshot.forEach(function(child) {
            var message = child.val()
            message.key = child.key
            messages.push(message)
        })
        return messages
    })
}


var sendMessageArea = function() {
    var html = ''
    html += '<form method="post">'
    html += '<textarea name="phones" rows=20 cols=40 placeholder="Phone #s here\nOne number per line">'
    html += '</textarea>'
    html += '<textarea name="message" rows=20 cols=40 placeholder="Text message blast goes here">'
    html += '</textarea>'
    html += '<P/><input type="submit" value="Send SMS" formAction="/sendSms">'
    html += '</form>'
    return html;
}


/**
This is the function that sends the text blast
**/
exports.sendSms = functions.https.onRequest((req, res) => {
    var phones = _.split(req.body.phones, '\n')
    return db.ref('/api_tokens').once('value').then(snapshot => {
        const client = twilio(snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token);
        _.each(phones, function(phone) {
            if(!phone.startsWith('+1')) phone = '+1'+phone

            client.messages
              .create({
                 body: req.body.message,
                 from: '+12673314843',
                 to: phone
               })
              .then(message => console.log(message.sid));
        })
        return thePage({limit: limit}).then(html => {
            return res.status(200).send(html)
        })
    })
})


var thePage = function(args) {
    var limit = 50
    if(args.limit) limit = args.limit
    return getSmsMessages(limit).then(smsMessages => {
        var html = ''
        html += '<html><head></head>'
        html += '<body><a href="/displaySms">Refresh</a>'
        html += '<table border="0" cellspacing="2" cellpadding="2">'
        html += '<tr><td>' + sendMessageArea() + '</td><td>' + getTableOfMessages(smsMessages) + '</td></tr>'
        html += '</table>'
        html += '</body></html>'
        return html
    })
}


/**
Fired when a record is written (when an SMS message is received) at /sms
This function does a CB lookup by phone number to get the name of the person that replied to our text message
so that we can display this person's name in /displaySms
**/
exports.onSmsReceived = functions.database.ref('/sms/{key}').onCreate((snapshot, context) => {
    var phone = snapshot.val().From
    console.log('phone = ', phone)
    if(phone.startsWith('+1')) phone = phone.substring(2, phone.length);

//    var returnFn = function(result) {
//        var addThis = {}
//        var name = result.vol ? result.vol.first_name + ' ' + result.vol.last_name : 'No CB Account'
//        var cbid = result.vol ? result.vol.id : 'No CB Account'
//        addThis.FromName = name;
//        addThis.FromId = cbid
//        return db.ref('sms/'+key).update(addThis);
//    }

    return getUserInfoFromCB_byPhone(context.params.key, phone).then(result => {
        var addThis = {}
        var name = result.vol ? result.vol.first_name + ' ' + result.vol.last_name : 'No CB Account'
        var cbid = result.vol ? result.vol.id : 'No CB Account'
        addThis.FromName = name;
        addThis.FromId = cbid
        return db.ref('sms/'+context.params.key).update(addThis);
    });
})


var getUserInfoFromCB_byPhone = function(key, phone) {

    return db.ref().child('administration/configuration').once('value').then(snap2 => {
        var configuration = snap2.val()

        var environment = configuration.environment ? configuration.environment : "cb_production_environment"
        var domain = configuration[environment].citizen_builder_domain
        var apiKeyName = configuration[environment].citizen_builder_api_key_name
        var apiKeyValue = configuration[environment].citizen_builder_api_key_value

        var headers = {}
        headers[apiKeyName] = apiKeyValue

        var endpoint = 'https://'+domain+'/api/ios/v1/volunteers?phone='+phone

        var options = {
            url: endpoint,
            headers: headers
        }

        return new Promise((resolve, reject) => {
            // see above:   var request = require('request')
            request.get(options, function(error, response, body){
                var ret = JSON.parse(body)

                if(error) {
                    //return res.status(200).send(thePage({error: error}))
                    console.log('return error = ',error,  ' not what we wanted')
//                    returnFn({error: error})
                    resolve({error: error})
                }
                else if(ret.error) {
                    console.log('notFound: true')
//                    returnFn({notFound: true})
                    resolve({notFound: true})
                }
                else {
                    console.log('found: ', phone, ' in CB')
//                    returnFn({vol: ret, configuration: configuration})
                    resolve({vol: ret, configuration: configuration})
                }

                // If there's no one in CB with this email, the API call will
                // return {"error": "Not found"}
            })
        })


        /******
        API CALL RETURNS THIS...

        {
          "id": XXXX,
          "first_name": "XXXXXX",
          "last_name": "XXXXXXXXXXX",
          "roles": [
            "DC Team",
            "TelePatriot Admin",
            "TelePatriot Moderator",
            "TelePatriot Director",
            "TelePatriot Volunteer",
            "RC Team"
          ],
          "address": "XXXXXXXXXXX",
          "city": "XXXXXX",
          "state": "XX",
          "email": "XXXXXXXXXXXXXX",
          "phone": "(XXX) XXX-XXXX",
          "is_banned": false,
          "petition_signed": true,
          "volunteer_agreement_signed": true,
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
        }
        *****/

    })



}

