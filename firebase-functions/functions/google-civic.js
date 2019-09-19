'use strict';

// FIRST THING TO LOAD DATA IS TO CALL THE HTTP FUNCTION:  loadDivisions  (defined below)

// These functions are for pulling down data from the Google Civic Information API

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

/***
to deploy everything in this file...
firebase deploy --only functions:civic,functions:listOfficials,functions:loadOfficials,functions:onOfficialUrl,functions:unloadOfficials,functions:listDivisions,functions:loadDivisionsAllStates,functions:unloadDivisions,functions:loadDivisions,functions:loadDivisionsTrigger
***/

exports.civic = functions.https.onRequest((req, res) => {
    return listStates().then(states => {
        return showPage({res: res, states: states})
    })
})


var listStates = function() {
    return db.ref('states/list').once('value').then(snapshot => {
        var states = []
        snapshot.forEach(function(child) {
            var stateNode = child.val()
            stateNode.state_abbrev = child.key
            states.push(stateNode)
        })
        return states
    })
}

var instructions = function() {
    var html = ''
    html += '<h3>Instructions</h3>'
    html += 'This page is for pulling down legislator and district data using the Google Civic Information API.  The data gets pulled down from google and stored at /google_civic_data.'
    html += '<p/><b>Divisions</b>'
    html += '<br/>Think of divisions as districts.  Here\'s an example of a division: ocd-division/country:us/state:ak/sldl:14 The state is Alaska. The district is HD14. sldl stands for state legislative district lower. sldu would be the Senate '
    html += '<br/>Loading divisions - You don\'t have to load divisions often. If you thought the number of districts grew or shrank, then you would want to unload and reload the divisions for a state'
    html += '<br/><b>load vs unload vs list</b>'
    html += '<br/>loading divisions means pulling down the list of divisions (districts) from google and storing them at /google_civic_data/divisions'
    html += '<br/>unloading divisions means deleting the divisions (districts) stored at /google_civic_data/divisions'
    html += '<br/>listing divisions query for the the divisions (districts) stored at /google_civic_data/divisions.  "list" exists because "load" is asynchronous and can return the page before all the results have been pulled down from google. '
    html += 'So "list" is kind of like "refresh the page"'
    html += '<P/><b>Officials</b>'
    html += '<br/>These are the legislators.  You can load and unload these as often as you like.'
    html += '<br/><b>load vs unload vs list</b>'
    html += '<br/>These 3 mean the same thing for legislators that they did for divisions above.'
    return html
}

var showPage = function(stuff) {
    var html = ''
    html += '<html>'
    html += '<head></head><body>'
    html += instructions()
    html += '<table border="0">'
    html +=     '<tr>'
    html +=         '<td valign="top" rowspan="2">'
    html += stateListHtml(stuff)
    html +=         '</td>'
    html +=         '<td valign="top" rowspan="2">'
    html += divisionListHtml(stuff)
    html +=         '</td>'
    html +=         '<td valign="top">'
    html += officialListHtml(stuff)
    html +=         '</td>'
    html +=     '</tr>'
    html +=     '<tr>'
    html +=         '<td valign="top">' // because of rowspans above, this is actually the 3rd column
    html += missingOfficialsListHtml(stuff)
    html +=         '</td>'
    html +=     '</tr>'
    html += '</table>'
    html += '</body></html>'
    return stuff.res.status(200).send(html)
}


