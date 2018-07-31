'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

// for calling OpenStates API
var request = require('request')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


/***
to deploy everything in this file...
firebase deploy --only functions:showStates,functions:loadStates,functions:loadLegislators,functions:viewLegislators,functions:saveDivision,functions:loadOpenStatesLegislators,functions:loadOpenStatesDistricts,functions:findCivicDataMatch,functions:lookupFacebookId,functions:facebookIdUpdated,functions:loadCivicData,functions:peopleWithoutCivicData,functions:youtubeVideoDescription,functions:updateLegislatorSocialMedia,functions:updateVideoNodeSocialMedia,functions:overwriteBadWithGoodData,functions:testUpdateSocialMedia
***/

// loop through each state
var states = function() {
    return [
        // Abbreviations are upper case but that's just me.  OpenStates and Google both use
        // lower case abbreviations.  So when we load these states, the first thing we do is
        // convert these upper case abbrev's into lower case.  There really isn't anywhere that I need
        // upper case abbrev's.  So all these upper case abbrev's do is introduce potential bugs
        {state_abbreviation:'AL', hd:105, sd:35, state_name:'Alabama'},
        {state_abbreviation:'AK', hd:40, sd:20, state_name:'Alaska', special_load:true},
        {state_abbreviation:'AZ', hd:60, sd:30, state_name:'Arizona'},
        {state_abbreviation:'AR', hd:100, sd:35, state_name:'Arkansas'},
        {state_abbreviation:'CA', hd:80, sd:40, state_name:'California'},
        {state_abbreviation:'CO', hd:65, sd:35, state_name:'Colorado'},
        {state_abbreviation:'CT', hd:151, sd:36, state_name:'Connecticut'},
        {state_abbreviation:'DE', hd:41, sd:21, state_name:'Delaware'},
        {state_abbreviation:'FL', hd:120, sd:40, state_name:'Florida'},
        {state_abbreviation:'GA', hd:180, sd:56, state_name:'Georgia'},
        {state_abbreviation:'HI', hd:51, sd:25, state_name:'Hawaii'},
        {state_abbreviation:'ID', hd:70, sd:35, state_name:'Idaho'},
        {state_abbreviation:'IL', hd:118, sd:59, state_name:'Illinois'},
        {state_abbreviation:'IN', hd:100, sd:50, state_name:'Indiana'},
        {state_abbreviation:'IA', hd:100, sd:50, state_name:'Iowa'},
        {state_abbreviation:'KS', hd:125, sd:40, state_name:'Kansas'},
        {state_abbreviation:'KY', hd:100, sd:38, state_name:'Kentucky'},
        {state_abbreviation:'LA', hd:105, sd:39, state_name:'Louisiana'},
        {state_abbreviation:'ME', hd:151, sd:35, state_name:'Maine'},
        {state_abbreviation:'MD', hd:141, sd:47, state_name:'Maryland', special_load:true},
        {state_abbreviation:'MA', hd:160, sd:40, state_name:'Massachusetts', special_load:true},
        {state_abbreviation:'MI', hd:110, sd:38, state_name:'Michigan'},
        {state_abbreviation:'MN', hd:134, sd:67, state_name:'Minnesota', special_load:true},
        {state_abbreviation:'MS', hd:122, sd:52, state_name:'Mississippi'},
        {state_abbreviation:'MO', hd:163, sd:34, state_name:'Missouri'},
        {state_abbreviation:'MT', hd:100, sd:50, state_name:'Montana'},
        {state_abbreviation:'NE', hd:0, sd:49, state_name:'Nebraska'},
        {state_abbreviation:'NV', hd:42, sd:21, state_name:'Nevada'},
        {state_abbreviation:'NH', hd:400, sd:24, state_name:'New Hampshire', special_load:true},
        {state_abbreviation:'NJ', hd:80, sd:40, state_name:'New Jersey'},
        {state_abbreviation:'NM', hd:70, sd:42, state_name:'New Mexico'},
        {state_abbreviation:'NY', hd:150, sd:63, state_name:'New York'},
        {state_abbreviation:'NC', hd:120, sd:50, state_name:'North Carolina'},
        {state_abbreviation:'ND', hd:94, sd:47, state_name:'North Dakota'},
        {state_abbreviation:'OH', hd:99, sd:33, state_name:'Ohio'},
        {state_abbreviation:'OK', hd:101, sd:48, state_name:'Oklahoma'},
        {state_abbreviation:'OR', hd:60, sd:30, state_name:'Oregon'},
        {state_abbreviation:'PA', hd:203, sd:50, state_name:'Pennsylvania'},
        {state_abbreviation:'RI', hd:75, sd:38, state_name:'Rhode Island'},
        {state_abbreviation:'SC', hd:124, sd:46, state_name:'South Carolina'},
        {state_abbreviation:'SD', hd:70, sd:35, state_name:'South Dakota', special_load:true},
        {state_abbreviation:'TN', hd:99, sd:33, state_name:'Tennessee'},
        {state_abbreviation:'TX', hd:150, sd:31, state_name:'Texas'},
        {state_abbreviation:'UT', hd:75, sd:29, state_name:'Utah'},
        {state_abbreviation:'VT', hd:150, sd:30, state_name:'Vermont', special_load:true},
        {state_abbreviation:'VA', hd:100, sd:40, state_name:'Virginia'},
        {state_abbreviation:'WA', hd:98, sd:49, state_name:'Washington'},
        {state_abbreviation:'WV', hd:100, sd:34, state_name:'West Virginia'},
        {state_abbreviation:'WI', hd:99, sd:33, state_name:'Wisconsin'},
        {state_abbreviation:'WY', hd:60, sd:30, state_name:'Wyoming'} ]
}

exports.showStates = functions.https.onRequest((req, res) => {
        return listStates(res, {})
})

