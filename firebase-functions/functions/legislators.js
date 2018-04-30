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


// loop through each state
var states = function() {
    return [
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
        {state_abbreviation:'WY', state_name:'Wyoming'} ]
}

exports.showStates = functions.https.onRequest((req, res) => {
        return listStates(res, '')
})

// inserts a state node under /states,  i.e.  /states/TX, /states/AR, ...
// only meant to be called one time
exports.loadStates = functions.https.onRequest((req, res) => {

    // good example of multi-path updates
    var updates = {}
    var sts = states()
    for(var i=0; i < sts.length; i++) {
        var abbrev = sts[i].state_abbreviation
        updates[`states/list/${abbrev}/state_name`] = sts[i].state_name
        updates[`states/list/${abbrev}/state_abbrev_lower_case`] = sts[i].state_abbreviation.toLowerCase()
        updates[`states/list/${abbrev}/sd_loaded`] = 0
        updates[`states/list/${abbrev}/hd_loaded`] = 0
    }

    // good example of multi-path updates
    return db.ref(`/`).update(updates).then(() => {
        return listStates(res, '')
    })

})


var listStates = function(res, state_abbrev) {
    return db.ref(`states/list`).once('value').then(snapshot => {
        var statelist = []
        snapshot.forEach(function(stateNode) {
            var state = {state_name: stateNode.val().state_name,
                        state_abbrev_lower_case: stateNode.val().state_abbrev_lower_case,
                        sd_loaded: stateNode.val().sd_loaded,
                        hd_loaded: stateNode.val().hd_loaded}
            statelist.push(state)
        })
        return statelist
    })
    .then(statelist => {
        var html = ''
        html += '<table cellspacing="0" cellpadding="2" border="1">'
        html += '<tr><td colspan="3"><a href="/loadStates">Load States</a></td></tr>'
        html += '<tr><td colspan="3"><a href="/getOpenStatesUrls">Load OpenStates</a></td></tr>'
        html += '<tr><th rowspan="2">Legislators</th><th colspan="2">Loaded</th></tr>'
        html += '<tr><th>SD</th><th>HD</th></tr>'
        for(var i=0; i < statelist.length; i++) {
            html += '<tr>'
            html += '<td><a href="/viewLegislators?state='+statelist[i].state_abbrev_lower_case+'">'+statelist[i].state_name+'</a></td>'
            // If either sd_loaded or hd_loaded is 0, create a hyperlink for these attributes so that we can click them to reload
            // the data from OpenStates
            var sd_loaded = statelist[i].sd_loaded
            var hd_loaded = statelist[i].hd_loaded
            if(statelist[i].sd_loaded == 0 || (statelist[i].hd_loaded == 0 && statelist[i].state_abbrev_lower_case != 'ne')) {
                sd_loaded = '<a href="/reloadOpenStates?state='+statelist[i].state_abbrev_lower_case+'">'+statelist[i].sd_loaded+'</a>'
                hd_loaded = '<a href="/reloadOpenStates?state='+statelist[i].state_abbrev_lower_case+'">'+statelist[i].hd_loaded+'</a>'
            }
            html += '<td>'+sd_loaded+'</td>'
            html += '<td>'+hd_loaded+'</td>'
            html += '</tr>'
        }
        html += '</table>'

        //return res.status(200).send(html)
        return {stateListHtml: html}
    })
    .then(elements => {
        if(state_abbrev != '') {

            return db.ref(`states/legislators/${state_abbrev.toUpperCase()}`).orderByChild('chamber').equalTo('upper').once('value').then(snapshot => {
                var legislators = []
                snapshot.forEach(function(child) {
                    var leg = child.val()
                    leg.id = child.key
                    legislators.push(leg)
                })
                // this is how you sort numeric districts that are stored as strings without crashing on those districts that ARE strings
                legislators = _.sortBy(legislators, o => {if(isNaN(o.district)) {return o.district} else {return Number(o.district)}} )
                return legislators
            })
            .then(senators => {
                if(state_abbrev != 'ne') {
                    return db.ref(`states/legislators/${state_abbrev.toUpperCase()}`).orderByChild('chamber').equalTo('lower').once('value').then(snapshot => {
                        var reps = []
                        snapshot.forEach(function(child) {
                            var rep = child.val()
                            rep.id = child.key
                            reps.push(rep)
                        })
                        // this is how you sort numeric districts that are stored as strings without crashing on those districts that ARE strings
                        reps = _.sortBy(reps, o => {if(isNaN(o.district)) {return o.district} else {return Number(o.district)}} )
                        return {senators: senators, reps: reps}
                    })
                    .then(legislators => {
                        var senatorTable = legislatorTable(legislators.senators)
                        var repTable = legislatorTable(legislators.reps)
                        elements.legislatorSection = '<table><tr><td valign="top">'+senatorTable+'</td><td valign="top">'+repTable+'</td></tr></table>'
                        return elements
                    })
                }
                else {
                    elements.legislatorSection = legislatorTable(senators)
                    return elements
                }

            })

        }
        else return elements
    })
    .then(elements => {
        var stateListHtml = elements.stateListHtml
        var html = ''
        html += '<table border="0">'
        html += '<tr><td valign="top">'
        html += stateListHtml
        html += '</td>'
        html += '<td valign="top">'
        if(elements.legislatorSection) {
            html += elements.legislatorSection
        }
        html += '</td>'
        html += '</tr>'
        return res.status(200).send(html)
    })
}