var stateListHtml = function(stuff) {
    var html = ''
    html += '<table cellspacing="0" cellpadding="2" border="1">'
    for(var i=0; i < stuff.states.length; i++) {
        var total = stuff.states[i].sd_actual + stuff.states[i].hd_actual
        var offBy = total - stuff.states[i].civic_officials_loaded
        var style = ''
        if(offBy == 0) {
            style += ' style="background-color:#008000;color:#ffffff"'
        }
        var divisions_loaded = 'n/a'
        if(stuff.states[i].civic_divisions_loaded) divisions_loaded = stuff.states[i].civic_divisions_loaded
        var divisionStyle = ''
        if(divisions_loaded+'' == total+'') {
            divisionStyle += ' style="background-color:#008000;color:#ffffff"'
        }
        // error condition: more officials loaded than total
        var officialCountNotPossible = ''
        if(stuff.states[i].civic_officials_loaded > total) {
            officialCountNotPossible = '<span style="background-color:#FF4444;color:#ffffff">not possible</span>'
        }

        html += '<tr>'
        html += '   <td nowrap>'+stuff.states[i].state_name+' House Districts: '+stuff.states[i].hd_actual+' Senate Districts: '+stuff.states[i].sd_actual
        html +=         '<br/><a href="/query?node=/google_civic_data/states/'+stuff.states[i].state_abbrev+'" target="new">/query?node=/google_civic_data/states/'+stuff.states[i].state_abbrev+'</a>'
        html +=         '<br/><a href="/query?node=/google_civic_data/divisions&attribute=state_abbrev&value='+stuff.states[i].state_abbrev+'" target="new">/query?node=/google_civic_data/divisions&attribute=state_abbrev&value='+stuff.states[i].state_abbrev+'</a>'
        html +=         '<br/><a href="/query?node=/google_civic_data/officials&attribute=state_abbrev&value='+stuff.states[i].state_abbrev+'" target="new">/query?node=/google_civic_data/officials&attribute=state_abbrev&value='+stuff.states[i].state_abbrev+'</a>'
        html +=         '<p/><span '+divisionStyle+'>divisions loaded: '+divisions_loaded+'</span>'
        html +=         '<br/><a href="/loadDivisions?state='+stuff.states[i].state_abbrev+'">/loadDivisions?state='+stuff.states[i].state_abbrev+'</a>'
        html +=         '<br/><a href="/unloadDivisions?state='+stuff.states[i].state_abbrev+'">/unloadDivisions?state='+stuff.states[i].state_abbrev+'</a>'
        html +=         '<br/><a href="/listDivisions?state='+stuff.states[i].state_abbrev+'">/listDivisions?state='+stuff.states[i].state_abbrev+'</a>'
        html +=         '<p/><span '+style+'>Officials loaded: '+stuff.states[i].civic_officials_loaded+' of '+total+'</span> '+officialCountNotPossible
        html +=         '<br/><a href="/loadOfficials?state='+stuff.states[i].state_abbrev+'">/loadOfficials?state='+stuff.states[i].state_abbrev+'</a>'
        html +=         '<br/><a href="/unloadOfficials?state='+stuff.states[i].state_abbrev+'">/unloadOfficials?state='+stuff.states[i].state_abbrev+'</a>'
        html +=         '<br/><a href="/listOfficials?state='+stuff.states[i].state_abbrev+'">/listOfficials?state='+stuff.states[i].state_abbrev+'</a>'
        html +=         '<p/>Officials with social media: '+stuff.states[i].channels_loaded+' out of '+total
        html +=    '</td>'

        html += '</tr>'
    }
    html += '</table>'
    return html
}


var divisionListHtml = function(stuff) {
    if(!stuff.divisions)
        return ''

    var html = ''
    html += '<table cellspacing="0" cellpadding="2" border="1">'
    html +=     '<tr>'
    html +=         '<th>state</th>'
    html +=         '<th>chamber</th>'
    html +=         '<th>district</th>'
    html +=         '<th>division</th>'
    html +=         '<th>load_date</th>'
    html +=         '<th>load_date_ms</th>'
    html +=     '</tr>'
    for(var i=0; i < stuff.divisions.length; i++) {
        html += '<tr>'
        html +=     '<td>'+stuff.divisions[i].state_abbrev+'</td>'
        html +=     '<td>'+stuff.divisions[i].chamber+'</td>'
        html +=     '<td>'+stuff.divisions[i].district+'</td>'
        html +=     '<td><a href="/checkGoogleCivicDivision?division='+stuff.divisions[i].division+'" target="new">'+stuff.divisions[i].division+'</a></td>'
        html +=     '<td>'+stuff.divisions[i].load_date+'</td>'
        html +=     '<td>'+stuff.divisions[i].load_date_ms+'</td>'
        html += '</tr>'
    }
    html += '</table>'
    return html
}