// inserts a state node under /states,  i.e.  /states/TX, /states/AR, ...
// only meant to be called one time
exports.loadStates = functions.https.onRequest((req, res) => {

    // good example of multi-path updates
    var updates = {}
    var sts = states()
    for(var i=0; i < sts.length; i++) {
        var abbrev = sts[i].state_abbreviation.toLowerCase() // My abbreviations above are upper case but OpenStates and Google both use lower case abbreviations
        updates['states/list/'+abbrev+'/state_name'] = sts[i].state_name
        updates['states/list/'+abbrev+'/hd_actual'] = sts[i].hd
        updates['states/list/'+abbrev+'/sd_actual'] = sts[i].sd
        updates['states/list/'+abbrev+'/sd_loaded'] = 0
        updates['states/list/'+abbrev+'/hd_loaded'] = 0
        updates['states/list/'+abbrev+'/channels_loaded'] = 0
        updates['states/list/'+abbrev+'/civic_officials_loaded'] = 0
        var special_load = false
        if(sts[i].special_load) {
            special_load = sts[i].special_load
        }
        updates['states/list/'+abbrev+'/special_load'] = special_load
    }

    // good example of multi-path updates
    return db.ref('/').update(updates).then(() => {
        return listStates(res, {})
    })

})


var listStates = function(res, stuff) {
    return db.ref('states/list').once('value').then(snapshot => {
        var statelist = []
        snapshot.forEach(function(stateNode) {
            var state = {state_name: stateNode.val().state_name,
                        state_abbrev: stateNode.key,
                        hd_actual: stateNode.val().hd_actual,
                        sd_actual: stateNode.val().sd_actual,
                        sd_loaded: stateNode.val().sd_loaded,
                        hd_loaded: stateNode.val().hd_loaded,
                        special_load: (stateNode.val().special_load ? stateNode.val().special_load : false),
                        channels_loaded: stateNode.val().channels_loaded}
            statelist.push(state)
        })
        stuff.statelist = statelist
        return stuff
    })
    .then(stuff => {
        var statelist = stuff.statelist
        var html = ''
        html += '<table cellspacing="0" cellpadding="2" border="1">'
        html += '<tr><td colspan="9"><a href="/loadStates">Load States</a></td></tr>'
        html += '<tr>'
        html +=     '<td colspan="9">Legislators that '
        html +=         '[<a href="/peopleWithoutCivicData?attribute=civic_data_loaded_date_ms&value=notempty" title="People that did get their Civic data loaded">do</a>]'
        html +=         '[<a href="/peopleWithoutCivicData?attribute=civic_data_loaded_date_ms&value=empty" title="People that never got their Civic data loaded">do not</a>]'
        html +=     'have Civic data loaded</td>'
        html += '</tr>'
        html += '<tr>'
        html +=     '<th rowspan="2">Load</th>'
        html +=     '<th rowspan="2">Legislators</th>'
        html +=     '<th colspan="2">Actual</th>'
        html +=     '<th colspan="2">Diff</th>'
        html +=     '<th colspan="3">Loaded</th>'
        html += '</tr>'
        html += '<tr>'
        html +=     '<th>SD</th>'
        html +=     '<th>HD</th>'
        html +=     '<th>SD</th>'
        html +=     '<th>HD</th>'
        html +=     '<th>SD</th>'
        html +=     '<th>HD</th>'
        html +=     '<th>Soc Media</th>'
        html += '</tr>'
        for(var i=0; i < statelist.length; i++) {
            html += '<tr>'
            html +=     '<td>'
            html +=         '[<a href="/loadOpenStatesDistricts?state='+statelist[i].state_abbrev+'" title="Load OpenStates Districts">Load OS D</a>]'
            html +=         '[<a href="/loadOpenStatesLegislators?state='+statelist[i].state_abbrev+'" title="Load OpenStates Legislators">Load OS L</a>]'
            html +=         '[<a href="/query?node=/states/list/'+statelist[i].state_abbrev+'" title="Query /states/list/'+statelist[i].state_abbrev+'" target="new">Q1</a>]'
            html +=         '[<a href="/query?node=/states/openstates&attribute=state_abbrev&value='+statelist[i].state_abbrev+'" title="Query /states/openstates : state_abbrev='+statelist[i].state_abbrev+'" target="new">Q2</a>]'
            html +=         '[<a href="/query?node=/states/districts&attribute=state_abbrev&value='+statelist[i].state_abbrev+'" title="Query /states/districts : state_abbrev='+statelist[i].state_abbrev+'" target="new">Q3</a>]'
            html +=         '[<a href="/query?node=/states/legislators&attribute=state_abbrev&value='+statelist[i].state_abbrev+'" title="Query /states/legislators : state_abbrev='+statelist[i].state_abbrev+'" target="new">Q4</a>]'
            html +=         '&nbsp;&nbsp;[<a href="/loadLegislators?state='+statelist[i].state_abbrev+'" title="Load/Reload legislators for '+statelist[i].state_name+'">load</a>]'
            html +=     '</td>'
            html +=     '<td><a href="/viewLegislators?state='+statelist[i].state_abbrev+'" title="view all legislators in '+statelist[i].state_name+'">'+statelist[i].state_name+'</a></td>'

            html += '<td>'+statelist[i].sd_actual+'</td>'
            html += '<td>'+statelist[i].hd_actual+'</td>'

            var sddiff = statelist[i].sd_actual - statelist[i].sd_loaded
            if(sddiff == 0) {
                html += '<td style="background-color:#008000;color:#ffffff">'+sddiff+'</td>'
            }
            else {
                var title = 'OpenStates returned '+sddiff+' less than expected'
                if(sddiff < 0) title = 'OpenStates returned '+(-1 * sddiff)+' more than expected'
                html += '<td style="background-color:#ffff00" title="'+title+'">'+sddiff+'</td>'
            }

            var hddiff = statelist[i].hd_actual - statelist[i].hd_loaded
            if(hddiff == 0) {
                html += '<td style="background-color:#008000;color:#ffffff">'+hddiff+'</td>'
            }
            else {
                var title = 'OpenStates returned '+hddiff+' less than expected'
                if(hddiff < 0) title = 'OpenStates returned '+(-1 * hddiff)+' more than expected'
                html += '<td style="background-color:#ffff00" title="'+title+'">'+hddiff+'</td>'
            }

            // If either sd_loaded or hd_loaded is 0, create a hyperlink for these attributes so that we can click them '<a href="/loadLegislators?state='+statelist[i].state_abbrev+'">'+statelist[i].sd_loaded+'</a>'to reload
            // the data from OpenStates
            var sd_loaded = statelist[i].sd_loaded
            var hd_loaded = statelist[i].hd_loaded
            if(statelist[i].sd_loaded == 0 || (statelist[i].hd_loaded == 0 && statelist[i].state_abbrev != 'ne')) {
                sd_loaded = '<a href="/loadLegislators?state='+statelist[i].state_abbrev+'">'+statelist[i].sd_loaded+'</a>'
                hd_loaded = '<a href="/loadLegislators?state='+statelist[i].state_abbrev+'">'+statelist[i].hd_loaded+'</a>'
            }
            html += '<td>'+sd_loaded+'</td>'
            html += '<td>'+hd_loaded+'</td>'
            var totalLegislators = statelist[i].sd_loaded + statelist[i].hd_loaded
            html +=     '<td>'+statelist[i].channels_loaded+' out of '+totalLegislators+'</td>'
            html += '</tr>'
        }
        html += '</table>'

        stuff.stateListHtml = html
        return stuff
    })
    .then(stuff => {
        if(stuff.legislators) {
            var html = ''
            html += '<table cellspacing="0" cellpadding="2" border="1">'
            html +=     '<tr>'
            html +=         '<th colspan="4">These '+(stuff.legislators.length)+' Legislators match the criteria:<br/>'+stuff.queryparms.attribute+' = '+stuff.queryparms.queryValue+'</th>'
            html +=     '</tr>'
            html +=     '<tr>'
            html +=         '<th>key/id</th>'
            html +=         '<th>Name</th>'
            html +=         '<th>Civic Division</th>'
            html +=         '<th>Load</th>'
            html +=     '</tr>'
            _.each(stuff.legislators, function(person) {
                html += '<tr>'
                html +=     '<td>'+person.key+'</td>'
                html +=     '<td>'+person.full_name+'</td>'
                html +=     '<td><a href="/checkGoogleCivicDivision?division='+person.division+'">'+person.division+'</a></td>'
                html +=     '<td><a href="/loadCivicData?legislatorId='+person.key+'&state='+person.state+'">load</a></td>'
                html += '</tr>'
            })
            html += '</table>'
        }
        stuff.legislators_html = html
        return stuff
    })
    .then(stuff => {
        if(stuff.state_abbrev) {

            var state_chamber = stuff.state_abbrev+'-upper'
            return db.ref('states/legislators').orderByChild('state_chamber').equalTo(state_chamber).once('value').then(snapshot => {
                var legislators = []
                snapshot.forEach(function(child) {
                    var leg = child.val()
                    leg.id = child.key
                    legislators.push(leg)
                })
                db.ref('templog').push().set({state_chamber: legislators})
                // this is how you sort numeric districts that are stored as strings without crashing on those districts that ARE strings
                legislators = _.sortBy(legislators, o => {if(isNaN(o.district)) {return o.district} else {return Number(o.district)}} )
                return legislators
            })
            .then(senators => {
                if(stuff.state_abbrev != 'ne') {
                    state_chamber = stuff.state_abbrev+'-lower'
                    return db.ref('states/legislators').orderByChild('state_chamber').equalTo(state_chamber).once('value').then(snapshot => {
                        var reps = []
                        db.ref('templog').push().set({'rep_count': snapshot.numChildren()})
                        snapshot.forEach(function(child) {
                            var rep = child.val()
                            rep.id = child.key
                            reps.push(rep)
                            db.ref('templog').push().set({'rep': rep})
                        })
                        // this is how you sort numeric districts that are stored as strings without crashing on those districts that ARE strings
                        reps = _.sortBy(reps, o => {if(isNaN(o.district)) {return o.district} else {return Number(o.district)}} )
                        return {senators: senators, reps: reps}
                    })
                    .then(legislators => {
                        console.log('reps: ', legislators.reps)
                        var senatorTable = legislatorTable(legislators.senators)
                        var repTable = legislatorTable(legislators.reps)
                        stuff.legislatorSection = senatorTable+'<br/>'+repTable
                        return stuff
                    })
                }
                else {
                    stuff.legislatorSection = legislatorTable(senators)
                    return stuff
                }

            })

        }
        else return stuff
    })
    .then(stuff => {
        // construct the html for the civic data loading report if it exists
        if(stuff.civicData) {
            var html = ''
            html +=     '<table border="1" cellspacing="0" cellpadding="2">'
            html +=         '<tr>'
            html +=             '<th>date</th>'
            html +=             '<th>full</th>'
            html +=             '<th>first</th>'
            html +=             '<th>last</th>'
            html +=             '<th>leg id</th>'
            html +=             '<th>count</th>'
            html +=             '<th>district</th>'
            html +=             '<th>status</th>'
            html +=         '</tr>'
            for(var c=0; c < stuff.civicData.length; c++) {
                html +=     '<tr>'
                html +=         '<td>'+stuff.civicData[c].load_date+'</td>'
                html +=         '<td>'+stuff.civicData[c].full_name+'</td>'
                html +=         '<td>'+stuff.civicData[c].first_name+'</td>'
                html +=         '<td>'+stuff.civicData[c].last_name+'</td>'
                html +=         '<td>'+stuff.civicData[c].legislator_id+'</td>'
                html +=         '<td>'+stuff.civicData[c].item_count+'</td>'
                html +=         '<td>'+stuff.civicData[c].district+'</td>'
                html +=         '<td>'+stuff.civicData[c].status+'</td>'
                html +=     '</tr>'
            }
            html +=     '</table>'

            stuff.civicDataHtml = html
        }
        return stuff
    })
    .then(stuff => {
        var stateListHtml = stuff.stateListHtml
        var html = '<html>'
        html += '<head>'
        if(stuff["meta-refresh"]) {
            var refreshUrl = stuff['meta-refresh'].url
            var seconds = stuff['meta-refresh'].seconds
            html += '<meta http-equiv="refresh" content="'+seconds+';URL=\''+refreshUrl+'\'" />'
        }
        html += '</head>'
        html += '<body>'
        html += '<table border="0">'
        html += '<tr><td valign="top">'
        html += stateListHtml
        html += '</td>'

        // if there is civic data that we are loading, print the report of that load and DON'T show
        // the list of legislators.  We want to monitor the loading of civic data, and in order to do that,
        // the data has to be front on center on the page - remember the meta-refresh refreshes the page
        // every couple of seconds.  So if the data isn't front and center and you have to scroll to see it,
        // the page will refresh on you
        html += '<td valign="top">'
        if(stuff.civicDataHtml) {
            html += stuff.civicDataHtml
        }
        else if(stuff.legislatorSection) {
            html += stuff.legislatorSection
        }
        else if(stuff.legislators_html) {
            html += stuff.legislators_html
        }
        html += '</td>'
        html += '</tr>'
        html += '</table>'
        html += '</body>'
        html += '</html>'
        return res.status(200).send(html)
    })
}


