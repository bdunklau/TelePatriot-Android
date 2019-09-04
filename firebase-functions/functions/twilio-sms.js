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


var getTableOfMessages = function(smsMessages) {
    var html = ''
    html += '<h3>Replies</h3>'
    html += 'These are all the replies to the text blast'
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


// returns the "from" and "forward_to_numbers" phone numbers
var getSmsNumbers = function(args) {
    if(args.twilio_sms_number && args.forward_to_numbers) {
        return new Promise((resolve, reject) => {
            resolve(args)
        })
    }
    else {
        // at some point, may want to change limitToFirst(1) to get all "from" numbers instead and display them in a dropdown
        return db.ref('sms/numbers').limitToFirst(1).once('value').then(snapshot => {
            var numbers = {twilio_sms_number: '', forward_to_numbers: []}
            snapshot.forEach(function(child) {
                // have to change this if we replace limitToFirst(1)...
                numbers.twilio_sms_number = child.val().twilio_sms_number
                numbers.forward_to_numbers = []
                console.log('child.child(forward_to_numbers) = ', child.child('forward_to_numbers'))
                child.child('forward_to_numbers').forEach(function(num) {
//                    console.log('numbers.forward_to_numbers.push('+num.val()+')')
                    numbers.forward_to_numbers.push(num.val())
                })
            })
            return numbers;
        })
    }
}


var getSmsMessages = function(limit) {
    return db.ref('/sms/messages').orderByChild('date_ms').limitToLast(limit).once('value').then(snapshot => {
        var messages = []
        snapshot.forEach(function(child) {
            var message = child.val()
            message.key = child.key
            messages.push(message)
        })
        return messages
    })
}


/**
Fired when a record is written (when an SMS message is received) at /sms/messages
This function does a CB lookup by phone number to get the name of the person that replied to our text message
so that we can display this person's name in /displaySms

THIS FUNCTION TRIGGERS ANOTHER FUNCTION: onNameResolved
**/
exports.onSmsReceived = functions.database.ref('/sms/messages/{key}').onCreate((snapshot, context) => {
    var phone = snapshot.val().From
    console.log('phone = ', phone)
    if(phone.startsWith('+1')) phone = phone.substring(2, phone.length);

    return new Promise((resolve, reject) => {
        var whenDone = function(result) {
            var addThis = {}
            var name = result.vol ? result.vol.first_name + ' ' + result.vol.last_name : 'No CB Account'
            var printedName = result.vol ? result.vol.first_name + ' ' + result.vol.last_name : ''
            var cbProfile = result.vol ? name+'\'s profile in CB:\nhttps://dashboard.conventionofstates.com/admin/people/'+cbid : '(This person is not in CitizenBuilder)'
            var cbid = result.vol ? result.vol.id : 'No CB Account'
            addThis.FromName = name;
            addThis.FromId = cbid
            // add the recipient's name and CB ID to the /sms/messages record
            db.ref('sms/messages/'+context.params.key).update(addThis).then(() => {
                // now kick ass and send this back as an SMS message to each of the "forward_to_numbers"
                getSmsNumbers({}).then(numbers => {
                    var body = 'Reply from '+printedName+' '+snapshot.val().From+'\n\n'+snapshot.val().Body+'\n\n'+cbProfile
                    var from = snapshot.val().To // the "to" in the reply message is now the "from" in the forwarded text

                    console.log('numbers.forward_to_numbers: ', numbers.forward_to_numbers);
                    db.ref('/api_tokens').once('value').then(snapshot => {
                        const client = twilio(snapshot.val().twilio_account_sid, snapshot.val().twilio_auth_token);
                        _.each(numbers.forward_to_numbers, function(phone) {
                            if(!phone.startsWith('+1')) phone = '+1'+phone
                            console.log('forwarding to: ', phone);
                            client.messages
                              .create({
                                 body: body,
                                 from: from,
                                 to: phone
                               })
                              .then(message => console.log(message.sid));
                        })

                        result.resolve(true)
                    })

                })
            });
        }

        getUserInfoFromCB_byPhone(context.params.key, phone, whenDone, resolve)
    })
})


// This is a webhook that receives POST's when an SMS message is received by Twilio
exports.receiveSms = functions.https.onRequest((req, res) => {

    if(!req.body) {
        return res.status(200).send({notok: 'no request body'})
    }

    var postThis = req.body
    postThis.date = date.asCentralTime()
    postThis.date_ms = date.asMillis()
    return db.ref('/sms/messages').push().set(postThis).then(() => {
        return res.status(200).send('ok')
    })

})


var sendMessageArea = function(numbers) {
    var html = '<P/>'
    html += '<form method="post">'
    html += '<input type="hidden" size="15" name="twilio_sms_number" value="'+numbers.twilio_sms_number+'" placeholder="from phone #">'
    html += '<p/>'
    html += '<b>Send text blast to these numbers</b><br/>'
    html += '<textarea name="phones" rows=20 cols=40 placeholder="Phone #s here\nOne number per line">'
    html += '</textarea>'
    html += '<p/>'
    html += '<textarea name="message" rows=20 cols=40 placeholder="Text message blast goes here">'
    html += '</textarea>'
    html += '<p/>'
    html += '<b>Forward replies to these numbers</b><br/>'
    html += '<textarea name="forward_to_numbers" rows=10 cols=40 placeholder="Send replies back to these numbers\nOne number per line">'
    html += _.join(numbers.forward_to_numbers, '\n')
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
                 from: req.body.twilio_sms_number,
                 to: phone
               })
              .then(message => console.log(message.sid));
        })
        return thePage({twilio_sms_number: req.body.twilio_sms_number}).then(html => {
            return res.status(200).send(html)
        })
    })
})


var thePage = function(args) {
    var limit = 50
    if(args.limit) limit = args.limit

    return getSmsMessages(limit).then(smsMessages => {
        return getSmsNumbers(args).then(numbers => {
            var html = ''
            html += '<html><head></head>'
            html += '<body><a href="/displaySms">Refresh</a>'
            html += '<P/>'
            html += '<b>This page will send a text blast from this number: '+numbers.twilio_sms_number+'</b>'
            html += '<table border="0" cellspacing="2" cellpadding="2">'
            html += '<tr><td>' + sendMessageArea(numbers) + '</td><td valign="top">' + getTableOfMessages(smsMessages) + '</td></tr>'
            html += '</table>'
            html += '</body></html>'
            return html
        })

    })

}


var getUserInfoFromCB_byPhone = function(key, phone, whenDone, resolve) {

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

        // see above:   var request = require('request')
        request.get(options, function(error, response, body){
            var ret = JSON.parse(body)

            if(error) {
                //return res.status(200).send(thePage({error: error}))
                console.log('return error = ',error,  ' not what we wanted')
//                    returnFn({error: error})
                whenDone({error: error, resolve: resolve})
            }
            else if(ret.error) {
                console.log('notFound: true')
//                    returnFn({notFound: true})
                whenDone({notFound: true, resolve: resolve})
            }
            else {
                console.log('found: ', phone, ' in CB')
//                    returnFn({vol: ret, configuration: configuration})
                whenDone({vol: ret, configuration: configuration, resolve: resolve})
            }

            // If there's no one in CB with this email, the API call will
            // return {"error": "Not found"}
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