var officialListHtml = function(stuff) {
    if(!stuff.officials)
        return ''

    var html = ''
    html += '<table cellspacing="0" cellpadding="2" border="1">'
    html +=     '<tr>'
    var state = _.find(stuff.states, {'state_abbrev': stuff.state_abbrev})
    var expectedCountMsg = ''
    if(state) {
        var hd_count = state.hd_actual
        var sd_count = state.sd_actual
        if(!isNaN(hd_count) && !isNaN(sd_count)) {
            var totalexpected = hd_count + sd_count
            var notLoaded = totalexpected - stuff.officials.length
            var ok = totalexpected == stuff.officials.length ? 'GOOD' : (notLoaded > 0 ? notLoaded+' not loaded' : (-1 * notLoaded)+' more than expected')
            expectedCountMsg = 'Needed: '+totalexpected+' &nbsp;&nbsp;  Result: '+ok
        }
    }
    html +=         '<th colspan="9">Number of Officials Loaded: '+stuff.officials.length+' &nbsp;&nbsp;'+expectedCountMsg+'</th>'
    html +=     '</tr>'
    html +=     '<tr>'
    html +=         '<th>state</th>'
    html +=         '<th>chamber</th>'
    html +=         '<th>district</th>'
    html +=         '<th>division</th>'
    html +=         '<th>name</th>'
    html +=         '<th>email</th>'
    html +=         '<th>channels</th>'
    html +=         '<th>load_date</th>'
    html +=         '<th>load_date_ms</th>'
    html +=     '</tr>'
    for(var i=0; i < stuff.officials.length; i++) {
        html += '<tr>'
        html +=     '<td>'+stuff.officials[i].state_abbrev+'</td>'
        html +=     '<td>'+stuff.officials[i].chamber+'</td>'
        html +=     '<td>'+stuff.officials[i].district+'</td>'
        html +=     '<td><a href="/checkGoogleCivicDivision?division='+stuff.officials[i].division+'" target="new">'+stuff.officials[i].division+'</a></td>'
        html +=     '<td>'+stuff.officials[i].name+'</td>'

        var emails = _.map(stuff.officials[i].emails, function(item) {
            var emailUrl = 'mailto:'+item
            return '<a href="'+emailUrl+'">'+item+'</a>'
        })
        html +=     '<td>'+_.join(emails, '<br/>')+'</td>'

        var channels = _.map(stuff.officials[i].channels, function(item) {
            if(item.type && item.type.toLowerCase() == 'googleplus') {
                var socMedia = 'https://plus.google.com/'+item.id
                return '<a href="'+socMedia+'">'+socMedia+'</a>'
            }
            else if(item.type) {
                var socMedia = 'https://www.'+item.type+'.com/'+item.id
                return '<a href="'+socMedia+'">'+socMedia+'</a>'
            }
            else return ''
        })
        html +=     '<td>'+_.join(channels, '<br/>')+'</td>'
        html +=     '<td>'+stuff.officials[i].load_date+'</td>'
        html +=     '<td>'+stuff.officials[i].load_date_ms+'</td>'
        html += '</tr>'
    }
    html += '</table>'
    return html
}


var missingOfficialsListHtml = function(stuff) {
    if(!stuff.missing_officials)
        return ''

    var html = ''
    html += '<table cellspacing="0" cellpadding="2" border="1">'
    html +=     '<tr>'
    html +=         '<th colspan="4">Officials for these Divisions/Districts<br/>did not get loaded</th>'
    html +=     '</tr>'
    html +=     '<tr>'
    html +=         '<th>state</th>'
    html +=         '<th>chamber</th>'
    html +=         '<th>district</th>'
    html +=         '<th>division</th>'
    html +=     '</tr>'
    for(var i=0; i < stuff.missing_officials.length; i++) {
        html += '<tr>'
        html +=     '<td>'+stuff.missing_officials[i].state_abbrev+'</td>'
        html +=     '<td>'+stuff.missing_officials[i].chamber+'</td>'
        html +=     '<td>'+stuff.missing_officials[i].district+'</td>'
        html +=     '<td><a href="/checkGoogleCivicDivision?division='+stuff.missing_officials[i].division+'" target="new">'+stuff.missing_officials[i].division+'</a></td>'
        html += '</tr>'
    }
    html += '</table>'
    return html
}