// next 6 functions aren't used anywhere but are a model for how we can audit activity
var legislatorMatched = function(legislatorId, legislator) {
    return auditElement(legislatorId, legislator, ['does not matter'], 'ok - legislator matched')
}


var legislatorNotMatched = function(legislatorId, legislator, officials) {
    var namelist = _.map(officials, 'name')
    var names = _.join(namelist, ', ')
    var error = 'Could not find '+legislator.full_name+' in this list: '+names
    return auditElement(legislatorId, legislator, [], error)
}


var emailFound = function(legislatorId, legislator, email) {
    return auditElement(legislatorId, legislator, [email], 'ok - email found')
}


var socialMediaFound = function(legislatorId, legislator, channels) {
    return auditElement(legislatorId, legislator, channels, 'ok - channels found')
}


var socialMediaNotFound = function(legislatorId, legislator) {
    return auditElement(legislatorId, legislator, [], 'no - channels not found')
}


var auditElement = function(legislatorId, legislator, list, status) {
    return {load_date: date.asCentralTime(), legislator_id: legislatorId, item_count: list.length,
                district: legislator.district, full_name: legislator.full_name, first_name: legislator.first_name,
                last_name: legislator.last_name, status: status}
}


// PREREQ: Need legislators already pulled down from OpenStates here: /openstates/[state]/legislators
exports.loadLegislators = functions.https.onRequest((req, res) => {
    var state_abbrev = req.query.state


    // the first thing we're going to do is delete the states/districts and states/legislators for this
    // state so that we will re-trigger the loading of social media handles (See findCivicDataMatch() below)
    return db.ref('states/districts').orderByChild('abbr').equalTo(state_abbrev).once('value').then(snapshot => {
        var deletes = {}
        snapshot.forEach(function(child) {
            deletes['states/districts/'+child.key] = null
        })

        // now get rid of all the /states/legislators for this state...
        return snapshot.ref.root.child('states/legislators').orderByChild('state').equalTo(state_abbrev).once('value').then(snap2 => {
            snap2.forEach(function(child) {
                deletes['states/legislators/'+child.key] = null
            })
            snap2.ref.root.update(deletes).then(() => {
                // now that all the state's districts and legislators have been deleted, re-add them
                return db.ref('openstates/'+state_abbrev+'/districts').once('value').then(snapshot => {
                    var updates2 = {}
                    snapshot.forEach(function(child) {
                        var key = child.val().id  //i.e. nh-lower-Belknap 2
                        // need this attribute so that we can query on the client for all districts in a particular state and chamber
                        // i.e. get all the districts in the Texas House
                        var district = child.val()
                        district.state_chamber = child.val().abbr+'-'+child.val().chamber
                        updates2['states/districts/'+key] = district
                    })

                    return snapshot.ref.root.update(updates2).then(() => {

                        return db.ref('openstates/'+state_abbrev+'/legislators').once('value').then(snapshot => {
                            var updates = {}
                            var legislators = []
                            snapshot.forEach(function(child) {
                                var legislator = child.val()
                                var key = legislator.id  //i.e.  NHL000037
                                // some officials like Lt Gov and maybe Speaker are returned by OpenStates with no "chamber"
                                // value.  Ignore these guys
                                if(legislator.chamber) {
                                    // add these attributes...
                                    legislator.state_chamber = legislator.state+'-'+legislator.chamber
                                    legislator.state_chamber_district = legislator.state_chamber+'-'+legislator.district
                                    legislator.civic_data_loaded_date = '(not loaded)'
                                    legislator.civic_data_loaded_date_ms = -1
                                    updates['states/legislators/'+key] = legislator
                                    legislators.push(legislator)
                                }
                            })
                            var hd = _.sumBy(legislators, l => (l.chamber == 'lower' ? 1 : 0))
                            var sd = _.sumBy(legislators, l => (l.chamber == 'upper' ? 1 : 0))
                            updates['states/list/'+state_abbrev+'/hd_loaded'] = hd
                            updates['states/list/'+state_abbrev+'/sd_loaded'] = sd
                            snapshot.ref.root.update(updates).then(() => {
                                return listStates(res, {state_abbrev: state_abbrev})
                            })
                        })
                    })
                })
            })
        })
    })



})


