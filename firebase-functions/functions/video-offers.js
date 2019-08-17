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
exports.onVideoOffer = functions.database.ref('video/offers/{uid}').onWrite((change, context) => {
    var data = change.after.val()
    var params = context.params
    var updates = {}
    updates['users/'+params.uid+'/phone'] = data.phone
    updates['users/'+params.uid+'/residential_address_line1'] = data.residential_address_line1
    updates['users/'+params.uid+'/residential_address_line2'] = data.residential_address_line2
    updates['users/'+params.uid+'/residential_address_city'] = data.residential_address_city
    updates['users/'+params.uid+'/residential_address_state_abbrev'] = data.residential_address_state_abbrev
    updates['users/'+params.uid+'/residential_address_zip'] = data.residential_address_zip

    var validAddress = data.residential_address_line1 && data.residential_address_city
                        && data.residential_address_state_abbrev

    if(validAddress) {
        var handleResponse = function(result) {
            updates['users/'+params.uid+'/state_upper_district'] = result.state_upper_district
            updates['video/offers/'+params.uid+'/state_upper_district'] = result.state_upper_district
            if(result.state_lower_district) {
                updates['users/'+params.uid+'/state_lower_district'] = result.state_lower_district
                updates['video/offers/'+params.uid+'/state_lower_district'] = result.state_lower_district
            }
            return db.ref('/').update(updates)
        }

        geocode.lookupDistrict({
            residential_address_line1: data.residential_address_line1,
            residential_address_city: data.residential_address_city,
            residential_address_state_abbrev: data.residential_address_state_abbrev,
            callback: handleResponse
        })
        return true
    }
    else
        return db.ref().child('users/'+params.uid).update(updates)
})