exports.listOfficials = functions.https.onRequest((req, res) => {
    var state_abbrev = req.query.state

    return db.ref('google_civic_data/officials').orderByChild('state_abbrev').equalTo(state_abbrev).once('value').then(snapshot => {
        // get hd_loaded and sd_loaded and update the database...
        var allLoadedStateOfficials = []
        snapshot.forEach(function(child) {
            var official = child.val()
            official.key = child.key
            allLoadedStateOfficials.push(official)
        })
        var allLoadedReps = _.filter(allLoadedStateOfficials, {'chamber': 'sldl'})
        var allLoadedSenators = _.filter(allLoadedStateOfficials, {'chamber': 'sldu'})

        var updates = {}
        updates['states/list/'+state_abbrev+'/hd_loaded'] = allLoadedReps.length
        updates['states/list/'+state_abbrev+'/sd_loaded'] = allLoadedSenators.length
        updates['states/list/'+state_abbrev+'/civic_officials_loaded'] = snapshot.numChildren()
        return snapshot.ref.root.update(updates)
    })
    .then(() => {
        return officials({state_abbrev: state_abbrev, res: res})
    })
})

// also queries for those districts where officials didn't get loaded for some reason (like google throttling)
var officials = function(stuff) {

    return db.ref('google_civic_data/officials').orderByChild('state_abbrev').equalTo(stuff.state_abbrev).once('value').then(snapshot => {
        var officials = []
        snapshot.forEach(function(child) {
            //var officialNode = {state_abbrev: child.val().state_abbrev, chamber: child.val().chamber, district: child.val().district, division: child.val().division, load_date: date.asCentralTime(), load_date_ms: date.asMillis()}
            officials.push(child.val())
        })
        stuff.officials = officials
        return stuff
    })
    .then(stuff => {
        const channels_loaded = _.sumBy(stuff.officials, function(o) { return o.channels && o.channels.length > 0 ? 1 : 0 })
        db.ref('states/list/'+stuff.state_abbrev+'/channels_loaded').set(channels_loaded)
        return  stuff
    })
    .then(stuff => {
        db.ref('google_civic_data/officials').orderByChild('state_abbrev').equalTo(stuff.state_abbrev).once('value').then(snapshot => {
            return snapshot.ref.root.child('states/list/'+stuff.state_abbrev+'/civic_officials_loaded').set(snapshot.numChildren())
        })
        return stuff
    })
    .then(stuff => {
        // get the divisions/districts that didn't get loaded...
        return getDivisionsNotLoaded(stuff)
    })
    .then(stuff => {
        return listStates().then(states => {
            stuff.states = states
            return showPage(stuff)
        })
    })
}


//
var getDivisionsNotLoaded = function(stuff) {
    // get the divisions/districts that didn't get loaded...
    console.log('getDivisionsNotLoaded(): stuff.state_abbrev = ', stuff.state_abbrev)
    return db.ref('google_civic_data/divisions').orderByChild('state_abbrev').equalTo(stuff.state_abbrev).once('value').then(snapshot => {
        var missing = []
        snapshot.forEach(function(child) {
            var findThisDivision = child.val().division
            var found = _.find(stuff.officials, {'division': findThisDivision})
            if(!found) {
                var division = child.val()
                division.key = child.key
                missing.push(division)
            }
        })
        stuff.missing_officials = missing
        return stuff
    })
}


exports.loadOfficials = functions.https.onRequest((req, res) => {
    var state_abbrev = req.query.state

    var stuff = {}
    stuff.state_abbrev = state_abbrev

    return db.ref('api_tokens/google_cloud_api_key').once('value').then(snapshot => {
        stuff.apikey = snapshot.val()
        stuff.ref = snapshot.ref
        return stuff
    })
    .then(stuff => {
        return db.ref('google_civic_data/officials').orderByChild('state_abbrev').equalTo(stuff.state_abbrev).once('value').then(snapshot => {
            var officials = []
            snapshot.forEach(function(child) {
                officials.push(child.val())
            })
            stuff.officials = officials
            return stuff
        })
    })
    .then(stuff => {
        // what we need to do is figure out who the missing officials are and only load them.
        // On first load, all officials are missing, so this is a nice general approach
        return getDivisionsNotLoaded(stuff).then(stuff => {
            stuff.res = res
            stuff.state_abbrev = state_abbrev
            console.log('stuff.missing_officials = ', stuff.missing_officials)
            if(!stuff.missing_officials || stuff.missing_officials.length == 0) {
                return stuff
            }

            var deletes = {} //triggers reload for officials that need reloading
            for(var i=0; i < stuff.missing_officials.length; i++) {
                deletes['google_civic_data/divisions/'+stuff.missing_officials[i].key+'/official_url'] = null
            }
            return stuff.ref.root.update(deletes).then(() => {// delete the official_url here then re-insert below to make the onOfficialUrl trigger fire again
                return stuff
            })
            .then(stuff => {

                var updates = {}
                for(var i=0; i < stuff.missing_officials.length; i++) {

                    var division = stuff.missing_officials[i].division
                    var encodedDiv = division.replace(/[/]/g, "%2F")
                    encodedDiv = encodedDiv.replace(/:/g, "%3A")
                    var civicApiUrl = "https://www.googleapis.com/civicinfo/v2/representatives/"+encodedDiv+"?fields=officials&key="+stuff.apikey

                    // we have a trigger that listens for writes to this node...
                    updates['google_civic_data/divisions/'+stuff.missing_officials[i].key+'/official_url'] = civicApiUrl
                }
                return stuff.ref.root.update(updates).then(() => {
                    return officials(stuff)
                })
            })
        })

    })

})


