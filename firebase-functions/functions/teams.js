'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

var style = "font-family:Arial;font-size:12px"
var tableheading = style + ';background-color:#ededed'

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


/***
paste this on the command line...
firebase deploy --only functions:manageTeams,functions:copyTeam,functions:copyMembers,functions:createTeam,functions:deleteMissionItem,functions:deleteTeam,functions:addPeopleToTeam,functions:downloadMissionReport,functions:downloadTeamRoster,functions:removePeopleFromTeam,functions:viewMembers,functions:viewMissions,functions:viewQueue,functions:setCurrentTeam,functions:resetCurrentTeam,functions:updateMemberListUnderTeams,functions:updateTeamListUnderUsers,functions:viewMissionReport,functions:cullTrainingTeam,functions:removeFromTrainingTeam,functions:teamlist,functions:addToTeamList,functions:removeTeamFromList
***/



exports.manageTeams = functions.https.onRequest((req, res) => {

    return listTeams('', '')
    .then(teamListHtml => {
        var html = '<html><head></head><body><table width="100%"><tr><td colspan="33%">' + teamListHtml + '</td><td colspan="33%">&nbsp;</td><td colspan="33%">&nbsp;</td></tr></table></body></html>'
        return res.status(200).send(html)
    })

})


var listTeams = function(stuff, current_team) {

    return db.ref('team_list').orderByChild('team_name').once('value').then(snapshot => {
        stuff += '<table><tr><td colspan="5"><b>All Teams</b></td></tr>'
        stuff += '<tr><td colspan="5"><form method="post" action="/createTeam"><input type="submit" value="Create Team"/>&nbsp;&nbsp;<input type="text" name="team_name" placeholder="New Team"/></form></td></tr>'
        snapshot.forEach(function(child) {
            stuff += '<tr>'
            stuff += '<td style="'+style+'" valign="top"><a href="/viewMembers?team='+child.val().team_name+'">Members</a></td>'
            stuff += '<td style="'+style+'" valign="top"><a href="/viewMissions?team='+child.val().team_name+'">Missions</a></td>'
            stuff += '<td style="'+style+'" valign="top"><a href="/viewQueue?team='+child.val().team_name+'">Queue</a></td>'
            stuff += '<td style="'+style+'" valign="top">'+child.val().team_name+'</td>'
            if(current_team && current_team.trim() != '') {
                /********** take this button out - it's too dangerous
                if(current_team.trim() != child.val().team_name) {
                    stuff += '<td valign="middle"><form method="post" action="/copyMembers?from_team='+current_team+'&to_team='+child.val().team_name+'"><input type="submit" value="Add '+current_team+' members to '+child.val().team_name+'"></form></td>'
                }
                else { stuff += '<td>&nbsp;</td>' }
                *****************/

                stuff += '<td>&nbsp;</td>'
            }
            else { stuff += '<td>&nbsp;</td>' }
            //var deleteTeam = cell('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <a href="/deleteTeam?name='+child.val().team_name+'">!!! Delete Team !!!</a>', 1)
            stuff += '</tr>'
        })
        stuff += '</table>'
        return stuff
    })
}


exports.viewMembers = functions.https.onRequest((req, res) => {

    var team_name = req.query.team

    return showTheWholePage(team_name).then(html => {
        return res.status(200).send(html)
    })

})


exports.viewMissions = functions.https.onRequest((req, res) => {

    var team_name = req.query.team

    return showTheWholePage_Missions(team_name, '').then(html => {
        return res.status(200).send(html)
    })

})


exports.viewQueue = functions.https.onRequest((req, res) => {

    var team_name = req.query.team

    return showTheWholePage_Queue(team_name).then(html => {
        return res.status(200).send(html)
    })

})


var showTheWholePage = function(team_name) {

    return listTeams('', team_name)
    .then(teamListHtml => {

        return listMembers(team_name)
        .then(memberListHtml => {
            // show the "add people" text area
            var stuff = '<table><tr>'
            stuff += '<td><form method="post" action="/addPeopleToTeam?team='+team_name+'"><textarea rows="20" cols="40" name="email" placeholder="Enter one email address\nper line\n\nTHESE PEOPLE MUST ALREADY HAVE \nTELEPATRIOT ACCOUNTS\n\nIf you enter an email address that is not an existing TelePatriot user, this person will not be added to the team"></textarea><P/><input type="submit" value="Add People to '+team_name+' Team"></form></td>'
            stuff += '</tr></table>'
            return '<table width="100%"><tr><td colspan="33%" valign="top">'+teamListHtml+'</td><td valign="top">'+memberListHtml+'</td><td valign="top">'+stuff+'</td></tr></table>'
        })

    })
    .then(html => {
        return '<html><head></head><body>'+html+'</body></html>'
    })
}


