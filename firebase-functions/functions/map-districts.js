'use strict';

/**************************
This script file is for presenting a web page that lets you map districts in OpenStates.org
with districts from the Google Civic API.
The civic api defines "divisions" like this:  /country:us/state:tx/sldl:33 and /country:us/state:tx/sldu:2

sldl = state legislative district lower  i.e. the House
sldu = state legislative district upper  i.e. the Senate

THE REAL REASON WE NEED THIS SCRIPT IS BECAUSE WE CAN'T DEFINITIVELY MAP DISTRICTS FROM OpenStates TO DIVISIONS
IN THE CIVIC API.  For most states, we can.  But for at least one, Mass, it's just easier to display all the
districts from OpenStates side by side with the divisions from the civic api.  That's because OpenStates names
Mass districts like this:  Eleventh Blah, Blah and Blah   while the civic api will name the same district like
this:  11th_blah_blah_blah

It would take too much code to convert Eleventh to 11th and then strip out the commas and replace whitespace
with underbars.

It's easier to create a long form of text fields and hand jam the values ...because they will never change
**************************/


// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

// for callling OpenStates API
var request = require('request')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


exports.districtMapper = functions.https.onRequest((req, res) => {

    return showPage({res: res})
})


var showPage = function(stuff) {
    var html = ''
    html += '<html><head></head><body>'
    html += '<table cellspacing="0" cellpadding="2" border="1">'
    html += '<tr>'
    html +=     '<th>OpenStates -> Google Civic Data</th>'
    html +=     '<th>Google Civic Data -> OpenStates</th>'
    html += '</tr>'
    html += '<tr>'
    html +=     '<td><a href="/mapOpenStatesToGoogleCivic">Show All OpenStates Districts</a></td>'
    html +=     '<td><a href="/mapGoogleCivicToOpenStates">Show All Google Civic Districts</a></td>'
    html += '</tr>'
    html += '<tr>'
    html +=     '<td><a href="/mapOpenStatesToGoogleCivic?show=notfounds">Show Just "Not Founds"</a></td>'
    html +=     '<td><a href="/mapGoogleCivicToOpenStates?show=notfounds">Show Just "Not Founds"</a></td>'
    html += '</tr>'
    html += '</table>'
    if(stuff.open_states_districts_html) {
        html += stuff.open_states_districts_html
    }
    html += '</body></html>'
    return stuff.res.status(200).send(html)
}


exports.mapOpenStatesToGoogleCivic = functions.https.onRequest((req, res) => {
    // reads all the districts from OpenStates and display a form
    return db.ref(`states/districts`).once('value').then(snapshot => { // for now, get all districts
        var unfilteredOpenStatesDistricts = []
        snapshot.forEach(function(child) {
            var osData = child.val()
            osData.key = child.key
            unfilteredOpenStatesDistricts.push(osData)
        })
        return {res: res, openStatesDistricts: unfilteredOpenStatesDistricts}
    })
    .then(stuff => {
        return db.ref(`google_civic_data/divisions`).once('value').then(snapshot => {
            var civicDivisions = []
            snapshot.forEach(function(child) {
                var civicData = child.val()
                civicData.key = child.key
                civicDivisions.push(civicData)
            })
            stuff.civic_divisions = civicDivisions
            return stuff
        })
        .then(stuff => {
            // Now look for a district/division match in the Google Civic data...
            var districtsWithResults = [] // with results means we are adding a 'result' attribute to each OpenStates district object indicating whether we found a corresponding entry in the Google Civic data or not
            for(var i=0; i < stuff.openStatesDistricts.length; i++) {
                var civicDivision = _.find(stuff.civic_divisions, {'division': stuff.openStatesDistricts[i].civic_division})
                var result = 'Google Civic District not found'
                var found = false
                if(civicDivision) {
                    result = civicDivision
                    found = true
                }
                stuff.openStatesDistricts[i].result = result
                stuff.openStatesDistricts[i].found = found
                districtsWithResults.push(stuff.openStatesDistricts[i])
            }
            stuff.openStatesDistricts = districtsWithResults
            return stuff
        })
        .then(stuff => {
            // Now we're going to see if we passed in a request parameter of 'show' (see showPage() above).  If we did, we look at the value of
            // the parameter and either show all the 'not founds' or we show all the 'founds'
            if(req.query.show) {
                if(req.query.show == 'notfounds') {
                    // we are only going to show the districts from OpenStates where we couldn't find a corresponding division from the Google Civic data
                    var filteredOpenStatesDistricts = _.filter(stuff.openStatesDistricts, {'found': false})
                    stuff.openStatesDistricts = filteredOpenStatesDistricts
                }
            }
            return stuff
        })
        .then(stuff => {
            var html = ''
            html = '<table border="0">'
            html +=     '<tr>'
            html +=         '<th>State</th>'
            html +=         '<th>Chamber</th>'
            html +=         '<th>Dist</th>'
            html +=         '<th>?Division?</th>'
            html +=         '<th>?Found?</th>'
            html +=     '</tr>'
            for(var i=0; i < stuff.openStatesDistricts.length; i++) {
                html += '<tr>'
                html +=     '<td>'+stuff.openStatesDistricts[i].state_abbrev+'</td>'
                html +=     '<td>'+stuff.openStatesDistricts[i].chamber+'</td>'
                html +=     '<td>'+stuff.openStatesDistricts[i].district+'</td>'
                html +=     '<td>'
                html +=         '<a href="/checkGoogleCivicDivision?division='+stuff.openStatesDistricts[i].civic_division+'" target="new">check</a>'
                html +=         stuff.openStatesDistricts[i].civic_division  // see legislators.js: downloadFromOpenStates()
                html +=     '</td>'

                var text = 'division not found'
                var style = 'style="background-color:#800000;color:#ffffff"'
                if(stuff.openStatesDistricts[i].found) {
                    text = 'division found'
                    style = 'style="background-color:#008000;color:#ffffff"'
                }
                html +=     '<td '+style+'>'+text+'</td>'

                html += '</tr>'
            }
            html += '</table>'
            stuff.open_states_districts_html = html
            return stuff
        })
        .then(stuff => {
            return showPage(stuff)
        })

    })

})


exports.checkGoogleCivicDivision = functions.https.onRequest((req, res) => {
    var division = req.query.division

    division = division.replace(/[/]/g, "%2F")
    division = division.replace(/:/g, "%3A")

    return db.ref(`api_tokens/google_cloud_api_key`).once('value').then(snapshot => {
        var apikey = snapshot.val()
        var civicApiUrl = "https://www.googleapis.com/civicinfo/v2/representatives/"+division+"?fields=officials&key="+apikey
        return res.redirect(civicApiUrl)
    })

})


exports.mapGoogleCivicToOpenStates = functions.https.onRequest((req, res) => {

})