// Trigger that gets the Officials in a district (civic division)
exports.onOfficialUrl = functions.database.ref("google_civic_data/divisions/{key}").onWrite((change, context) => {

    // if mission was deleted, just return
    if(!change.after.exists() && change.before.exists()) {
        return false
    }

    var data = change.after.val()

    if(!data.official_url)
        return false // only care when the 'official_url' node is written

    var divKey = context.params.key
    var civicApiUrl = data.official_url
    var state_abbrev = data.state_abbrev

    return request(civicApiUrl, function (error, response, body) {
        if(error)
            return
        var offs = JSON.parse(body).officials
        if(!offs)
            return false
        var updates = {}
        for(var o=0; o < offs.length; o++) {
            var ms = date.asMillis()
            var key = divKey+'-'+o
            var official = offs[o]
            official.state_abbrev = data.state_abbrev
            official.chamber = data.chamber
            official.district = data.district
            official.state_chamber_district = official.state_abbrev+'-'+official.chamber+'-'+official.district
            official.division = data.division
            official.load_date = date.asCentralTime()
            official.load_date_ms = date.asMillis()
            official.openstates_match_date = ''    // the date that we matched this official with a legislator from OpenStates
            official.openstates_match_date_ms = ''
            updates['google_civic_data/officials/'+key] = official
            db.ref().child('states/list/'+state_abbrev+'/civic_officials_loaded').transaction(current => {
                return (current || 0) + 1;
            })
            if(official.channels && official.channels.length > 0) {
                db.ref().child('states/list/'+state_abbrev+'/channels_loaded').transaction(current => {
                    return (current || 0) + 1;
                })
            }
        }
        return db.ref().update(updates)
    })
})


// Delete the officials for a given state - Sometimes there are problems with the load
// This is how you delete those officials so you can reload
exports.unloadOfficials = functions.https.onRequest((req, res) => {
    var state_abbrev = req.query.state
    var stuff = {}
    stuff.state_abbrev = state_abbrev

    return db.ref('google_civic_data/officials').orderByChild('state_abbrev').equalTo(state_abbrev).once('value').then(snapshot => {
        // should  record the number of rows in query that were deleted - would be good to know
        snapshot.forEach(function(child) {
            child.ref.remove()
        })
        stuff.ref = snapshot.ref
        return stuff
    })
    .then(stuff => {
        var updates = {}
        updates['states/list/'+state_abbrev+'/channels_loaded'] = 0
        updates['states/list/'+state_abbrev+'/civic_officials_loaded'] = 0
        return stuff.ref.root.update(updates).then(() => {
            return listStates().then(states => {
                stuff.res = res
                stuff.states = states
                return showPage(stuff)
            })
        })

    })
})


exports.listDivisions = functions.https.onRequest((req, res) => {
    var state_abbrev = req.query.state

    return db.ref('google_civic_data/divisions').orderByChild('state_abbrev').equalTo(state_abbrev).once('value').then(snapshot => {
        var divisions = []
        snapshot.forEach(function(child) {
            divisions.push(child.val())
        })
        return {divisions: divisions, ref: snapshot.ref}
    })
    .then(stuff => {
        return db.ref('states/list/'+state_abbrev+'/civic_divisions_loaded').set(stuff.divisions.length).then(() => {
            return stuff
        })
    })
    .then(stuff => {
        return listStates().then(states => {
            stuff.res = res
            stuff.states = states
            return showPage(stuff)
        })
    })
})



