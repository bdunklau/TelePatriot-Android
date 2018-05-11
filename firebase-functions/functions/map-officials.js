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


exports.officialMapper = functions.https.onRequest((req, res) => {
    // report on any nodes under google_civic_data/divisions that aren't present in google_civic_data/officials
    // because it should be one to one but I found at least one instance where a node was missing: AL HD 59
    return getDistrictsToReload(res)
    .then(stuff => {
        return showPage(stuff)
    })
})


var showPage = function(stuff) {
    var html = ''
    html += '<html><head>'
    if(stuff.refresh) {
        html += '<meta http-equiv="refresh", content="'+stuff.refresh.seconds+'; url='+stuff.refresh.url+'" />'
    }
    html += '</head>'
    html += '<body>'
    html += '<table cellspacing="0" cellpadding="2" border="1">'
    html += '<tr>'
    html +=     '<th>OpenStates -> Google Civic Data</th>'
    html +=     '<th>Google Civic Data -> OpenStates</th>'
    html += '</tr>'
    html += '<tr>'
    html +=     '<td><a href="/osToCivicOfficials">Show All OpenStates Officials</a></td>'
    //html +=     '<td><a href="/mapGoogleCivicToOpenStates">Show All Google Civic Districts</a></td>'
    html += '</tr>'
    html += '<tr>'
    html +=     '<td><a href="/osToCivicOfficials?show=notfounds">Show Just "Not Founds"</a></td>'
    //html +=     '<td><a href="/mapGoogleCivicToOpenStates?show=notfounds">Show Just "Not Founds"</a></td>'
    html += '</tr>'
    html += '</table>'
    if(stuff.woopsHtml) {
        html += stuff.woopsHtml
    }
    if(stuff.open_states_officials_html) {
        html += stuff.open_states_officials_html
    }
    html += '</body></html>'
    return stuff.res.status(200).send(html)
}


// this returns the nodes from google_civic_data/divisions that aren't found in google_civic_data/officials
// for the purpose of doing a "try again" load.  Because we know the officials exist.  They just failed to load
// for these districts for some reason
var getDistrictsToReload = function(res) {
    return db.ref(`google_civic_data/divisions`).once('value').then(snapshot => {
        var divisions = []
        snapshot.forEach(function(child) {
            var division = child.val()
            division.key = child.key
            divisions.push(division)
        })
        return {res: res, divisions: divisions}
    })
    .then(stuff => {
        return db.ref(`google_civic_data/officials`).once('value').then(snapshot => {
            var officials = []
            snapshot.forEach(function(child) {
                var official = child.val()
                official.key = child.key
                officials.push(official)
            })
            stuff.officials = officials
            return stuff
        })
        .then(stuff => {
            var woops = []
            for(var i=0; i < stuff.divisions.length; i++) {
                var ok = _.find(stuff.officials, {'state_abbrev': stuff.divisions[i].state_abbrev, 'chamber': stuff.divisions[i].chamber, 'district': stuff.divisions[i].district})

                if(!ok) {
                    woops.push(stuff.divisions[i])
                }
            }
            stuff.districtsToReload = woops
            return stuff
        })
        .then(stuff => {
              var html = '<table cellspacing="0" cellpading="2" border="1">'
              html += '<tr>'
              html +=     '<td colspan="4">Need to fix this.  These districts have nodes under google_civic_data/divisions but NOT under '
              html +=     'google_civic_data/officials.  So basically, when we tried to pull down officials in these districts, we failed.'
              html +=     ' So we need to <a href="/tryLoadingOfficialsAgain">try again</a>  <-- Clicking this link will cause the page to '
              html +=     'automatically refresh because we have to load these officials one at a time.  The automatic refresh means you don\'t have to hit refresh yourself.  Just let the page do it. '
              html += '   </td>'
              html += '</tr>'
              for(var i=0; i < stuff.districtsToReload.length; i++) {
                  html += '<tr>'
                  html +=     '<td>'+stuff.districtsToReload[i].state_abbrev+'</td>'
                  html +=     '<td>'+stuff.districtsToReload[i].chamber+'</td>'
                  html +=     '<td>'+stuff.districtsToReload[i].district+'</td>'
                  html +=     '<td>'+stuff.districtsToReload[i].division+'</td>'
                  html += '</tr>'
              }
              html += '</table>'
              stuff.woopsHtml = html
              stuff.res = res
              return stuff
        })
    })
}