// show is 'members' or 'missions'
var showTheWholePage_Missions = function(team_name, mission_id) {

    return listTeams('', team_name)
    .then(teamListHtml => {

        return listMissions(team_name)
        .then(missionListHtml => {
            var pageStuff = {teamListHtml: teamListHtml, missionListHtml: missionListHtml}
            return pageStuff
        })
        .then(pageStuff => {
            if(!mission_id || mission_id == '') {
                return '<table width="100%"><tr><td colspan="33%" valign="top">'+pageStuff.teamListHtml+'</td><td valign="top">'+pageStuff.missionListHtml+'</td></tr></table>'
            }
            else {
                return listMissionItems(team_name, mission_id).then(mission_items_html => {
                    return '<table width="100%"><tr><td colspan="33%" valign="top">'+pageStuff.teamListHtml+'</td><td valign="top">'+pageStuff.missionListHtml+'</td><td valign="top">'+mission_items_html+'</td></tr></table>'
                })
            }
        })

    })
    .then(html => {
        return '<html><head></head><body>'+html+'</body></html>'
    })
}


// this is what we show when the user clicks "Queue" next to a team
// The "Queue" are the /mission_items under a team.  They are the mission_items that haven't been completed yet
var showTheWholePage_Queue = function(team_name) {

    return listTeams('', team_name)
    .then(teamListHtml => {

        return listQueue(team_name)
        .then(missionItemListHtml => {
            var pageStuff = {teamListHtml: teamListHtml, missionItemListHtml: missionItemListHtml}
            return pageStuff
        })
        .then(pageStuff => {
            return '<table width="100%"><tr><td colspan="33%" valign="top">'+pageStuff.teamListHtml+'</td><td valign="top">'+pageStuff.missionItemListHtml+'</td></tr></table>'

        })

    })
    .then(html => {
        return '<html><head></head><body>'+html+'</body></html>'
    })
}



var listQueue = function(team_name) {
    var stuff = ''

    // mission_item attributes
    var attrs = ["accomplished", "active", "active_and_accomplished", "description", "email", "group_number",
            "mission_create_date", "mission_id", "mission_name", "mission_type", "name", "name2", "number_of_missions_in_master_mission",
            "phone", "phone2", "script", "uid", "uid_and_active", "url"]

    return db.ref('teams').child(team_name).child('mission_items').once('value')
    .then(snapshot => {
        var mission_items = []
        snapshot.forEach(function(child) {
            var mission_item = {}
            mission_item['mission_item_id'] = child.key
            _.forEach(attrs, function(attr_name) {
                mission_item[attr_name] = child.val()[attr_name]
            })
            mission_items.push(mission_item)
        })

        var missionStuff = {active_mission_items: mission_items, mission_item_attribute_names: attrs}
        return missionStuff
    })
    .then(missionStuff => {

        stuff += '<P/>'
        stuff += '<table><tr><td><b>Active Mission Items for Team: '+team_name+'</b></td></tr></table>'
        stuff += '<table><tr>'
        var attr_names = missionStuff.mission_item_attribute_names
        var mission_items = missionStuff.active_mission_items
        stuff += '<th style="'+tableheading+'"> </th>'
        stuff += '<th style="'+tableheading+'">mission_item_id</th>'
        _.forEach(attr_names, function(attr_name) {
            stuff += '<th style="'+tableheading+'">'+attr_name+'</th>'
        })
        stuff += '</tr>'

        _.forEach(mission_items, function(mission_item) {
            var mission_item_id = mission_item["mission_item_id"]
            var mission_id = mission_item["mission_id"]
            stuff += '<tr>'
            stuff += '<td style="'+style+'"><a href="/deleteMissionItem?team='+team_name+'&mission_item_id='+mission_item_id+'">delete</a></td>'
            stuff += '<td style="'+style+'">'+mission_item_id+'</td>'
            _.forEach(attr_names, function(attr_name) {
                var val = mission_item[attr_name]
                if(attr_name == 'description') val = '(description)'
                else if(attr_name == 'script') val = '(script)'
                stuff += '<td style="'+style+'">'+val+'</td>'
            })
            stuff += '</tr>'
        })
        stuff += '</table>'
        return stuff
    })
}



