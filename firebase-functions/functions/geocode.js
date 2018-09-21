'use strict';


// external dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const request = require('request')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database()

/***
paste this on the command line...
firebase deploy --only functions:geocodeMain,functions:testLookupLatLong,functions:testLookupDistrict
***/

// ref:  https://developers.google.com/maps/documentation/geocoding/start
exports.geocodeMain = functions.https.onRequest((req, res) => {
    var html = ''
    html += showPage({})
    return res.status(200).send(html)
})


exports.testLookupLatLong = functions.https.onRequest((req, res) => {

    var httpResponse = function(stuff) {
        return res.status(200).send(showPage({residential_address_line1: req.body.residential_address_line1,
                                            residential_address_city: req.body.residential_address_city,
                                            residential_address_state_abbrev: req.body.residential_address_state_abbrev,
                                            lat: stuff.lat,
                                            lng: stuff.lng}))
    }

    exports.lookupLatLong({residential_address_line1: req.body.residential_address_line1,
                  residential_address_city: req.body.residential_address_city,
                  residential_address_state_abbrev: req.body.residential_address_state_abbrev,
                  callback: httpResponse})

})


exports.testLookupDistrict = functions.https.onRequest((req, res) => {

    var httpResponse = function(stuff) {
        return res.status(200).send(showPage({residential_address_line1: req.body.residential_address_line1,
                                            residential_address_city: req.body.residential_address_city,
                                            residential_address_state_abbrev: req.body.residential_address_state_abbrev,
                                            state_upper_district: stuff.state_upper_district,
                                            state_lower_district: stuff.state_lower_district}))
    }

    exports.lookupDistrict({residential_address_line1: req.body.residential_address_line1,
                  residential_address_city: req.body.residential_address_city,
                  residential_address_state_abbrev: req.body.residential_address_state_abbrev,
                  callback: httpResponse})

})


exports.lookupDistrict = function(stuff) {

    var latLongResponse = function(result) {
        result.callback = stuff.callback
        lookupDistrictByLatLong(result)
    }

    exports.lookupLatLong({residential_address_line1: stuff.residential_address_line1,
                  residential_address_city: stuff.residential_address_city,
                  residential_address_state_abbrev: stuff.residential_address_state_abbrev,
                  callback: latLongResponse})
}


var lookupDistrictByLatLong = function(stuff) {

    // https://openstates.org/api/v1/legislators/geo/?lat=32.96&long=-96.47&apikey=aad44b39-c9f2-4cc5-a90a-e0503e5bdc3c
    var url = 'https://openstates.org/api/v1/legislators/geo/?lat='+stuff.lat+'&long='+stuff.lng+'&apikey='+stuff.openstates_api_key
    request(url, function(error, response, body) {

        var legislators = JSON.parse(body)
        var state_upper_district
        var state_lower_district
        _.each(legislators, function(legislator) {
            if(legislator.chamber == 'lower')
                state_lower_district = legislator.district
            else state_upper_district = legislator.district
        })
        stuff.callback({state_upper_district: state_upper_district, state_lower_district: state_lower_district})
    })
}


exports.lookupLatLong = function(stuff) {
    var address = stuff.residential_address_line1+','+stuff.residential_address_city+','+stuff.residential_address_state_abbrev
    return db.ref('/api_tokens').once('value').then(snapshot => {
        //var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=api_key'
        var url = 'https://maps.googleapis.com/maps/api/geocode/json?address='+address+'&key='+snapshot.val().google_maps_api_key
        request(url, function (error, response, body) {

            var results = JSON.parse(body).results[0].geometry.location
            var lat = results.lat
            var lng = results.lng
            stuff.callback({lat: lat,
                            lng: lng,
                            openstates_api_key: snapshot.val().openstates})

        })
    })
}


var showPage = function(stuff) {
    var html = ''
    html += '<html><head></head><body>'
    html += showForm(stuff)
    html += '<p/>'+showLatLong(stuff)
    html += '<p/>'+showDistrict(stuff)
    html += '</body></html>'
    return html
}

var showForm = function(stuff) {
    var residential_address_line1 = '1600 Amphitheatre Parkway'
    var residential_address_city = 'Mountain View'
    var residential_address_state_abbrev = 'CA'
    if(stuff.residential_address_line1)
        residential_address_line1 = stuff.residential_address_line1
    if(stuff.residential_address_city)
        residential_address_city = stuff.residential_address_city
    if(stuff.residential_address_state_abbrev)
        residential_address_state_abbrev = stuff.residential_address_state_abbrev

    var html = ''
    html += '<form method="post" action="/testLookupLatLong">'
    html += '<br/>Address: <input type="text" name="residential_address_line1" size="50" placeholder="address" value="'+residential_address_line1+'">'
    html += '<br/>City: <input type="text" name="residential_address_city" size="50" placeholder="city" value="'+residential_address_city+'"> '
    html += '<br/>State abbrev: <input type="text" name="residential_address_state_abbrev" size="50" placeholder="state" value="'+residential_address_state_abbrev+'"><P/> '

    html += '<input type="submit" value="Lat/Long" formaction="/testLookupLatLong"> &nbsp;&nbsp;&nbsp;'
    html += '<input type="submit" value="District" formaction="/testLookupDistrict">'
    html += '</form>'
    return html
}

var showLatLong = function(stuff) {
    if(!stuff || !stuff.lat || !stuff.lng)
        return ''
    var html = ''
    html += 'Latitude: '+stuff.lat
    html += '<br/>Longitude: '+stuff.lng
    return html
}

var showDistrict = function(stuff) {
    if(!stuff)
        return ''
    var html = ''
    html += 'Senate Dist: '+stuff.state_upper_district
    html += '<br/>House Dist: '+stuff.state_lower_district
    return html
}