exports.reloadOpenStates = functions.https.onRequest((req, res) => {
    var state_abbrev = req.query.state

    var updates = {}
    updates[`states/legislators/${state_abbrev.toUpperCase()}`] = null
    return db.ref(`/`).update(updates).then(() => {
        return db.ref(`states/openstates`).orderByChild('state_abbrev').equalTo(state_abbrev).once('value').then(snapshot => {
            var up2 = {}
            var urls = []
            var ids = []
            snapshot.forEach(function(child) { // really should only be one child for the state
                var osUrl = child.val().url
                up2[`states/openstates/${child.key}/url`] = null
                ids.push(child.key)
                snapshot.ref.root.update(up2)
                urls.push(osUrl) // really should only be one child for the state
            })
            return {urls: urls, ids: ids}
        })
        .then(data => {
            var url = data.urls[0] // just take the first one
            var id = data.ids[0]
            var up3 = {}
            up3[`states/openstates/${id}/url`] = url
            return snapshot.ref.root.update(up3)
        })
    })
    .then(() => {
        return listStates(res, state_abbrev)
    })
})


exports.viewLegislators = functions.https.onRequest((req, res) => {
    var state_abbrev = req.query.state
    return listStates(res, state_abbrev)
})


var legislatorTable = function(legislators) {

    var html = ''
    html += '<table cellspacing="0" cellpadding="2" border="1">'
    var legType = 'Representatives'
    if(legislators.length == 0) {
        return 'No legislators'
    }
    else if(!legislators[0].chamber) {
        legType = '!UNKNOWN CHAMBER TYPE!'
    }
    else if(legislators[0].chamber == 'upper') {
        legType = 'Senators'
    }

    var state = _.find(states(), {state_abbreviation: legislators[0].state.toUpperCase()});

    html += '<tr><th colspan="1">'+state.state_name+' '+legType+'</th></tr>'
    for(var i=0; i < legislators.length; i++) {
        var channelInfo = 'no social media handles loaded'
        if(legislators[i].channels) {
            channelInfo = 'Social Media: '
            for(var j=0; j < legislators[i].channels.length; j++) {
                var ch = legislators[i].channels[j].type
                channelInfo += legislators[i].channels[j].type + ': ' + legislators[i].channels[j].id
            }
        }
        var party = ''
        if(legislators[i].party)
            party = legislators[i].party.substring(0,1)
        var email = ''
        if(legislators[i].email)
            email = legislators[i].email
        var division = ''
        if(legislators[i].division) {
            division = legislators[i].division
        }

        html += '<tr><td valign="top">'
        html += '<table border="0">'
        html += '<tr>'
        html +=     '<td valign="top">'
        html +=         'District: '+legislators[i].district
        html +=         '<br/>'+legislators[i].full_name+' ('+party+') '+' (id: '+legislators[i].id+')'
        if(legislators[i].email) {
            html +=     '<br/><a href="mailto:'+legislators[i].email+'">'+legislators[i].email+'</a>'
        }
        html +=         '<br/>'+channelInfo
        html +=         '<br/>'
        html +=         '<form method="post">'
        html +=             '<input type="hidden" name="state_abbrev" value="'+legislators[i].state+'"/>'
        html +=             '<input type="hidden" name="idx" value="'+legislators[i].id+'"/>'
        html +=             '<input type="text" name="division" size="45" value="'+division+'" placeholder="division"/>'
        html +=             '<input type="submit" value="save" formaction="/saveDivision">'
        html +=         '</form>'

        html +=     '</td>'

        // offices...
        html +=     '<td valign="top">'
        if(legislators[i].offices) {
            for(var o=0; o < legislators[i].offices.length; o++) {
                // only show offices that have a phone or email...
                if(legislators[i].offices[o].phone || legislators[i].offices[o].email) {
                    html += legislators[i].offices[o].name+'<br/>'
                    if(legislators[i].offices[o].email) {
                        html += '<a href="mailto:'+legislators[i].offices[o].email+'">'+legislators[i].offices[o].email+'</a><br/>'
                    }
                    if(legislators[i].offices[o].phone) {
                        html += legislators[i].offices[o].phone+'<br/>'
                    }
                }
            }
        }
        html +=     '</td>'
        html += '</tr>'
        html += '</table>'
        html += '</td></tr>'

    }
    html += '</table>'
    return html
}