exports.viewLegislators = functions.https.onRequest((req, res) => {
    var state_abbrev = req.query.state
    // update 'channels_loaded' count for the state...
    return db.ref('states/legislators').orderByChild('state').equalTo(state_abbrev).once('value').then(snapshot => {
        db.ref('templog2/'+state_abbrev+'/snapshot_val').set(snapshot.val())
        var legislators = []
        snapshot.forEach(function(child) {
            legislators.push(child.val())
        })
        var c = _.filter(legislators, function(l) {return l.channels})
        var channels_loaded = _.sumBy(c, l => (l.channels.length > 0 ? 1 : 0))
        return snapshot.ref.root.child('states/list/'+state_abbrev+'/channels_loaded').set(channels_loaded).then(() => {
            return listStates(res, {state_abbrev: state_abbrev})
        })
    })
})


var getChannelUrl = function(channel) {
    if(!channel || !channel.type) {
        return ''
    }
    else if(channel.type.toLowerCase() == 'facebook') {
        var url = 'https://www.facebook.com/'+channel.id
        return '<a href="'+url+'">'+url+'</a><br/>'
    }
    else if(channel.type.toLowerCase() == 'twitter') {
        var url = 'https://www.twitter.com/'+channel.id
        return '<a href="'+url+'">'+url+'</a><br/>'
    }
    else if(channel.type.toLowerCase() == 'youtube') {
        var url = 'https://www.youtube.com/'+channel.id
        return '<a href="'+url+'">'+url+'</a><br/>'
    }
    else if(channel.type.toLowerCase() == 'googleplus') {
        var url = 'https://plus.google.com/'+channel.id
        return '<a href="'+url+'">'+url+'</a><br/>'
    }
    else return channel.type+':'
}


