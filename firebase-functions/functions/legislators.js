'use strict';

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


// inserts a state node under /states,  i.e.  /states/TX, /states/AR, ...
// only meant to be called one time
exports.loadStates = functions.https.onRequest((req, res) => {

    // loop through each state
    var states = [
        {state_abbreviation:'AL', state_name:'Alabama'},
        {state_abbreviation:'AK', state_name:'Alaska'},
        {state_abbreviation:'AZ', state_name:'Arizona'},
        {state_abbreviation:'AR', state_name:'Arkansas'},
        {state_abbreviation:'CA', state_name:'California'},
        {state_abbreviation:'CO', state_name:'Colorado'},
        {state_abbreviation:'CT', state_name:'Connecticut'},
        {state_abbreviation:'DE', state_name:'Delaware'},
        {state_abbreviation:'FL', state_name:'Florida'},
        {state_abbreviation:'GA', state_name:'Georgia'},
        {state_abbreviation:'HI', state_name:'Hawaii'},
        {state_abbreviation:'ID', state_name:'Idaho'},
        {state_abbreviation:'IL', state_name:'Illinois'},
        {state_abbreviation:'IN', state_name:'Indiana'},
        {state_abbreviation:'IA', state_name:'Iowa'},
        {state_abbreviation:'KS', state_name:'Kansas'},
        {state_abbreviation:'KY', state_name:'Kentucky'},
        {state_abbreviation:'LA', state_name:'Louisiana'},
        {state_abbreviation:'ME', state_name:'Maine'},
        {state_abbreviation:'MD', state_name:'Maryland'},
        {state_abbreviation:'MA', state_name:'Massachusetts'},
        {state_abbreviation:'MI', state_name:'Michigan'},
        {state_abbreviation:'MN', state_name:'Minnesota'},
        {state_abbreviation:'MS', state_name:'Mississippi'},
        {state_abbreviation:'MO', state_name:'Missouri'},
        {state_abbreviation:'MT', state_name:'Montana'},
        {state_abbreviation:'NE', state_name:'Nebraska'},
        {state_abbreviation:'NV', state_name:'Nevada'},
        {state_abbreviation:'NH', state_name:'New Hampshire'},
        {state_abbreviation:'NJ', state_name:'New Jersey'},
        {state_abbreviation:'NM', state_name:'New Mexico'},
        {state_abbreviation:'NY', state_name:'New York'},
        {state_abbreviation:'NC', state_name:'North Carolina'},
        {state_abbreviation:'ND', state_name:'North Dakota'},
        {state_abbreviation:'OH', state_name:'Ohio'},
        {state_abbreviation:'OK', state_name:'Oklahoma'},
        {state_abbreviation:'OR', state_name:'Oregon'},
        {state_abbreviation:'PA', state_name:'Pennsylvania'},
        {state_abbreviation:'RI', state_name:'Rhode Island'},
        {state_abbreviation:'SC', state_name:'South Carolina'},
        {state_abbreviation:'SD', state_name:'South Dakota'},
        {state_abbreviation:'TN', state_name:'Tennessee'},
        {state_abbreviation:'TX', state_name:'Texas'},
        {state_abbreviation:'UT', state_name:'Utah'},
        {state_abbreviation:'VT', state_name:'Vermont'},
        {state_abbreviation:'VA', state_name:'Virginia'},
        {state_abbreviation:'WA', state_name:'Washington'},
        {state_abbreviation:'WV', state_name:'West Virginia'},
        {state_abbreviation:'WI', state_name:'Wisconsin'},
        {state_abbreviation:'WY', state_name:'Wyoming'}
    ]

    // good example of multi-path updates
    var updates = {}
    var html = ''
    for(var i=0; i < states.length; i++) {
        var abbrev = states[i].state_abbreviation
        updates[`states/list/${abbrev}/state_name`] = states[i].state_name
            html += 'OK: inserted '+abbrev+' - '+states[i].state_name
    }

    // good example of multi-path updates
    return db.ref(`/`).update(updates).then(() => {
        return res.status(200).send(html)
    })

})


// This function writes 99 url's to the database - 1 for each state legislative body
// These url's are written under each respective state's node
//  i.e.  /states/{abbrev}/legislative_chambers/{HD or SD}/openstates_legislators_url = https://openstates.org/api/v1/legislators/...
// TRIGGER !  As a result of writing these url's, a trigger just below this function is called
exports.getOpenStatesUrls = functions.https.onRequest((req, res) => {

    return db.ref(`api_tokens/openstates`).once('value').then(snapshot => {
        var apikey = snapshot.val()
        return apikey
    })
    .then(apikey => {

        // loop through each state
        return db.ref(`states/list`).once('value').then(snapshot => {
            var numberOfStates = snapshot.numChildren() // i.e. 50
            var count = 0
            var openStatesParameters = []
            snapshot.forEach(function(child) {
                ++count
                var state_abbrev = child.key
                openStatesParameters.push({state_abbrev: state_abbrev, chamber: 'upper'})
                if(state_abbrev != 'NE') {
                    openStatesParameters.push({state_abbrev: state_abbrev, chamber: 'lower'})
                }
            })
            return openStatesParameters
        })
        .then(openStatesParameters => {

            var updates = {}
            var html = ''
            for(var i=0; i < openStatesParameters.length; i++) {
                var state = openStatesParameters[i].state_abbrev
                var chamber = openStatesParameters[i].chamber
                // construct the url that we send to OpenStates to get all the legislators in this state
                var url = "https://openstates.org/api/v1/legislators/?state="+state+"&chamber="+chamber+"&apikey="+apikey
                //  https://openstates.org/api/v1/legislators/?state=TX&chamber=upper&apikey=aad44b39-c9f2-4cc5-a90a-e0503e5bdc3c

                html += '<P/>'+url

                var legislative_chamber = 'SD'
                if(chamber == 'lower')
                    legislative_chamber = 'HD'

                updates[`states/list/${state}/legislative_chambers/${legislative_chamber}/openstates_legislators_url`] = url

            }

            return db.ref(`/`).update(updates).then(() => {
                return res.status(200).send(html)
            })

        })

    })

})


// This trigger is called when url's are written to the various state nodes in the
// function above: getOpenStatesUrls()
// This is the function that actually makes the call to the OpenStates API to pull down all
// the legislators in a legislative chamber
exports.downloadFromOpenStates = functions.database.ref("states/list/{abbrev}/legislative_chambers/{legislative_chamber}/openstates_legislators_url").onWrite(
    event => {

    // if mission was deleted, just return
    if(!event.data.exists() && event.data.previous.exists()) {
        return false
    }

    var abbrev = event.params.abbrev
    var legislative_chamber = event.params.legislative_chamber // SD or HD
    var url = event.data.val() // the value associated with the "openstates_legislators_url" node

    return request(url, function (error, response, body) {
        return event.data.adminRef.root.child(`states/legislators/${abbrev}/legislative_chambers/${legislative_chamber}/legislators`).set(JSON.parse(body))
    })
})