exports.saveDivision = functions.https.onRequest((req, res) => {
    var state_abbrev = req.body.state_abbrev.toUpperCase()
    var idx = req.body.idx // integer key node under state_abbrev node
    var updates = {}
    updates[`states/legislators/${state_abbrev}/${idx}/division`] = req.body.division
    db.ref(`/`).update(updates).then(() => {
        return listStates(res, state_abbrev)
    })
})


// Load the actual urls from open states


// Load districts - open states


// Load districts - google











// Loops through each state abbrev and constructs a url that we can then use to
// return all the legislative districts for that state
// Note: The civics API doesn't name districts the same as OpenStates.  Only the numeric
// districts are the same.  But NH and MA maybe others have districts that are actual names
// and it's not just a matter of lower-casing the OpenStates names
exports.googleCivicApi1 = functions.https.onRequest((req, res) => {
    return googleCivicApiHelper(res)
})


// takes the state selected in showStatesForCivicApi() and runs the API call that returns all the
// legislative divisions for the state
exports.googleCivicApi2 = functions.https.onRequest((req, res) => {

    var state_abbrev = req.query.state

    var xxx = function(division) {
        var idx = division.lastIndexOf("/")
        if(idx == -1)
            return {google_civic_api_chamber:'', google_civic_api_district:'', openstates_chamber:''}
        var p = division.substring(idx+1)
        var idx2 = p.indexOf(":")
        if(idx2 == -1)
            return {google_civic_api_chamber:'', google_civic_api_district:'', openstates_chamber:''}

        var google_civic_api_chamber = p.substring(0, idx2)
        var openstates_chamber = google_civic_api_chamber=='sldl' ? 'lower' : 'upper'
        return {google_civic_api_chamber:google_civic_api_chamber, google_civic_api_district:p.substring(idx2+1), openstates_chamber:openstates_chamber}
    }

    return db.ref(`api_tokens/google_cloud_api_key`).once('value').then(snapshot => {
        var apikey = snapshot.val()
        return {apikey: apikey, ref: snapshot.ref}
    })
    .then(stuff => {
        var apikey = stuff.apikey
        var ref = stuff.ref
        var googleCivicApiUrl = "https://www.googleapis.com/civicinfo/v2/representatives/ocd-division%2Fcountry%3Aus%2Fstate%3A"+state_abbrev+"?levels=administrativeArea1&recursive=true&roles=legislatorLowerBody&roles=legislatorUpperBody&fields=divisions&key="+apikey
        // issue the api call Ex for Mass. :  https://www.googleapis.com/civicinfo/v2/representatives/ocd-division%2Fcountry%3Aus%2Fstate%3Ama?levels=administrativeArea1&recursive=true&roles=legislatorLowerBody&roles=legislatorUpperBody&fields=divisions&key={YOUR_API_KEY}
        // parse the results
        //     divisions[division name] i.e. divisions["ocd-division/country:us/state:ma/sldl:10th_bristol"]

        var millis = date.asMillis()
        var path = `states/districts/`+millis
        var numberOfHouseDistricts = 0
        var numberOfSenateDistricts = 0
        request(googleCivicApiUrl, function (error, response, body) {
            if(error)  {
                var val = {}
                val[path+`/result`] = 'error for state: '+state_abbrev.toUpperCase()
                ref.root.update(val)
            }
            else {
                var val = {}
                var divisionsNode = JSON.parse(body).divisions
                var divisions = Object.keys(divisionsNode)
                for(var i=0; i < divisions.length; i++) {
                    ++millis
                    if(xxx(divisions[i]).google_civic_api_chamber == 'sldl')
                        ++numberOfHouseDistricts
                    else
                        ++numberOfSenateDistricts
                    path = `states/districts/`+millis
                    val[path+`/division`] = divisions[i]
                    val[path+`/google_civic_api_district`] = xxx(divisions[i]).google_civic_api_district
                    val[path+`/google_civic_api_chamber`] = xxx(divisions[i]).google_civic_api_chamber // sldl, sldu
                    val[path+`/openstates_chamber`] = xxx(divisions[i]).openstates_chamber // lower, upper
                    val[path+`/google_civic_api_state_abbrev`] = state_abbrev
                    val[path+`/state_abbrev`] = state_abbrev.toUpperCase()
                    val[path+`/result`] = 'ok'
                    val[path+'/loaded_date'] = date.asCentralTime()
                    val[path+'/loaded_date_ms'] = date.asMillis()
                }
                val[`states/list/${state_abbrev.toUpperCase()}/number_of_house_districts`] = numberOfHouseDistricts
                val[`states/list/${state_abbrev.toUpperCase()}/number_of_senate_districts`] = numberOfSenateDistricts
                ref.root.update(val)
            }

        })
    })
    .then(() => {
        return googleCivicApiHelper(res)
    })
})