var legislatorTable = function(legislators) {

    var html = ''
    html += '<table cellspacing="0" cellpadding="2" border="1">'
    var legType = 'Representatives'
    if(legislators.length == 0) {
        return '[No legislators]'
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
            channelInfo = ''
            for(var j=0; j < legislators[i].channels.length; j++) {
                channelInfo += getChannelUrl(legislators[i].channels[j])
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
        var photo = legislators[i].photoUrl ? legislators[i].photoUrl : legislators[i].photo_url
        if(photo) {
            html +=     '<img src="'+photo+'" height="150">'
        }
        html +=     '</td>'
        html +=     '<td valign="top">'
        html +=         'District: '+legislators[i].district
        html +=         '<br/>'+legislators[i].full_name+' ('+party+') '+' (id: '+legislators[i].id+')'
        _.each(legislators[i].emails, function(anEmail) {
            html +=     '<br/><a href="mailto:'+anEmail+'">'+anEmail+'</a>'
        })
        html +=         '<br/>'+channelInfo
        /***************************
        html +=         '<form method="post">'
        html +=             '<input type="hidden" name="state_abbrev" value="'+legislators[i].state+'"/>'
        html +=             '<input type="hidden" name="legislator_pkey" value="'+legislators[i].id+'"/>'
        //html +=             '<input type="hidden" name="idx" value="'+legislators[i].id+'"/>'
        html +=             '<input type="text" name="division" size="45" value="'+division+'" placeholder="division"/>'
        html +=             '<input type="submit" value="save" formaction="/saveDivision">'
        html +=         '</form>'
        ***************************/
        _.each(legislators[i].offices, function(office) {
            // only show offices that have a phone or email...
            if(office.phone || office.email) {
                //html += '<br/>'
                html += '<table border="0" cellpadding="0" cellspacing="0" height="0%">'
                html +=     '<tr>'
                var officename = office.name ? office.name : office.type
                html +=         '<td valign="top">'+officename+' &nbsp;&nbsp;</td>'
                html +=         '<td valign="top" height="0%">'
                if(office.phone) {
                    html +=         office.phone+'<br/>'
                }
                if(office.email) {
                    html +=         '<a href="mailto:'+office.email+'">'+office.email+'</a>'
                }
                html +=         '</td>'
                html +=     '</tr>'
                html += '</table><br/>'
            }
        })

        html +=     '</td>'

        // offices...
        html +=     '<td valign="top">'
        html +=         'Civic Data &nbsp;&nbsp;&nbsp;'
        html +=         '[<a href="/checkGoogleCivicDivision?division='+legislators[i].division+'" target="new">view</a>] '
        html +=         '[<a href="loadCivicData?legislatorId='+legislators[i].id+'&state='+legislators[i].state+'">load/reload</a>]'
        html +=         '<br/>loaded: '+legislators[i].civic_data_loaded_date+' '

        html +=     '</td>'
        html += '</tr>'
        html += '</table>'
        html += '</td></tr>'

    }
    html += '</table>'
    return html
}


exports.saveDivision = functions.https.onRequest((req, res) => {
    var state_abbrev = req.body.state_abbrev
    var legislator_pkey = req.body.legislator_pkey
    //var idx = req.body.idx // integer key node under state_abbrev node
    var updates = {}
    updates['states/legislators/'+legislator_pkey+'/division'] = req.body.division
    db.ref('/').update(updates).then(() => {
        return listStates(res, {state_abbrev: state_abbrev})
    })
})


// This pulls down raw data from OpenStates and saves it to /openstates/[state]/districts
// This way, I can query my own database for these legislators
exports.loadOpenStatesLegislators = functions.https.onRequest((req, res) => {
    var state_abbrev = req.query.state

    return db.ref('api_tokens/openstates').once('value').then(snapshot => {
        var apikey = snapshot.val()

        var legQuery = "https://openstates.org/api/v1/legislators/?state="+state_abbrev+"&apikey="+apikey
        request(legQuery, function (error, response, body) {
            db.ref('openstates/'+state_abbrev+'/legislators').set(JSON.parse(body))
        })
    })
    .then(() => {
        return listStates(res, {state_abbrev: state_abbrev})
    })
})


// This pulls down raw data from OpenStates and saves it to /openstates/[state]/districts
// This way, I can query my own database for these legislators
exports.loadOpenStatesDistricts = functions.https.onRequest((req, res) => {
    var state_abbrev = req.query.state

    return db.ref('api_tokens/openstates').once('value').then(snapshot => {
        var apikey = snapshot.val()

        var distQuery = "https://openstates.org/api/v1/districts/"+state_abbrev+"/?apikey="+apikey
        request(distQuery, function (error, response, body) {
            db.ref('openstates/'+state_abbrev+'/districts').set(JSON.parse(body))
        })
    })
    .then(() => {
        return listStates(res, {state_abbrev: state_abbrev})
    })

})



// Triggered by: downloadFromOpenStates()
// When we write a legislator to this node, look up the corresponding record in the google_civic_data node
// so that we can grab the stuff from there that OpenStates doesn't capture like social media channels
// and photo url
// OBVIOUSLY, GOOGLE CIVIC DATA HAS TO BE LOADED FIRST IN ORDER FOR THIS FUNCTION TO DO ANYTHING
exports.findCivicDataMatch = functions.database.ref("states/legislators/{key}").onWrite(
    event => {

    if(event.data.previous.exists())
        return false // we write to this node below, so we don't want to recursively trigger this function

    // have to take the leg_id and query /states/districts/[key]/legislators for the same leg_id

    var key = event.params.key // TXL0000033
    var legislatorNode = event.data.val()
            //db.ref('templog2').push().set({'state_chamber_district':legislatorNode.state_chamber_district})

    return db.ref('states/districts/'+legislatorNode.state_chamber_district).once('value').then(snapshot => {
        if(!snapshot.val()) {
            //db.ref('templog2/null_snapshot').set({'key': key, 'thing': 'null snapshot.val() for'+legislatorNode.state_chamber_district})
            return {}
        }
        if(!snapshot.val().division_id) {
            //db.ref('templog2/null_division_id').set({'key': key, 'thing': 'null division_id for'+legislatorNode.state_chamber_district})
            return {}
        }
        var division = snapshot.val().division_id
        var stuff = {}
        stuff.division = division
        stuff.ref = snapshot.ref
        return stuff
    })
    .then(stuff => {
        if(!stuff.division) {
            //db.ref('templog2/'+date.asMillis()).set(legislatorNode.state_chamber_district)
            return false
        }
        var division = stuff.division
        //db.ref('templog2').push().set({lookfor: division})
        return stuff.ref.root.child('google_civic_data/officials/').orderByChild('division').equalTo(division).once('value').then(snapshot => {
            // snapshot.val() is a list of legislators (though usually the list only has 1 person in it)
            var found = _.find(snapshot.val(), function(official) {
                var debug = false
                if(legislatorNode.leg_id == 'TXL000690') debug = true
                var sameName = (official.name.toLowerCase() == legislatorNode.full_name.toLowerCase()) ||
                            (official.name.toLowerCase() == legislatorNode.first_name.toLowerCase()+' '+legislatorNode.last_name.toLowerCase())
                var officialEmails = _.map(official.emails, function(o) {return o.toLowerCase()})
                var emailFound = _.find(officialEmails, function(email) {
                        return email && legislatorNode.email && email.toLowerCase() == legislatorNode.email.toLowerCase()
                })
                //if(debug) db.ref('templog2').push().set({official: official, legislator: legislatorNode, sameName: sameName, emailFound: (emailFound ? emailFound : 'no email found')})
                return sameName || emailFound
            })

            if(found) {
                var updates = {}
                if(found.channels)
                    updates['states/legislators/'+key+'/channels'] = found.channels
                if(found.emails) {
                    var alreadyContains = _.find(found.emails, function(email) { return email.toLowerCase() == legislatorNode.email.toLowerCase()} )
                    if(legislatorNode.email && !alreadyContains)  found.emails.push(legislatorNode.email)
                    updates['states/legislators/'+key+'/emails'] = found.emails
                }
                if(found.phones) {
                    updates['states/legislators/'+key+'/phones'] = found.phones
                }
                if(found.photoUrl) {
                    updates['states/legislators/'+key+'/photoUrl'] = found.photoUrl
                }
                if(found.urls) {
                    updates['states/legislators/'+key+'/urls'] = found.urls
                }
                // now add some timestamps
                updates['states/legislators/'+key+'/civic_data_loaded_date'] = date.asCentralTime()
                updates['states/legislators/'+key+'/civic_data_loaded_date_ms'] = date.asMillis()
                updates['google_civic_data/officials/'+found.key+'/openstates_match_date'] = date.asCentralTime()
                updates['google_civic_data/officials/'+found.key+'/openstates_match_date_ms'] = date.asMillis()
                return stuff.ref.root.update(updates)
            }

        })
    })

})


/*******************************************
For iOS and maybe Android too, to open the FB app directly to the legislator's page, we have to know
the legislator's FB ID.  The username is not enough.  The only way I've found so far (5/18/18) to look up someone's
FB ID is to do an http get on their page and then look through the response for either: 'fb://page/?id='  or 'fb://profile/'
*******************************************/
exports.lookupFacebookId = functions.database.ref('states/legislators/{legId}/channels/{idx).onWrite(event => {
    var legId = event.params.legId // TXL0000033

    //quit early when this node is deleted
    if(!event.data.exists()) {
        if(legId == 'TXL000690') event.data.adminRef.root.child('templog2').set({facebook_lookup_error: event.data.val()})
        return false
    }

    if(!event.data.val().type || event.data.val().type.toLowerCase() != 'facebook')
        return false

    var channelIdx = event.params.idx  // i.e.  0, 1, 2,...
    var channelNode = event.data.val()
    if(!channelNode.type || channelNode.type.toLowerCase() != 'facebook') {
        event.data.adminRef.root.child('templog2').set({facebook_lookup_error: channelNode})
        return false
    }
    if(channelNode.facebook_id || channelNode.facebook_lookup_error) {
        if(legId == 'TXL000690') event.data.adminRef.root.child('templog2').set({facebook_lookup_error: 'channelNode.facebook_id || channelNode.facebook_lookup_error'})
        return false // if it already exists, quit.  Otherwise, we'll cause infinite recursive trigger
    }
    var fbname = channelNode.id
    var url = "https://www.facebook.com/"+fbname

    var options = {
      url: url,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36'
      }
    }

    return request(options, function(error, response, body) {
        if(error)
            return event.data.adminRef.root.child('states/legislators/'+legId+'/channels/'+channelIdx+'/facebook_lookup_error').set(error)
        var lookfor = ['fb://page/?id=', 'fb://profile/']
        var findings = _.map(lookfor, function(str) {
            return {'item': str, 'index': body.indexOf(str)}
        })
        var xxx = _.find(findings, function(finding) {
            return finding.index != -1
        })
        if(!xxx) {
            // good chance the page is invalid
            var thisStuff = _.join(lookfor, ' and ')
            var err = 'This page: '+url+' is does not appear to be valid.  We searched the content for '+thisStuff+' but did not find instances of either.'
            return event.data.adminRef.root.child('states/legislators/'+legId+'/channels/'+channelIdx+'/facebook_lookup_error').set({'err': err, 'body': body})
        }
        else {
            var magicString = xxx.item
            var magicIndex1 = xxx.index + magicString.length
            var chop = body.substring(magicIndex1)
            var magicIndex2 = chop.indexOf('"')
            var fbId = chop.substring(0, magicIndex2)
            console.log('legId: ', legId, 'channelIdx', channelIdx, 'FB ID: ', fbId)
            // If you ever want to see exactly what Facebook is returning in their html...
            //event.data.adminRef.root.child('states/legislators/'+legId+'/channels/'+channelIdx+'/check_body').set(body)
            return event.data.adminRef.root.child('states/legislators/'+legId+'/channels/'+channelIdx+'/facebook_id').set(fbId)
        }
    })

})