exports.tryLoadingOfficialsAgain = functions.https.onRequest((req, res) => {
    return getDistrictsToReload(res).then(stuff => {
        return db.ref(`api_tokens/google_cloud_api_key`).once('value').then(snapshot => {
            var apikey = snapshot.val()
            stuff.apikey = apikey
            stuff.ref = snapshot.ref
            return stuff
        })
        .then(stuff => {
            // You can't loop through all the civic official urls.  You have do reload them one request at a time!
            // that sucks
            if(!stuff.districtsToReload || stuff.districtsToReload.length == 0) {
                return stuff
            }

            var districtToReload = stuff.districtsToReload[0]

            request(districtToReload.official_url, function (error, response, body) {
                if(error) {
                    console.log('error: ', error)
                    return
                }
                var offs = JSON.parse(body).officials
                var updates = {}
                for(var o=0; o < offs.length; o++) {
                    var state_abbrev = districtToReload.state_abbrev
                    var chamber = districtToReload.chamber
                    var district = districtToReload.district
                    var ms = date.asMillis()
                    var key = state_abbrev+'-'+chamber+'-'+district+'-'+o
                    var official = offs[o]
                    official.state_abbrev = state_abbrev
                    official.chamber = chamber
                    official.district = district
                    official.division = districtToReload.division
                    official.load_date = date.asCentralTime()
                    official.load_date_ms = date.asMillis()
                    updates[`google_civic_data/officials/${key}`] = official
                    stuff.ref.root.child(`states/list/${state_abbrev}/civic_officials_loaded`).transaction(current => {
                        return (current || 0) + 1;
                    })
                    if(official.channels && official.channels.length > 0) {
                        stuff.ref.root.child(`states/list/${state_abbrev}/channels_loaded`).transaction(current => {
                            return (current || 0) + 1;
                        })
                    }
                }
                stuff.ref.root.update(updates)
            })

            stuff.refresh = {url: 'https://us-central1-telepatriot-dev.cloudfunctions.net/tryLoadingOfficialsAgain', seconds: 10}
            return stuff
        })
    })
    .then(stuff => {
        return showPage(stuff)
    })
})