// deletes nodes from /states/districts
exports.googleCivicApi3 = functions.https.onRequest((req, res) => {
    var state_abbrev = req.query.state
    return db.ref(`states/districts`).orderByChild('state_abbrev').equalTo(state_abbrev).once('value').then(snapshot => {
        var updates = {}
        snapshot.forEach(function(child) {
            updates[`states/districts/${child.key}`] = null
        })
        snapshot.ref.root.update(updates)
    })
    .then(() => {
        // now run the same query again to make sure this state's districts are really gone
        db.ref(`states/districts`).orderByChild('state_abbrev').equalTo(state_abbrev).once('value').then(snapshot => {
            var count = snapshot.numChildren()
            var updates = {}
            // these both should be 0.  If they're not, it doesn't really matter that they are actually
            // the sum of the number of house and senate districts
            updates[`states/list/${state_abbrev.toUpperCase()}/number_of_house_districts`] = count
            updates[`states/list/${state_abbrev.toUpperCase()}/number_of_senate_districts`] = count
            snapshot.ref.root.update(updates)
        })

    })
    .then(() => {
        return googleCivicApiHelper(res)
    })
})


// Prereq:  run loadStates() first
var googleCivicApiHelper = function(res) {

    // google rate throttles, so I created this web page so I can just click one state at a time
    // to get the list of legislative districts
    return db.ref(`states/list`).once('value').then(snapshot => {
        var states = []
        snapshot.forEach(function(stateNode) {
            var state_abbrev = stateNode.key // upper case
            var number_of_house_districts = 0
            var number_of_senate_districts = 0
            if(stateNode.val().number_of_house_districts)
                number_of_house_districts = stateNode.val().number_of_house_districts
            if(stateNode.val().number_of_senate_districts)
                number_of_senate_districts = stateNode.val().number_of_senate_districts
            states.push({state_abbrev: state_abbrev,
                        number_of_house_districts: number_of_house_districts,
                        number_of_senate_districts: number_of_senate_districts})
        })
        return states
    })
    .then(states => {
        var html = '<table cellspacing="0" cellpadding="2" border="1">'
        html += '<tr><th>State</th><th>HD</th><th>SD</th><th>delete</th></tr>'
        for(var i=0; i < states.length; i++) {
            html += '<tr>'
            html += '<td><a href="/googleCivicApi2?state='+states[i].state_abbrev.toLowerCase()+'">Load '+states[i].state_abbrev+'</a></td>'
            html += '<td>'+states[i].number_of_house_districts+'</td>'
            html += '<td>'+states[i].number_of_senate_districts+'</td>'
            html += '<td><a href="/googleCivicApi3?state='+states[i].state_abbrev.toLowerCase()+'">delete districts</a></td>'
            html += '</tr>'
        }
        html += '</table>'
        return res.status(200).send(html)
    })
}