// When the facebook_id is created or changes, we need to update the legislator_facebook_id under /video/list
exports.facebookIdUpdated = functions.database.ref('states/legislators/{leg_id}/channels/{idx}/facebook_id').onWrite(event => {
    if(event.data.val() == event.data.previous.val())
        return false
    if(!event.data.val())
        return false

    var fbId = event.data.val()

    return event.data.adminRef.root.child('states/legislators/'+event.params.leg_id+'/channels/'+event.params.idx).once('value').then(snapshot => {
        var facebookHandle = snapshot.val().id
        return event.data.adminRef.root.child('video/list').orderByChild('leg_id').equalTo(event.params.leg_id).once('value').then(snapshot => {
            var updates = {}
            snapshot.forEach(function(child) {
                var videoListKey = child.key
                updates['video/list/'+videoListKey+'/legislator_facebook_id'] = fbId
                updates['video/list/'+videoListKey+'/legislator_facebook'] = facebookHandle
            })
            return snapshot.ref.root.update(updates)
        })
    })


})


// loads civic data for one legislator
exports.loadCivicData = functions.https.onRequest((req, res) => {
    if(!req.query.legislatorId || !req.query.state)
        return false
    var legId = req.query.legislatorId
    var state_abbrev = req.query.state
    // hack/cheat maybe? I copy the legislator's node to a temp location, then delete the legislator's node
    // Finally I re-add the legislator's node which triggers findCivicDataMatch()
    return db.ref('states/legislators/'+legId).once('value').then(snapshot => {
        return snapshot.ref.root.child('states/temp/'+legId).set(snapshot.val()).then(() => {
            return snapshot.ref.remove().then(() => {
                // now add the node back to trigger findCivicDataMatch()
                return snapshot.ref.set(snapshot.val()).then(() => {
                    // finall, remove the temp node...
                    return snapshot.ref.root.child('states/temp/'+legId).remove().then(() => {
                        return listStates(res, {state_abbrev: state_abbrev})
                    })
                })
            })
        })
    })

})


