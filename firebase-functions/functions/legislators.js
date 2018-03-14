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

    var html = ''
    for(var i=0; i < states.length; i++) {
        var abbrev = states[i].state_abbreviation
        db.ref(`states/${abbrev}`).set({state_name: states[i].state_name}).then(() => {
            html += 'OK: inserted '+abbrev+' - '+states[i].state_name
        })
    }

    return res.status(200).send(html)

})


exports.downloadFromOpenStates = functions.https.onRequest((req, res) => {

    return db.ref(`api_tokens/openstates`).once('value').then(snapshot => {
        var apikey = snapshot.val()
        return apikey
    })
    .then(apikey => {

        // loop through each state
        return db.ref(`states`).once('value').then(snapshot => {
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
            var html = ''
            for(var i=98; i < openStatesParameters.length; i++) {
                var state = openStatesParameters[i].state_abbrev
                var chamber = openStatesParameters[i].chamber
                // construct the url that we send to OpenStates to get all the legislators in this state
                var url = "https://openstates.org/api/v1/legislators/?state="+state+"&chamber="+chamber+"&apikey="+apikey
                //  https://openstates.org/api/v1/legislators/?state=TX&chamber=upper&apikey=aad44b39-c9f2-4cc5-a90a-e0503e5bdc3c

                var start = new Date().getTime();
                for (var i = 0; i < 1e7; i++) {
                    if ((new Date().getTime() - start) > 250){
                        break;
                    }
                }

                html += '<P/>'+url

                /************/
                // make the request
                // see above:   var request = require('request')
                request(url, function (error, response, body) {
                    if( error || response.statusCode != 200) {
                        return res.status(200).send("response code: "+response.statusCode+"<P>error: "+error)
                    }
                    else if (!error && response.statusCode == 200) {
                        html += '<br/><B>Response</B><br/>'+response
                        html += '<br/><B>body</B><br/>'+body
                    }
                    else {
                        html += '<P>at i="+i+"  not what we expected'
                    }
                    if(i == openStatesParameters.length - 1) {
                        return res.status(200).send(html)
                    }
                })
                /*************/
            }
        })

    })


})