// This function writes 50 url's to the database - 1 for each state
// TRIGGER !  As a result of writing these url's, a trigger just below this function is called
exports.getOpenStatesUrls = functions.https.onRequest((req, res) => {

    return db.ref(`api_tokens/openstates`).once('value').then(snapshot => {
        var apikey = snapshot.val()
        return apikey
    })
    .then(apikey => {

        // loop through each state
        return db.ref(`states/list`).once('value').then(snapshot => {
            var numberOfStates = snapshot.numChildren()
            var openStatesParameters = []
            snapshot.forEach(function(child) {
                var state_abbrev = child.key
                openStatesParameters.push({state_abbrev: state_abbrev})
            })
            return openStatesParameters
        })
        .then(openStatesParameters => {

            var updates = {}
            var html = ''
            for(var i=0; i < openStatesParameters.length; i++) {
                var state_abbrev = openStatesParameters[i].state_abbrev
                // construct the url that we send to OpenStates to get all the legislators in this state
                var url = "https://openstates.org/api/v1/legislators/?state="+state_abbrev+"&apikey="+apikey

                html += '<P/>'+url

                updates[`states/openstates/${i}`] = {url: url, state_abbrev: state_abbrev, state_abbrev_lower_case: state_abbrev.toLowerCase()}

            }

            // example of multi-path updates
            return db.ref(`/`).update(updates).then(() => {
                return listStates(res, '')
            })

        })

    })

})


// This trigger is called when url's are written to the various state nodes in the
// function above: getOpenStatesUrls()
// This is the function that actually makes the call to the OpenStates API to pull down all
// the legislators in a legislative chamber
exports.downloadFromOpenStates = functions.database.ref("states/openstates/{index}").onWrite(
    event => {

    // if mission was deleted, just return
    if(!event.data.exists() && event.data.previous.exists()) {
        return false
    }

    var abbrev = event.data.val().state_abbrev
    var url = event.data.val().url

    return request(url, function (error, response, body) {
        var legislatorList = JSON.parse(body)
        // loop through each legislator and GUESS what the google civic api "division" identifier is for the legislator
        // This guess will definitely be wrong for MA and maybe also NH.  We just have to fix those by hand or create
        // a translation table
        var sd_count = 0
        var hd_count = 0
        for(var i=0; i < legislatorList.length; i++) {
            if(legislatorList[i].chamber && (legislatorList[i].chamber.toLowerCase() == 'upper' || legislatorList[i].chamber.toLowerCase() == 'lower')) {
                var state_abbrev = legislatorList[i].state.toLowerCase() // it's probably already lower case
                var chamberDesignator = legislatorList[i].chamber.toLowerCase() == 'lower' ? "sldl" : "sldu"
                var district = legislatorList[i].district.toLowerCase() // specifically for MN
                district = district.replace(/ /g, '_') // specifically for NH districts
                var division = "ocd-division/country:us/state:"+state_abbrev+"/"+chamberDesignator+":"+district
                legislatorList[i].division = division
                if(legislatorList[i].chamber.toLowerCase() == 'lower')
                    ++hd_count
                else ++sd_count
            }
        }
        var legislatorUpdates = {}
        legislatorUpdates[`states/legislators/${abbrev}`] = legislatorList
        legislatorUpdates[`states/list/${abbrev}/sd_loaded`] = sd_count
        legislatorUpdates[`states/list/${abbrev}/hd_loaded`] = hd_count
        // example of multi-path updates
        return event.data.adminRef.root.update(legislatorUpdates)
    })
})