// poorly named -  not just to identify people that DON'T have civic data, but also for
// people to DO have civic data.  All depends on the request parms
exports.peopleWithoutCivicData = functions.https.onRequest((req, res) => {
    if(!req.query.attribute || !req.query.value)
        return false
    var attribute = req.query.attribute
    var value = req.query.value
    var query = db.ref('states/legislators').orderByChild(attribute).equalTo('')
    if(attribute == 'civic_data_loaded_date_ms') {
        if(value == 'notempty')
            query = db.ref('states/legislators').orderByChild(attribute).startAt(0)
    }
    //query = db.ref('states/legislators').orderByChild('civic_data_loaded_date_ms').startAt(10000)

    return query.once('value').then(snapshot => {
        var legs = []
        snapshot.forEach(function(child) {
            var leg = child.val()
            leg.key = child.key
            legs.push(leg)
        })
        return {res: res, legislators: legs, ref: snapshot.ref}
    })
    .then(stuff => {
        var queryValue = value=='empty' ? '""' : 'not empty'
        return listStates(res, {legislators: stuff.legislators, queryparms: {attribute: attribute, queryValue: queryValue}})
    })
})

/******************************************************
 How to update legislators social media handles without letting incorrect data overwrite good data

 Step 1:  Write a record to social_media/user_updates:
         id (the facebook or twitter handle)
         leg_id  (the open states leg_id)
         legislator_full_name  (maybe)
         legislator_first_name
         legislator_last_name
         state_abbrev
         state_chamber
         state_chamber_district
         type  ("Facebook" or "Twitter")
         updated_date  (i.e.  Jun 25, 2018 9:05 AM CDT)
         updated_date_ms
         updating_user_email  (current user's email)
         updating_user_id
         updating_user_name  (i.e.  Brent Dunklau)

 Step 2a:  Trigger that listens for writes to social_media/user_updates/{key}
    The trigger will write to 2 places - states/legislators/{leg_id}/channels/{idx} and video/list
    The trigger will query states/legislators/{leg_id} to see if there is a "channels" node and under that,
    a channel with the right "type" value (Facebook or Twitter).
    The trigger will update the channel node if it exists and create one if it doesn't.
    In either case, the trigger will also write a "user_update" node with value equal to the key value
    from social_media/user_updates/{key}

 Step 2b:  Another trigger that also listens for writes to social_media/user_updates/{key}
    This trigger will also update legislator_facebook or legislator_twitter for all nodes under
    video/list where leg_id = the legislator's leg_id.  So older videos will be kept up to date as social handles change.
    And one of those nodes will be the one you're currently looking at.

 Step 3:  Prevent overwriting good data with bad data.  Need a trigger to watch what gets written
    to states/legislators/{leg_id}/channels/{idx}.  If a value is written to
    states/legislators/{leg_id}/channels/{idx}, the "restore" trigger will check for the existence of this
    attribute: states/legislators/{leg_id}/channels/{idx}/user_update

    If this attribute exists, the "restore" trigger will query social_media/user_updates for a node with this key.
    The "id" value under this social_media/user_updates/{key} node will be compared to the "id" value under
    states/legislators/{leg_id}/channels/{idx}.  If the two id's are the same, no action.  But if they are different,
    we interpret that as bad data attempting to overwrite good data.  In that case, the trigger will update
    states/legislators/{leg_id}/channels/{idx}/id=social_media/user_updates/{key}/id

 And because all this is done with triggers, all we have to do in the mobile code is do one write to
 social_media/user_updates and the triggers do all the rest.  We can even test this just using the firebase database client
 ******************************************************/
exports.updateLegislatorSocialMedia = functions.database.ref('social_media/user_updates/{key).onWrite(event => {
    // This function is "Step 2a" described above

    if(!event.data.exists() && event.data.previous.exists()) return false; // if node deleted -> ignore

    var channel = {id: event.data.val().id, type: event.data.val().type, user_update: event.params.key}

    // query states/legislators/{event.data.val().leg_id}
    return db.ref('states/legislators/'+event.data.val().leg_id).once('value').then(snapshot => {
        if(!snapshot.val().channels) {
            // no channels is ok.  We just add one
            var channels = [channel]
            return snapshot.ref.child("channels").set(channels)
        }
        else {
            var idx = snapshot.val().channels.length
            for(var i=0; i < snapshot.val().channels.length; i++) {
                if(snapshot.val().channels[i].type.toLowerCase() == event.data.val().type.toLowerCase()) {
                    idx = i
                }
            }

            return snapshot.ref.child("channels/"+idx).set(channel)
        }
    })

})


