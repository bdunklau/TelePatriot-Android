'use strict';


// external dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const geocode = require('./geocode')


// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database()

/***
paste this on the command line...
firebase deploy --only functions:onVideoOffer
***/


// When a video offer comes in, make sure the user's record is updated with the phone number
 // and residential address info from their offer
exports.onVideoOffer = functions.database.ref('video/offers/{uid}').onWrite(event => {
    var updates = {}
    updates['users/'+event.params.uid+'/phone'] = event.data.val().phone
    updates['users/'+event.params.uid+'/residential_address_line1'] = event.data.val().residential_address_line1
    updates['users/'+event.params.uid+'/residential_address_line2'] = event.data.val().residential_address_line2
    updates['users/'+event.params.uid+'/residential_address_city'] = event.data.val().residential_address_city
    updates['users/'+event.params.uid+'/residential_address_state_abbrev'] = event.data.val().residential_address_state_abbrev
    updates['users/'+event.params.uid+'/residential_address_zip'] = event.data.val().residential_address_zip

    var validAddress = event.data.val().residential_address_line1 && event.data.val().residential_address_city
                        && event.data.val().residential_address_state_abbrev

    if(validAddress) {
        var handleResponse = function(result) {
            updates['users/'+event.params.uid+'/state_upper_district'] = result.state_upper_district
            updates['video/offers/'+event.params.uid+'/state_upper_district'] = result.state_upper_district
            if(result.state_lower_district) {
                updates['users/'+event.params.uid+'/state_lower_district'] = result.state_lower_district
                updates['video/offers/'+event.params.uid+'/state_lower_district'] = result.state_lower_district
            }
            return db.ref('/').update(updates)
        }

        geocode.lookupDistrict({
            residential_address_line1: event.data.val().residential_address_line1,
            residential_address_city: event.data.val().residential_address_city,
            residential_address_state_abbrev: event.data.val().residential_address_state_abbrev,
            callback: handleResponse
        })
        return true
    }
    else
        return event.data.adminRef.root.child('users/'+event.params.uid).update(updates)
})