// PROBLEM loading Ohio and Pennsylvania divisions:
// Google said too many OCD ID's retrieved using this url...
//https://www.googleapis.com/civicinfo/v2/representatives/ocd-division%2Fcountry%3Aus%2Fstate%3Apa?levels=administrativeArea1&recursive=true&roles=legislatorLowerBody&roles=legislatorUpperBody&fields=divisions&key=[apikey]
// PA House: 203,  Senate: 50
// OH House: 99,  Senate: 33

// this function triggers loadDivisionsTrigger defined below
exports.loadDivisionsAllStates = functions.https.onRequest((req, res) => {
    return listStates().then(states => {
        return db.ref('api_tokens/google_cloud_api_key').once('value').then(snapshot => {
            return {apikey: snapshot.val(), ref: snapshot.ref}
        })
        .then(vals => {
            var apikey = vals.apikey
            var updates = {}
            console.log('states = ', states)
            for(var i=0; i < states.length; i++) {
                // example:  https://www.googleapis.com/civicinfo/v2/representatives/ocd-division%2Fcountry%3Aus%2Fstate%3Ama?levels=administrativeArea1&recursive=true&roles=legislatorLowerBody&roles=legislatorUpperBody&fields=divisions&key=apikey
                // returns all the districts in Mass, but not the officials
                var url = "https://www.googleapis.com/civicinfo/v2/representatives/ocd-division%2Fcountry%3Aus%2Fstate%3A"+states[i].state_abbrev+"?levels=administrativeArea1&recursive=true&roles=legislatorLowerBody&roles=legislatorUpperBody&fields=divisions&key="+apikey
                updates['google_civic_data/states/'+states[i].state_abbrev+'/division_list_url'] = url
            }
            return vals.ref.root.update(updates).then(() => {
                return showPage({res: res, states: states})
            })

        })
    })
})


exports.unloadDivisions = functions.https.onRequest((req, res) => {
    var state_abbrev = req.query.state

    // first, get rid of this node.  It may have had division_list_url underneath.  Deleting then re-adding will
    // cause the l
    return db.ref('google_civic_data/divisions/').orderByChild('state_abbrev').equalTo(state_abbrev).once('value').then(snapshot => {
        var deletes = {}
        snapshot.forEach(function(child) {
            deletes['google_civic_data/divisions/'+child.key] = null
        })
        deletes['google_civic_data/states/'+state_abbrev] = null
        return snapshot.ref.root.child('/').update(deletes)
    })
    .then(() => {
        return listStates().then(states => {
            var stuff = {}
            stuff.res = res
            stuff.states = states
            return showPage(stuff)
        })
    })

})


// reads the url at google_civic_data/states/{state_abbrev}/division_list_url and gets the JSON list of
// divisions and writes them to google_civic_data/divisions
// THIS TRIGGERS loadDivisionsTrigger (defined below)
exports.loadDivisions = functions.https.onRequest((req, res) => {
    var state_abbrev = req.query.state

    // first, get rid of this node.  It may have had division_list_url underneath.  Deleting then re-adding will
    // cause the loadDivisionsTrigger to re-fire
    return db.ref('google_civic_data/states/'+state_abbrev).remove().then(() => {

        return db.ref('api_tokens/google_cloud_api_key').once('value').then(snapshot => {
            var stuff = {}
            stuff.apikey = snapshot.val()
            stuff.ref = snapshot.ref
            return stuff
        })
        .then(stuff => {
            var division_list_url = "https://www.googleapis.com/civicinfo/v2/representatives/ocd-division%2Fcountry%3Aus%2Fstate%3A"+state_abbrev+"?levels=administrativeArea1&recursive=true&roles=legislatorLowerBody&roles=legislatorUpperBody&fields=divisions&key="+stuff.apikey
            // this 'set' will cause trigger to fire: loadDivisionsTrigger
            return stuff.ref.root.child('google_civic_data/states/'+state_abbrev).set({'division_list_url': division_list_url})
            .then(() => {
                return listStates().then(states => {
                    stuff.res = res
                    stuff.states = states
                    return showPage(stuff)
                })
            })
        })

    })

})



