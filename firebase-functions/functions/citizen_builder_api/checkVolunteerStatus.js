'use strict';

const admin = require('firebase-admin')

// for calling CitizenBuilder API
var request = require('request')

// create reference to root of the database
const db = admin.database().ref()



/*****************************
Tells us if a person (email) has satisfied the requirements to see COS volunteer info
The requirements are: petition signed, conf agreement signed, and not banned
*****************************/
exports.checkVolunteerStatus = function(email, allowed, notAllowed) {

    // as long as there's an email address, call the CB API endpoint to see if this person
    // has satisfied the legal requirements
    var endpoint = 'https://api.conventionofstates.com/api/ios/v1/volunteer_validation/check?email='+email

    db.child(`api_tokens`).once('value').then(snapshot => {
        var apiKeyName = snapshot.val().citizen_builder_api_key_name
        var apiKeyValue = snapshot.val().citizen_builder_api_key_value


        var headers = {}
        headers[apiKeyName] = apiKeyValue

        var options = {
            url: endpoint,
            headers: headers
        };

        // see above:   var request = require('request')
        request.get(options, function(error, response, body){
            //console.log(body);
            var obj = JSON.parse(body)
            var ok = ''
            if(obj.volunteer) {
                allowed()
            }
            else {
                notAllowed()
            }
        })

    })
}