// should we put this in another js file just to keep the size of this one down?
var listMissions = function(team_name) {
    var stuff = ''

    return db.ref('teams').child(team_name).child('missions').once('value')
    .then(snapshot => {
        var missions = []
        snapshot.forEach(function(child) {
            var mission = {}
            mission['active'] = child.val().active
            // description
            mission['mission_create_date'] = child.val().mission_create_date
            // mission_items count ?
            mission['mission_id'] = child.key
            mission['mission_name'] = child.val().mission_name
            mission['mission_type'] = child.val().mission_type
            mission['name'] = child.val().name
            mission['percent_complete'] = child.val().percent_complete
            // script
            // sheet_id
            mission['total_rows_activated'] = child.val().total_rows_activated
            mission['total_rows_completed'] = child.val().total_rows_completed
            mission['total_rows_deactivated'] = child.val().total_rows_deactivated
            mission['total_rows_in_spreadsheet'] = child.val().total_rows_in_spreadsheet
            mission['total_rows_in_spreadsheet_with_phone'] = child.val().total_rows_in_spreadsheet_with_phone
            // uid
            // uid_and_active
            mission['url'] = child.val().url
            missions.push(mission)
        })
        return missions
    })
    .then(missions => {
        stuff += '<table><tr><td colspan="1"><b>'+team_name+' Missions</b></td></tr></table>'
        stuff += '<table><tr>'
        stuff += '<th colspan="2" style="'+tableheading+'">Report</th>'
        stuff += '<th style="'+tableheading+'">Name</th>'
        stuff += '<th style="'+tableheading+'">Created on</th>'
        stuff += '<th style="'+tableheading+'">Created by</th>'
        stuff += '<th style="'+tableheading+'">Complete %</th>'
        stuff += '</tr>'

        _.forEach(missions, function(value) {
            stuff += '<tr>'
            stuff += '<td style="'+style+'"><a href="/viewMissionReport?team='+team_name+'&mission_id='+value.mission_id+'">View</a></td>'
            stuff += '<td style="'+style+'"><a href="/downloadMissionReport?team='+team_name+'&mission_id='+value.mission_id+'">Download</a></td>'
            stuff += '<td style="'+style+'">'+value.mission_name+'</td>'
            stuff += '<td style="'+style+'">'+value.mission_create_date+'</td>'
            stuff += '<td style="'+style+'">'+value.name+'</td>'
            stuff += '<td style="'+style+'">'+value.percent_complete+'</td>'
            stuff += '</tr>'
        })

        stuff += '</table>'

        return stuff
    })
}



exports.deleteMissionItem = functions.https.onRequest((req, res) => {

    var team_name = req.query.team
    var mission_id = req.query.mission_id
    var mission_item_id = req.query.mission_item_id

    return db.ref('/teams/'+team_name+'/mission_items/'+mission_item_id).remove()
    .then(() => {
        return showTheWholePage_Queue(team_name).then(html => {
            return res.status(200).send(html)
        })
    })



})

var getTeamRoster = function(team_name) {
    return db.ref('users').once('value').then(snapshot => {
        var team = []
        snapshot.forEach(function(child) {
            if(child.val().teams) {
                var onteam = _.find(child.val().teams, {'team_name': team_name})
                if(onteam && child.val().name && child.val().email && child.val().phone) {
                    team.push({name: child.val().name, email: child.val().email, phone: child.val().phone})
                }
            }
        })
        return team
    })

}


var getMissionItems = function(team_name, mission_id) {
    return db.ref('/teams/'+team_name+'/missions/'+mission_id+'/mission_items').orderByChild('name').once('value').then(snapshot => {
        var mission_items = []
        snapshot.forEach(function(child) {
            var mission_item = {}
            mission_item['mission_name'] = child.val().mission_name
            mission_item['completed_by_name'] = child.val().completed_by_name ? child.val().completed_by_name : ''
            mission_item['mission_complete_date'] = child.val().mission_complete_date ? child.val().mission_complete_date : ''
            mission_item['name'] = child.val().name ? child.val().name : '' // the person called
            mission_item['notes'] = child.val().notes ? child.val().notes : ''
            mission_item['outcome'] = child.val().outcome ? child.val().outcome : ''
            mission_item['phone'] = child.val().phone ? child.val().phone : ''
            mission_items.push(mission_item)
        })
        return mission_items
    })
}