// PROBLEM loading Ohio and Pennsylvania divisions:
// Google said too many OCD ID's retrieved using this url...
//https://www.googleapis.com/civicinfo/v2/representatives/ocd-division%2Fcountry%3Aus%2Fstate%3Apa?levels=administrativeArea1&recursive=true&roles=legislatorLowerBody&roles=legislatorUpperBody&fields=divisions&key=[apikey]
// PA House: 203,  Senate: 50
// OH House: 99,  Senate: 33

exports.loadDivisionsTrigger = functions.database.ref("google_civic_data/states/{state_abbrev}/division_list_url").onWrite(
    (change, context) => {

    // We only use the division_list_url for those states with 'special_load':true  (see legislators.js)
    // For all the other states, we know how many districts they have.  We don't have to do a google civic query
    // for those states

    // if url was deleted, just return
    if(!change.after.exists() && change.before.exists()) {
        console.log('we should be returning early here -------------------------------')
        return false
    }

    var url = change.after.val()
    console.log('url = ', url)
    var state_abbrev = context.params.state_abbrev

    return db.ref().child('states/list/'+state_abbrev).once('value').then(snapshot => {
        var stateNode = snapshot.val()
        if(stateNode.special_load) {
            // special load means we have to go to google and do a civic api query to get all the divisions for this
            // state because this state has districts that aren't simple numeric values

            return request(url, function (error, response, body) {
                console.log('body = ', body)
                var divisionList = Object.keys(JSON.parse(body).divisions)
                console.log('divisionList = ', divisionList)

                for(var d=0; d < divisionList.length; d++) {
                    var ms = date.asMillis()
                    var idx = divisionList[d].lastIndexOf("/")
                    //console.log('idx = ', idx)
                    if(idx != -1) {
                        var chambDist = divisionList[d].substring(idx+1)

                        //console.log('chambDist.indexOf(":") = ', chambDist.indexOf(':'))
                        if(chambDist.indexOf(':') != -1) {
                            var chamber = chambDist.substring(0, chambDist.indexOf(':'))
                            var district = chambDist.substring(chambDist.indexOf(':') + 1)
                            var divisionNode = {state_abbrev: state_abbrev, chamber: chamber, district: district, division: divisionList[d], load_date: date.asCentralTime(), load_date_ms: date.asMillis()}

                            var key = state_abbrev+'-'+chamber+'-'+district
                            var updates = {}
                            updates['google_civic_data/divisions/'+key] = divisionNode
                            db.ref().update(updates)
                        }

                    }

                }
            })

        }
        else {
            // States that aren't "special load" are easy.  We just construct an array of integers representing each district
            // Then we construct the Google Civic API division string and write that to google_civic_data/divisions
            // We have a trigger listening for writes to that node.  When we detect one, we do a google civic api call
            // to get the legislator(s) for that district/division
            return listStates().then(states => {
                var state = _.find(states, {'state_abbrev': state_abbrev})
                if(!state) {
                    console.log('!state = ', !state)
                    return false
                }

                var updates = {}
                var chamberList = ['sldl', 'sldu']
                if(state_abbrev == 'ne') chamberList = ['sldu']
                _.each(chamberList, function(civic_designator) {
                    // for each chamber, find the count, create a range, iterate over the range
                    var chamberCount = civic_designator=='sldl' ? state.hd_actual : state.sd_actual
                    var districtNumbers = _.range(1, chamberCount+1)
                    _.each(districtNumbers, function(district) {
                        var key = state.state_abbrev+'-'+civic_designator+'-'+district
                        var division = 'ocd-division/country:us/state:'+state.state_abbrev+'/'+civic_designator+':'+district // "ocd-division/country:us/state:tn/sldl:30"
                        var divisionNode = {state_abbrev: state.state_abbrev, chamber: civic_designator, district: district, division, load_date: date.asCentralTime(), load_date_ms: date.asMillis()}
                        updates['google_civic_data/divisions/'+key] = divisionNode
                    })
                })
                console.log('updates = ', updates)
                return snapshot.ref.root.child('/').update(updates)
            })

        }
    })


})