exports.osToCivicOfficials = functions.https.onRequest((req, res) => {
    // reads all the officials from OpenStates and display a form
    return db.ref(`states/legislators`).orderByChild('civic_data_loaded_date_ms').equalTo('').once('value').then(snapshot => { // for now, get all districts
        var unfilteredOfficials = []
        snapshot.forEach(function(child) {
            var osData = child.val()
            osData.key = child.key
            unfilteredOfficials.push(osData)
        })
        return {res: res, openStatesOfficials: unfilteredOfficials}
    })
    .then(stuff => {
        return db.ref(`google_civic_data/officials`).orderByChild('openstates_match_date_ms').once('value').then(snapshot => {
            var civicOfficials = []
            snapshot.forEach(function(child) {
                var civicData = child.val()
                civicData.key = child.key
                civicOfficials.push(civicData)
            })
            stuff.civic_officials = civicOfficials
            db.ref(`templog`).push({number_of_officials: snapshot.numChildren(), date: date.asCentralTime()})
            return stuff
        })
        .then(stuff => {
            // Now look for an official match in the Google Civic data...
            var officialsWithResults = [] // with results means we are adding a 'result' attribute to each OpenStates legislator object indicating whether we found a corresponding entry in the Google Civic data or not
            for(var i=0; i < stuff.openStatesOfficials.length; i++) {
                // comment out the assignment below to turn off debugging
                //var debugParms = {state_abbrev:'fl', chamber:'lower', district:'103', name:'Manny Diaz, Jr.'}
                var debugThis = false
                //if(debugParms) {
                //    debugThis = stuff.openStatesOfficials[i].state == debugParms.state_abbrev && stuff.openStatesOfficials[i].chamber == debugParms.chamber && stuff.openStatesOfficials[i].district == debugParms.district
                //}
                //if(!debugThis)
                //    continue
                var civicOfficial = _.find(stuff.civic_officials, function(official) {
                    var sameState = stuff.openStatesOfficials[i].state == official.state_abbrev // NOTE: just 'state' for OpenStates data
                    var sameChamber = stuff.openStatesOfficials[i].chamber == 'upper' ? official.chamber == 'sldu' : official.chamber == 'sldl'
                    var sameDivision = stuff.openStatesOfficials[i].division == official.division
                    var sameDistrict = stuff.openStatesOfficials[i].district.toLowerCase() == (official.district+'').toLowerCase()
                    var sameFullname = stuff.openStatesOfficials[i].full_name == official.name
                    var flast = stuff.openStatesOfficials[i].first_name + ' ' + stuff.openStatesOfficials[i].last_name
                    var sameFirstLast = flast == official.name
                    var sameName = sameFullname || sameFirstLast
                    var sameEmail = true
                    if(stuff.openStatesOfficials[i].email && official.emails && official.emails.length > 0) {
                        var foundEmail = _.find(official.emails, function(email) {return email.toLowerCase() == stuff.openStatesOfficials[i].email.toLowerCase()})
                        if(!foundEmail) sameEmail = false
                    }
                    var strongMatch = sameState && sameChamber && sameDivision && (sameName || sameEmail)
                    var weakerMatch = sameState && sameDistrict && sameEmail
                    if(debugThis && official.name.toLowerCase().substring(0,4) == debugParms.name.toLowerCase().substring(0,4)) {
                        console.log('name:', official.name, 'sameState:', sameState, 'sameChamber:', sameChamber, 'sameDivision:', sameDivision, 'sameName:', sameName,
                            'sameEmail:', sameEmail, 'sameDistrict:', sameDistrict, 'strongMatch:', strongMatch, 'weakerMatch:', weakerMatch )
                    }
                    return strongMatch || weakerMatch
                })
                var result = 'Google Civic official not found'
                var found = false
                if(civicOfficial) {
                    result = civicOfficial
                    found = true
                    stuff.openStatesOfficials[i].civicOfficial = civicOfficial
                        db.ref(`templog`).push({found_civic_official: civicOfficial,
                                                state: stuff.openStatesOfficials[i].state,
                                                chamber: stuff.openStatesOfficials[i].chamber,
                                                division: stuff.openStatesOfficials[i].division,
                                                date: date.asCentralTime()})
                }
                else {
                    // if we didn't find the civic official, then we will display all the civic officials
                    // in the district so that the user (me) can select which official is the "matching" official
                    var civicOfficials = _.filter(stuff.civic_officials, function(official) {
                        var sameState = stuff.openStatesOfficials[i].state == official.state_abbrev // NOTE: just 'state' for OpenStates data
                        var sameChamber = stuff.openStatesOfficials[i].chamber == 'upper' ? official.chamber == 'sldu' : official.chamber == 'sldl'
                        var sameDivision = stuff.openStatesOfficials[i].division == official.division
                        if(sameState && sameChamber)
                        /*******
                        db.ref('templog').push().set({sameState: sameState, sameChamber: sameChamber, sameDistrict: sameDistrict,
                                os_state: stuff.openStatesOfficials[i].state, c_state: official.state_abbrev,
                                os_chamber: stuff.openStatesOfficials[i].chamber, c_chamber: official.chamber,
                                os_district: stuff.openStatesOfficials[i].district, c_district: official.district})
                        *******/
                        return sameState && sameChamber && sameDivision
                    })
                    if(!civicOfficials) {
                        // error condition that has been known to happen even though I don't understand why
                        // Ex: Alabama HD 59 was in google_civic_data/divisions but not in google_civic_data/officials
                        // There should always be a node in google_civic_data/officials for every node in google_civic_data/divisions
                        db.ref(`templog`).push({woops: 'civicOfficials was null - did not handle this case',
                                                state: stuff.openStatesOfficials[i].state,
                                                chamber: stuff.openStatesOfficials[i].chamber,
                                                division: stuff.openStatesOfficials[i].division,
                                                date: date.asCentralTime()})
                    }
                    else {
                        stuff.openStatesOfficials[i].civicOfficials = civicOfficials
                        db.ref(`templog`).push({message: 'found '+civicOfficials.length+' civic officials',
                                                state: stuff.openStatesOfficials[i].state,
                                                chamber: stuff.openStatesOfficials[i].chamber,
                                                division: stuff.openStatesOfficials[i].division,
                                                date: date.asCentralTime()})
                    }
                }
                stuff.openStatesOfficials[i].result = result
                stuff.openStatesOfficials[i].found = found
                officialsWithResults.push(stuff.openStatesOfficials[i])
            }
            stuff.openStatesOfficials = officialsWithResults
            return stuff
        })
        .then(stuff => {
            // Now we're going to see if we passed in a request parameter of 'show' (see showPage() above).  If we did, we look at the value of
            // the parameter and either show all the 'not founds' or we show all the 'founds'
            if(req.query.show) {
                if(req.query.show == 'notfounds') {
                    // we are only going to show the districts from OpenStates where we couldn't find a corresponding division from the Google Civic data
                    var filteredOpenStatesOfficials = _.filter(stuff.openStatesOfficials, {'found': false})
                    stuff.openStatesOfficials = filteredOpenStatesOfficials
                }
            }
            return stuff
        })
        .then(stuff => {
            var html = ''
            html += '<form method="post" action="/matchLegislators">'
            html += '<table border="1" cellspacing="0" cellpadding="2">'
            html +=     '<tr>'
            html +=         '<th>OpenStates Legislators</th>'
            html +=         '<th>Google Civic Officials <input type="submit" value="Match Legislators"></th>'
            html +=     '</tr>'
            for(var i=0; i < stuff.openStatesOfficials.length; i++) {
                html += '<tr>'
                html +=     '<td valign="top">'+stuff.openStatesOfficials[i].state+' '+stuff.openStatesOfficials[i].chamber+' '+stuff.openStatesOfficials[i].district
                html +=         '<br/>'+stuff.openStatesOfficials[i].full_name
                html +=         '<br/><a href="mailto:'+stuff.openStatesOfficials[i].email+'">'+stuff.openStatesOfficials[i].email+'</a>'
                html +=         '<br/>'+stuff.openStatesOfficials[i].phone
                if(stuff.openStatesOfficials[i].channels && stuff.openStatesOfficials[i].channels.length > 0) {
                    var channels = stuff.openStatesOfficials[i].channels
                    for(var k=0; k < channels.length; k++) {
                        html += '<br/>'+channels[k].type+': '+channels[k].id
                    }
                }
                html +=     '</td>' // not state_abbrev, this is OpenStates data

                var style = 'style="background-color:#800000;color:#ffffff"'
                var foundState = '-'
                var foundChamber = '-'
                var foundDistrict = '-'
                var foundOfficial = '-'
                if(stuff.openStatesOfficials[i].found) {
                    style = 'style="background-color:#008000;color:#ffffff"'
                    foundState = stuff.openStatesOfficials[i].civicOfficial.state_abbrev
                    foundChamber = stuff.openStatesOfficials[i].civicOfficial.chamber
                    foundDistrict = stuff.openStatesOfficials[i].civicOfficial.district
                    foundOfficial = stuff.openStatesOfficials[i].civicOfficial.name
                    html += '<td>'+foundState+' '+foundChamber+' '+foundDistrict+'<br/>'+foundOfficial+'</td>'
                }
                else {
                    var civicOfficials = stuff.openStatesOfficials[i].civicOfficials
                    html += '<td>'
                    for(var j=0; j < civicOfficials.length; j++) {
                        var checkboxName = civicOfficials[j].key
                        html += '<input type="checkbox" name="'+checkboxName+'" value="checked" /> '
                        html += civicOfficials[j].state_abbrev + ' ' + civicOfficials[j].chamber + ' ' + civicOfficials[j].district + ' '
                        html += '<a href="/checkGoogleCivicDivision?division='+civicOfficials[j].division+'" target="new">'+civicOfficials[j].division+'</a> '
                        html += '<br/>' + civicOfficials[j].name
                        html += '<hr/>'
                    }
                    html += '</td>'
                }


                html += '</tr>'
            }
            html += '</table>'
            html += '</form>'
            stuff.open_states_officials_html = html
            return stuff
        })
        .then(stuff => {
            return showPage(stuff)
        })

    })

})