// This function is "Step 2b" described above
exports.updateVideoNodeSocialMedia = functions.database.ref('social_media/user_updates/{key).onWrite(event => {

    if(!event.data.exists() && event.data.previous.exists()) return false; // if node deleted -> ignore

    var which_handle = event.data.val().type.toLowerCase() == 'facebook' ? 'legislator_facebook' : 'legislator_twitter'

    return db.ref('video/list').orderByChild('leg_id').equalTo(event.data.val().leg_id).once('value').then(snapshot => {
        var updates = {}
        snapshot.forEach(function(child) {
            // get each node/path that needs to be updated...
            updates['video/list/'+child.key+'/'+which_handle] = event.data.val().id
        })
        // multi-path update
        return db.ref('/').update(updates)
    })
})

// see if we accidentally overwrote good data with bad data and correct if we did
exports.overwriteBadWithGoodData = functions.database.ref('states/legislators/{leg_id}/channels/{idx).onWrite(event => {
    if(!event.data.exists() && event.data.previous.exists())
        return false;  // ignore the case where the node is deleted

    if(!event.data.val().user_update)
        return false  // ignore the case where this node has no "user_update" attribute

    if(event.data.val().id == event.data.previous.val().id)
        return false  // the value we care about didn't change

    var leg_id = event.params.leg_id
    var idx = event.params.idx

    return db.ref('social_media/user_updates/'+event.data.val().user_update).once('value').then(snapshot => {
        // check this social_media/user_updates/aSDfsdfaSDfwE/id  node and see if it's the same
        // as the states/legislators/leg_id/channels/{idx}/id node
        // If it's not -> that's a problem and needs to be corrected
        var goodHandle = snapshot.val().id
        if(event.data.val().id != goodHandle) {
            return db.ref('states/legislators/'+leg_id+'/channels/'+idx+'/id').set(goodHandle)
        }
    })
})

// quick and dirty web page that I do a GET on to add a node to social_media/user_updates to verify the two
// triggers above do what they should
exports.testUpdateSocialMedia = functions.https.onRequest((req, res) => {
    if(!req.query.id || !req.query.leg_id || !req.query.type)
        return res.status(200).send('Some/all of these parameters were missing<P/>They are all required:<P/>id (the Facebook or Twitter handle)<br/>leg_id<br/>type (either Facebook or Twitter)')

    // for this test, we don't need a lot of the attributes we typically insert:
    //      legislator_full_name, state_abbrev, state_chamber, state_chamber_district, updated_date, updated_date_ms, updating_user_email, updating_user_id, updating_user_name
    var upd = {id: req.query.id, leg_id: req.query.leg_id, type: req.query.type /*don't need legislator_full_name, state_abbrev, state_chamber, state_chamber_district, */}
    return db.ref('social_media/user_updates').push().set(upd).then(() => {
        var result = []
        result.push({message:'NOTE This page will report false negatives because triggers fire after this function has sent its response'})

        // now query and make sure the triggers worked...
        return db.ref('states/legislators/'+req.query.leg_id+'/channels').orderByChild('type').equalTo(req.query.type).once('value').then(snapshot => {
            var ct = snapshot.numChildren()
            if(ct != 1) {
                result.push({message:'NOT OK - We got '+ct+' '+req.query.type+'channels. We should have gotten exactly 1'})
                return {result: result}
            }
            else {
                snapshot.forEach(function(child) {
                    var sameHandle = child.val().id == req.query.id
                    if(sameHandle)
                        result.push({message:'OK - states/legislators/'+req.query.leg_id+'/channels/'+child.key+'/id = '+child.val().id})
                    else {
                        result.push({message:'NOT OK - Expected states/legislators/'+req.query.leg_id+'/channels/'+child.key+'/id = '+req.query.id})
                        result.push({message:'NOT OK - Actually states/legislators/'+req.query.leg_id+'/channels/'+child.key+'/id = '+child.val().id})
                    }
                })
                return db.ref('video/list').orderByChild('leg_id').equalTo(req.query.leg_id).once('value').then(snapshot => {
                    var videoNodeKeys = []
                    var attribute = req.query.type.toLowerCase() == 'facebook' ? 'legislator_facebook' : 'legislator_twitter'
                    snapshot.forEach(function(child) {
                        videoNodeKeys.push(child.key)
                        var handle = child.val()[attribute]
                        if(handle == req.query.id) {
                            result.push({message:'OK - video/list/'+child.key+'/'+attribute+' = '+handle})
                        }
                        else {
                            result.push({message:'NOT OK - Expected video/list/'+child.key+'/'+attribute+' = '+req.query.id})
                            result.push({message:'NOT OK - Actually video/list/'+child.key+'/'+attribute+' = '+handle})
                        }
                    })
                    return {result: result, videoNodeKeys: videoNodeKeys}
                })
            }
        })
        .then(stuff => {
            var result = stuff.result
            var html = '<html><head><body>'
            _.each(result, function(rs) {
                html += '<br/>'+rs.message
            })

            // some helpful links that we display in the results.  That way I can click each one and be
            // taken to the exact spots in the database tree that I need to go to to verify results
            var helplinks = []
            helplinks.push('https://console.firebase.google.com/project/telepatriot-dev/database/telepatriot-dev/data/social_media/user_updates')
            helplinks.push('https://console.firebase.google.com/project/telepatriot-dev/database/telepatriot-dev/data/states/legislators/'+req.query.leg_id+'/channels/0')
            var three = []
            if(stuff.videoNodeKeys) {
                _.each(stuff.videoNodeKeys, function(key) {
                    helplinks.push('https://console.firebase.google.com/project/telepatriot-dev/database/telepatriot-dev/data/video/list/'+key);
                })
            }

            html += '<h3>Helpful Links to Verify this Test</h3>'
            _.each(helplinks, function(link) {
                html += '<br/><a href="'+link+'">'+link+'</a>'
            })

            html += '</body></html>'
            res.status(200).send(html)
        })
    })
})