var listMissionItems = function(team_name, mission_id) {
    return getMissionItems(team_name, mission_id)
    .then(mission_items => {
        var stuff = ''
        stuff += '<table><tr>'
        stuff += '<th style="'+tableheading+'">Mission</th>'
        stuff += '<th style="'+tableheading+'">Name</th>'
        stuff += '<th style="'+tableheading+'">Phone</th>'
        stuff += '<th style="'+tableheading+'">Called by</th>'
        stuff += '<th style="'+tableheading+'">Called on</th>'
        stuff += '<th style="'+tableheading+'">Outcome</th>'
        stuff += '<th style="'+tableheading+'">Notes</th>'
        stuff += '</tr>'
        _.forEach(mission_items, function(value) {
            stuff += '<tr>'
            stuff += '<td style="'+style+'">'+value.mission_name+'</td>'
            stuff += '<td style="'+style+'">'+value.name+'</td>'
            stuff += '<td style="'+style+'">'+value.phone+'</td>'
            stuff += '<td style="'+style+'">'+value.completed_by_name+'</td>'
            stuff += '<td style="'+style+'">'+value.mission_complete_date+'</td>'
            stuff += '<td style="'+style+'">'+value.outcome+'</td>'
            stuff += '<td style="'+style+'">'+value.notes+'</td>'
            stuff += '</tr>'
        })
        return stuff += '</table>'
    })
}