// google throttling means we can only do one request per second
// So this takes TWO HOURS+ to run!
exports.getSocialMediaUrls = functions.https.onRequest((req, res) => {

    // First have to get all the state abbreviations...
    return db.ref(`api_tokens/google_cloud_api_key`).once('value').then(snapshot => {
        return snapshot.val()
    })
    .then(apikey => {
        return db.ref(`states/legislators`).once('value').then(snapshot => {

            var stuff = []
            snapshot.forEach(function(stateChamberDistrictNode) {
                var stateChamberDistrict = stateChamberDistrictNode.key
                var legislatorArray = stateChamberDistrictNode
                legislatorArray.forEach(function(legislator) {
                    var ocdIdState = legislator.val().state
                    var state_abbrev = legislator.val().state.toUpperCase()
                    var ocdIdChamber = legislator.val().chamber == 'lower' ? 'sldl' : 'sldu'
                    var chamber = legislator.val().chamber == 'lower' ? 'HD' : 'SD'
                    var district = legislator.val().district
                    var url = "https://www.googleapis.com/civicinfo/v2/representatives/ocd-division%2Fcountry%3Aus%2Fstate%3A"+ocdIdState+"%2F"+ocdIdChamber+"%3A"+district.toLowerCase()+"?fields=officials&key="+apikey
                    stuff.push({url: url,
                                state_abbrev: state_abbrev,
                                chamber: chamber,
                                district: district,
                                loaded_date: 'not loaded',
                                state_chamber: state_abbrev+chamber,                    // compound key
                                state_chamber_district: state_abbrev+chamber+district})  // compound key
                })
            })
            return stuff
        })
        .then(stuff => {
            var html = '<table cellspacing="0" cellpadding="2" border="1">'
            var updates = {}
            for(var i=0; i < stuff.length; i++) {
                var url = stuff[i].url
                var state_abbrev = stuff[i].state_abbrev
                var chamber = stuff[i].chamber
                var district = stuff[i].district
                var lastpart = state_abbrev+chamber+district
                var key = `/states/google_civic_api_urls/${lastpart}`
                //var key2 = `/states/google_civic_api_urls/${state_abbrev}/legislative_chambers/${chamber}/${district}/loaded_date`
                //var key3 = `/states/google_civic_api_urls/${state_abbrev}/legislative_chambers/${chamber}/${district}/loaded_date_ms`
                updates[key] = stuff[i]
                //updates[key2] = '-' // initial value to denote these social media handles haven't been loaded yet
                //updates[key3] = '-' // initial value to denote these social media handles haven't been loaded yet
                html += `<tr><td><b>${state_abbrev} ${chamber} ${district}</b><p/>Node: ${key}<br/>URL: ${stuff[i].url}</td></tr>`
            }
            html += '</table>'
            db.ref(`/`).update(updates).then(() => {
                return res.status(200).send(html)
            })
        })
    })

})


// PREREQUISITE: Have to run getSocialMediaUrls() first so that the expected nodes are present
//
// Run this one chamber at a time, i.e.  TX HD, TX SD, etc
// We do this because otherwise, the whole process of loading social media handles would take
// over 2 hours to run.  And if there was an error during processing, we would have to do it all
// over again.  I'm not even sure firebase functions would support an http request that takes 2 hours
// to return
//
// PARAMETER:  the state abbrev and the chamber (either HD or SD)
exports.loadSocialMediaHandles = functions.https.onRequest((req, res) => {

    var results = []
    var key = req.query.stateChamberDistrict
    var node = `/states/google_civic_api_urls/${key}`

    return db.ref(node).once('value').then(snapshot => {
        var googleCivicApiUrl = snapshot.val().url
        db.ref('templog').push().set({snapshot_val: snapshot.val(), googleCivicApiUrl: googleCivicApiUrl})
        var ref = snapshot.ref
        var val = {}

        request(googleCivicApiUrl, function (error, response, body) {
            var updates = {}
            if(error)  {
                val[`result`] = 'error'
            }
            else {
                val[`officials`] = JSON.parse(body).officials
                val[`result`] = 'ok'
                val['loaded_date'] = date.asCentralTime()
                val['loaded_date_ms'] = date.asMillis()
            }

            ref.update(val)
        })

    })
    .then(() => {
        return showList(res)
    })

})