exports.downloadMissionReport = functions.https.onRequest((req, res) => {
    var team_name = req.query.team
    var mission_id = req.query.mission_id
    var mission_name = 'TelePatriotMission.xlsx' // just a default value, expect this to be overwritten below

    return getMissionItems(team_name, mission_id).then(mission_items => {
        var stuff = '' // csv data
        stuff = 'Name\tPhone\tCalled by\tCalled on\tOutcome\tNotes\n'
        _.forEach(mission_items, function(value) {
            stuff += value.name+'\t'
            stuff += value.phone+'\t'
            stuff += value.completed_by_name+'\t'
            stuff += value.mission_complete_date+'\t'
            stuff += value.outcome+'\t'
            stuff += value.notes+'\t'
            stuff += '\n'
            mission_name = value.mission_name
        })

        var filename = mission_name.replace(/,/g, '').replace(/\'/g, '').replace(/’/g, '')

        return res.set({'Content-Type': 'application/vnd.ms-excel', 'Content-Disposition': 'attachment;filename='+filename+'.xls'}).status(200).send(stuff)
    })
})


exports.downloadTeamRoster = functions.https.onRequest((req, res) => {
    var team_name = req.query.team
    var filename = team_name+' Roster.xls' // just a default value, expect this to be overwritten below

    return getTeamRoster(team_name).then(members => {
        var stuff = '' // csv data
        stuff = 'name\tphone\temail\n'
        _.forEach(members, function(value) {
            stuff += value.name+'\t'
            stuff += value.phone+'\t'
            stuff += value.email+'\t'
            stuff += '\n'
        })

        return res.set({'Content-Type': 'application/vnd.ms-excel', 'Content-Disposition': 'attachment;filename='+filename}).status(200).send(stuff)
    })
})


exports.viewMissionReport = functions.https.onRequest((req, res) => {
    var team_name = req.query.team
    var mission_id = req.query.mission_id

    return showTheWholePage_Missions(team_name, mission_id).then(html => {
        return res.status(200).send(html)
    })
})


// This function will remove you from the Training Team as soon as you are added to another team
// If the {team} happens to be Training Team, then this function returns early
// NOTE: Training Team is actually whatever the team is at administration/newuser/assign_to_team
exports.removeFromTrainingTeam = functions.database.ref('/users/{uid}/teams/{team}').onCreate(event => {
    var ateam = event.params.team
    return db.ref('administration/newusers/assign_to_team').once('value').then(snapshot => {
        var trainingTeam = snapshot.val()
        var ignore = ateam == trainingTeam
        if(ignore)
            return false
        else {
            return event.data.adminRef.root.child('users/'+event.params.uid+'/teams/'+trainingTeam).remove()
        }
    })

})



// This a one-time clean up function.  We had a bunch of people in Nov 2018 that were never
// moved off the Training Team even though they were on other teams.
// This function identifies them, and at the top of the page provides a link that fires this
// function again, only this time, adds a cull=true request parameter that tells this function
// to go ahead and remove the Training Team of the people identified as belong to at least one other team
exports.cullTrainingTeam = functions.https.onRequest((req, res) => {

    var count = 1
    var cull = false
    if(req.query.cull && req.query.cull == 'true') {
        cull = true
        //count = 0
    }

    return db.ref('users').once('value').then(snapshot => {

        return db.ref('administration/newusers/assign_to_team').once('value').then(snap2 => {
            var deleteTeam = snap2.val()
            var deletes = {}
            var data = []
            var deleteTeam = snap2.val()
            snapshot.forEach(function(child) {
                var uid = child.key
                var teams = child.val().teams
                if(teams) {
                    var keys = Object.keys(teams)
                    if(keys.length > count) {
                        var team = _.find(teams, {team_name: deleteTeam})
                        var path = 'users/'+uid+'/teams/'+deleteTeam
                        deletes[path] = null
                        data.push({name: child.val().name, uid: uid, path: path, teams: teams})
                    }
                }
            })

            return {data: data, deletes: deletes, deleteTeam: deleteTeam}
        })
    })
    .then(stuff => {
        if(cull) {
            return db.ref('/').update(stuff.deletes).then(() => {
                return db.ref('users').once('value').then(snap3 => {
                    var html = ''
                    html += '<html><head></head><body>'
                    html += '<h3><a href="/cullTrainingTeam?cull=true">Delete Everyone not on '+stuff.deleteTeam+'</a></h3>'
                    html += '<table>'
                    snap3.forEach(function(child) {
                        var teams = child.val().teams
                        if(teams) {
                            var keys = Object.keys(teams)
                            if(keys.length > count) {
                                html += '<tr><td valign="top">'+child.val().name+'</td><td valign="top">'+child.key+'</td><td valign="top">'+_.join(keys, '<br/>')+'</td></tr>'
                            }
                        }
                    })
                    html += '</table>'
                    html += '</body></html>'
                    return res.status(200).send(html)
                })
            })

        }
        else {

            var html = ''
            html += '<html><head></head><body>'
            html += '<h3><a href="/cullTrainingTeam?cull=true">Delete Everyone not on '+stuff.deleteTeam+'</a></h3>'
            html += '<table>'

            _.each(stuff.data, function(line) {
                html += '<tr><td valign="top">'+line.name+'</td><td valign="top">'+line.uid+'</td><td valign="top">'+line.path+'</td><td valign="top">'+_.join(Object.keys(line.teams), '<br/>')+'</td></tr>'
            })

            html += '</table>'
            html += '</body></html>'
            return res.status(200).send(html)
        }
    })

})


var listMembers = function(team_name) {

    var stuff = ''

    return db.ref('teams').child(team_name).child('members').once('value')
    .then(snapshot => {
        var members = []
        snapshot.forEach(function(child) {
            var member = {}
            member['name'] = child.val().name
            member['email'] = child.val().email
            if(child.val().phone) member['phone'] = child.val().phone
            members.push(member)
        })

        // Don't actually HAVE to sort using lodash.  We could also have just sorted via .orderByChild('name')
        return _.sortBy(members, 'name')
    })
    .then(sortedMembers => {
        stuff += '<table><tr><td colspan="4"><b>Team: '+team_name+'</b></td></tr>'
        stuff += '<tr><td colspan="4"><form method="post" action="/copyTeam?team='+team_name+'"><input type="submit" value="Copy '+team_name+'"/>&nbsp;&nbsp;<input type="text" name="copyteam" placeholder="New Team"/></form></td></tr>'
        stuff += '<tr><td><a href="/downloadTeamRoster?team='+team_name+'">Download Roster</a></td></tr>'
        _.forEach(sortedMembers, function(value) {
            stuff += '<tr>'
            stuff += '<td><a style="'+style+'" href="/removePeopleFromTeam?team='+team_name+'&email='+value.email+'">Remove</a></td>'
            stuff += '<td style="'+style+'">'+value.name+'</td>'
            stuff += '<td style="'+style+'">'+value.email+'</td>'
            if(value.phone) {
                stuff += '<td style="'+style+'">'+value.phone+'</td>'
            }
            else stuff += '<td>&nbsp;</td>'
            stuff += '</tr>'
        })

        stuff += '</table>'
        return stuff
    })
}


exports.copyTeam = functions.https.onRequest((req, res) => {
    var team_name_untrimmed = req.query.team
    var new_team_untrimmed = req.body.copyteam

    if(!team_name_untrimmed || team_name_untrimmed.trim() == '' || !new_team_untrimmed || new_team_untrimmed.trim() == ''
        || team_name_untrimmed.trim() == new_team_untrimmed.trim()) {

        db.ref('/templog').push().set({result: 'copy team returned early', team_name: team_name_untrimmed, new_team: new_team_untrimmed})
        return showTheWholePage(team_name_untrimmed).then(html => {
                  return res.status(200).send(html)
              })
    }

    var team_name = team_name_untrimmed.trim()
    var new_team = stripSpecialChars(new_team_untrimmed.trim())

    // make sure the user isn't trying to do a "save as" on top of a team that already exists - that would be bad
    return db.ref('/teams/'+new_team).once('value').then(snapshot => {
        db.ref('/templog').push().set({result: 'check snapshot.val()', snapshot_val: snapshot.val()})
        if(!snapshot.val()) {
            // this team doesn't exist yet, so we're ok to save the current team as this new team

            db.ref('/teams/'+team_name).once('value').then(snapshot => {
                var copy = snapshot.val()
                copy.team_name = new_team
                db.ref('/teams/'+new_team+'/team_name').set(new_team)
                return snapshot
            })
            .then(snapshot => {
                var members = snapshot.val().members
                db.ref('/teams/'+new_team+'/members').set(members)
            })

        }
    })
    .then(() => {
        return showTheWholePage(new_team).then(html => {
            return res.status(200).send(html)
        })
    })

})


exports.copyMembers = functions.https.onRequest((req, res) => {
    var from_team = req.query.from_team
    var to_team = req.query.to_team

    return db.ref('teams').child(from_team).child('members').once('value').then(snapshot => {
        snapshot.forEach(function(child) {
            var uid = child.key
            db.ref('teams').child(to_team).child('members').child(uid).set(child.val())
        })
    })
    .then(() => {
        return showTheWholePage(to_team).then(html => {
            return res.status(200).send(html)
        })
    })

})


// kinda don't need createTeam anymore because we have copyTeam
// Not part of the /manageTeams page at the moment (12/27/17)
// commented out in index.js
// SEE: function addToTeamList
exports.createTeam = functions.https.onRequest((req, res) => {

    var stuff = ''
    // allow for these req parms
    //      node
    var team_name_untrimmed = req.body.team_name

    if(!team_name_untrimmed || team_name_untrimmed.trim() == '') {
        return res.status(200).send(stuff+"<P/>These request parms are required: <P/> name")
    }
    else {
        var team_name = stripSpecialChars(team_name_untrimmed.trim())
        // have to make sure the team doesn't already exist, OR IT WILL BE OVERWRITTEN !
        return db.ref('/teams/'+team_name).once('value').then(snapshot => {
            if(!snapshot.val()) {
                // this team doesn't exist yet, so we're ok to create it
                db.ref('/teams/'+team_name).set({team_name: team_name})
            }
        })
        .then(() => {
            return showTheWholePage(team_name).then(html => {
                return res.status(200).send(html)
            })
        })
    }

})


exports.deleteTeam = functions.https.onRequest((req, res) => {

    // allow for these req parms
    //      node
    var name = req.query.name

    var stuff = ''

    if(!name) {
        return res.status(200).send(stuff+"<P/>These request parms are required: <P/> name")
    }
    else {
        db.ref('/teams/'+name).remove()
        stuff += '<P/>OK removed team: '+name
        return res.status(200).send(stuff)
    }
})


exports.addPeopleToTeam = functions.https.onRequest((req, res) => {

    // allow for these req parms
    //      node
    var team = req.query.team
    var emailParm = req.query.email
    var emailForm = req.body.email
    var hasEmail = emailParm || emailForm
    var email = emailParm
    if(!email) {
        email = emailForm
    }

    var stuff = ''


    if(!team || !email) {
        return res.status(200).send(stuff+"<P/>These request parms are required: <P/> team<P/> email (comma-sep list)<P/>req.body = "+JSON.stringify(req.body))
    }
    else if(!email) {
        return res.status(200).send(stuff+"<P/>These request parms are required: <P/> team<P/> email (comma-sep list)<P/>req.body = "+JSON.stringify(req.body))
    }
    else {
        var emails = email.split('\n')
        addPeopleByEmail(team, emails, stuff, function(info) {

            return showTheWholePage(team).then(html => {
                return res.status(200).send(html)
            })
        } )

    }
})


var addPeopleByEmail = function(team, emails, stuff, callback) {
    var teamref = db.ref('teams/'+team+'/members')
    var userref = db.ref('users')
    var log = db.ref('logs')
    var userCount = emails.length
    var iter = 0
    stuff += '<P/>Try adding these people: '+emails
    try {
        emails.forEach(function(addrUntrimmed) {
            var addr = addrUntrimmed.trim()
            stuff += '<P/>in loop:  Try adding this person: '+addr
            userref.orderByChild('email').equalTo(addr).once('value').then(snapshot => {
                snapshot.forEach(function(user) {
                    var name = user.val().name
                    var email = user.val().email
                    // TODO do this with a trigger
                    teamref.child(user.key).set({name: name, email: email})
                    //userref.child(user.key).child('teams').child(team).set({team_name: team})
                    stuff += '<P/>OK added '+name+' ('+email+') to /teams/'+team+'/members'
                    stuff += '<P/>OK added team: '+team+' to '+name+'\'s list of teams'
                })

                ++iter
                if(iter == userCount) {
                    callback(stuff)
                }
            })
        })
    }
    catch(e) {
        stuff += "<P/>=================================================================="
        stuff += "<P/>ERROR "+e
        stuff += "<P/>=================================================================="

        callback(stuff)
    }
}


exports.removePeopleFromTeam = functions.https.onRequest((req, res) => {

    // allow for these req parms
    //      node
    var team = req.query.team
    var email = req.query.email

    var stuff = ''

    if(!team || !email) {
        return res.status(200).send(stuff+"<P/>These request parms are required: <P/> team<P/> email (comma-sep list)")
    }
    else {
        var teamref = db.ref('teams/'+team+'/members')
        var userref = db.ref('users')
        return teamref.orderByChild('email').equalTo(email).once('value').then(snapshot => {
            snapshot.forEach(function(child) {
                var userId = child.key
                teamref.child(userId).remove()
            })
        })
        .then(() => {
            return showTheWholePage(team).then(html => {
                return res.status(200).send(html)
            })
        })
        .catch(function(e) {
            res.status(200).send('<P/>ERROR: '+e)
        })
    }
})


// When a user is added as a member of a team, add this team to the user's list of teams also
// That way, the new team will show up in SwitchTeamsVC
exports.updateTeamListUnderUsers = functions.database.ref('/teams/{team_name}/members/{uid}').onWrite(event => {

    var uid = event.params.uid
    var team_name = event.params.team_name

    // These conditions make sure that we don't have this trigger, and the one below, getting into
    // an infinite loop.  The first condition makes sure that the person we're dealing
    // with was either inserted or deleted, but not just updated.
    var memberAddedUnderTeamNode = event.data.exists() && !event.data.previous.exists()
    var memberDeletedUnderTeamNode = !event.data.exists() && event.data.previous.exists()

    if(memberAddedUnderTeamNode) {
        /*return*/ event.data.adminRef.root.child('/users/'+uid+'/teams/'+team_name).set({team_name: team_name, date_added: date.asCentralTime()})
        var logmsg = 'Set /users/'+uid+'/teams/'+team_name+' = {team_name: '+team_name+'}'
        return event.data.adminRef.root.child('/templog').push().set({action: logmsg, date: date.asCentralTime()})
    }
    else if(memberDeletedUnderTeamNode) {
        /*return*/ event.data.adminRef.root.child('/users/'+uid+'/teams/'+team_name).remove()
        var logmsg = 'Removed /users/'+uid+'/teams/'+team_name
        return event.data.adminRef.root.child('/templog').push().set({action: logmsg, date: date.asCentralTime()})
    }
})



exports.updateMemberListUnderTeams = functions.database.ref('/users/{uid}/teams/{team_name}').onWrite(event => {

    var uid = event.params.uid
    var team_name = event.params.team_name

    // These conditions make sure that we don't have this trigger, and the one below, getting into
    // an infinite loop.  The first condition makes sure that the team we're dealing
    // with was either inserted or deleted, but not just updated.
    var teamAddedUnderUserNode = event.data.exists() && !event.data.previous.exists()
    var teamDeletedUnderUserNode = !event.data.exists() && event.data.previous.exists()

    if(teamAddedUnderUserNode) {
        return event.data.adminRef.root.child('/users/'+uid).once('value').then(snapshot => {
            var name = snapshot.val().name
            var email = snapshot.val().email
            event.data.adminRef.root.child('/teams/'+team_name+'/members/'+uid).set({name: name, email: email, date_added: date.asCentralTime()})
            var logmsg = 'Set /teams/'+team_name+'/members/'+uid+' = {name: '+name+', email: '+email+'}'
            event.data.adminRef.root.child('/templog').push().set({action: logmsg, date: date.asCentralTime()})
        })
    }
    else if(teamDeletedUnderUserNode) {
        event.data.adminRef.root.child('/teams/'+team_name+'/members/'+uid).remove()
        var logmsg = 'Removed /teams/'+team_name+'/members/'+uid
        return event.data.adminRef.root.child('/templog').push().set({action: logmsg, date: date.asCentralTime()})
    }
})


// When a user is assigned to a team, we should check to see if the user has a "current_team" node yet
// Because the user always needs to have a current_team designated if at all possible.
exports.setCurrentTeam = functions.database.ref('/users/{uid}/teams/{team_name}').onWrite( event => {

    var uid = event.params.uid
    var team_name = event.params.team_name

    var teamAdded = event.data.exists()
    var teamDeleted = !event.data.exists() && event.data.previous.exists()

    if(teamAdded) {
        //event.data.adminRef.root.child('temp_log').push().set({msg: "event.data.exists()"})
        // query to see if we have a current_team yet
        // We will only set current_team to the new team if there is no current_team node yet
        var currentTeamRef = event.data.adminRef.root.child('/users/'+uid+'/current_team')
        return currentTeamRef.once('value').then(snapshot => {
            if(!snapshot.val()) {
                // just for debugging...
                //event.data.adminRef.root.child('temp_log').push().set({msg: "snapshot.val() does not exist"})
                var currentTeam = {}
                currentTeam[team_name] = {team_name: team_name}
                currentTeamRef.set(currentTeam)
            }
        })
    }
    else if(teamDeleted) {
        // means the node was deleted - make sure it wasn't the team marked as the current_team
        // If it's the same team as the current_team, then delete the current_team node too
        // which means we probably need a trigger on current_team to detect when it's deleted so
        // we can go get another one.
        //event.data.adminRef.root.child('temp_log').push().set({msg: "event.data.exists() does not exist"})
        var currentTeamRef = event.data.adminRef.root.child('/users/'+uid+'/current_team/'+team_name)
        return currentTeamRef.once('value').then(snapshot => {
            if(snapshot.val()) {
                currentTeamRef.remove()
            }
        })
    }

});


// only reset the current_team when the current_team node has been deleted
exports.resetCurrentTeam = functions.database.ref('/users/{uid}/current_team').onWrite(event => {
    var uid = event.params.uid
    var currentTeamDeleted = !event.data.exists() && event.data.previous.exists()
    if(currentTeamDeleted) {
        // go find the first team in the list and make that the new current_team
        return event.data.adminRef.root.child('/users/'+uid+'/teams').limitToFirst(1).once('value').then(snapshot => {
//            var otherTeamsExist = snapshot.val()
//            if(otherTeamsExist) {
                var team_name
                snapshot.forEach(function(child) {
                    team_name = child.key
                })
                if(team_name) {
                    var currentTeam = {}
                    currentTeam[team_name] = {team_name: team_name}
                    event.data.adminRef.root.child('/users/'+uid+'/current_team').set(currentTeam)
                }
//            }
        })
    }
    else return false;
})


// NOTE: This will be obsolete once TP is talking to CB
exports.teamlist = functions.https.onRequest((req, res) => {
    return db.ref('teams').once('value').then(snapshot => {
        var team_names = {}
        snapshot.forEach(function(child) {
            var key = db.ref('team_list').push().getKey()
            team_names['team_list/'+key+'/team_name'] = child.key
        })
        return db.ref('/').update(team_names).then(() => {
            return res.status(200).send('go check /team_list')
        })
    })
})


// NOTE: This will be obsolete once TP is talking to CB
// when a team in created in TelePatriot, add that team name under /team_list also
// SEE:  function createTeam
exports.addToTeamList = functions.database.ref('teams/{team_name}').onCreate(event => {
    return db.ref('team_list').push().set({team_name: event.params.team_name})
})

// NOTE: This will be obsolete once TP is talking to CB
// the opposite of addToTeamList
exports.removeTeamFromList = functions.database.ref('teams/{team_name}').onDelete(event => {
    return db.ref('team_list').orderByChild('team_name').equalTo(event.params.team_name).once('value').then(snapshot => {
        snapshot.forEach(function(child) { child.ref.remove() })
    })
})



var stripSpecialChars = function(str) {
    //special chars are . # $ [ ] / \ " '
    str = str.replace(/[.#$\[\]\/\\"']/g, '');
    return str
}


