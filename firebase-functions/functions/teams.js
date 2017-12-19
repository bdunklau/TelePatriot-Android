'use strict';

const functions = require('firebase-functions')
const admin = require('firebase-admin')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

var menu = function(team_name) {
    if(!team_name || team_name == '') {
        var menu = '<P/><a href="/manageTeams">View All Teams</a>'
        menu += '<P/><a href="/createTeam">Create Team</a>'
        menu += '<P/><hr/>'
        return menu
    }
    else {
        var menu = '<P/><a href="/manageTeams">View All Teams</a>'
        menu += '<P/><a href="/createTeam">Create Team</a>'
        menu += '<P/><hr/>'
        return menu
    }
}


var table = function(rows) {
    var html = '<table>'
    for(var i=0; i < rows.length; i++) {
        html += rows[i]
    }
    return html += '</table>'
}

var row = function(cells) {
    var html = '<tr>'
    for(var i=0; i < cells.length; i++) {
        html += cells[i]
    }
    return html += '</tr>'
}

var cell = function(data) {
    return '<td>' + data + '</td>'
}


exports.manageTeams = functions.https.onRequest((req, res) => {

    var stuff = menu('')

    db.ref(`teams`).once('value').then(snapshot => {
        var rows = []
        snapshot.forEach(function(child) {
            var team_name = cell(child.val().team_name)
            var view_members = cell('<a href="/viewMembers?team='+child.val().team_name+'">View Members</a>')
            //var deleteTeam = cell('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <a href="/deleteTeam?name='+child.val().team_name+'">!!! Delete Team !!!</a>')
            var tr = row([team_name, view_members/*, deleteTeam*/])
            rows.push(tr)
        })
        var tbl = table(rows)
        return res.status(200).send(stuff+tbl)
    })

})


exports.viewMembers = functions.https.onRequest((req, res) => {

    var team_name = req.query.team

    var stuff = menu(team_name)

    return listMembers(team_name).then(html => {
        return res.status(200).send(html)
    })
})


var listMembers = function(team_name) {

    var stuff = menu(team_name)

    return db.ref(`teams`).child(team_name).child(`members`).once('value').then(snapshot => {
        var rows = []
        var header = row(cell(team_name + ' - Members'))
        rows.push(header)
        snapshot.forEach(function(child) {
            var deleteLink = cell('<a href="/removePeopleFromTeam?team='+team_name+'&email='+child.val().email+'">Remove</a>')
            var member = cell(child.val().name)
            var email = cell(child.val().email)
            var tr = row([deleteLink, member, email])
            rows.push(tr)
        })
        var html = table(rows)
        html += '<form method="post" action="/addPeopleToTeam?team='+team_name+'"><input type="text" name="email" size="200"><P/><input type="submit" value="Add People"></form>'
        return stuff+html
    })
}


exports.createTeam = functions.https.onRequest((req, res) => {

    var stuff = menu('')
    // allow for these req parms
    //      node
    var name = req.query.name


    if(!name) {
        return res.status(200).send(stuff+"<P/>These request parms are required: <P/> name")
    }
    else {
        db.ref(`/teams/${name}`).set({team_name: name})
        stuff += '<P/>OK created team: '+name
        return res.status(200).send(stuff)
    }

})


exports.deleteTeam = functions.https.onRequest((req, res) => {

    // allow for these req parms
    //      node
    var name = req.query.name

    var stuff = menu(name)

    if(!name) {
        return res.status(200).send(stuff+"<P/>These request parms are required: <P/> name")
    }
    else {
        db.ref(`/teams/${name}`).remove()
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

    var stuff = menu(team)


    if(!team || !email) {
        return res.status(200).send(stuff+"<P/>These request parms are required: <P/> team<P/> email (comma-sep list)<P/>req.body = "+JSON.stringify(req.body))
    }
    else if(!email) {
        return res.status(200).send(stuff+"<P/>These request parms are required: <P/> team<P/> email (comma-sep list)<P/>req.body = "+JSON.stringify(req.body))
    }
    else {
        var emails = email.split(',')
        addPeopleByEmail(team, emails, stuff, function(info) {
            //res.status(200).send(info)

            return listMembers(team).then(html => {
                return res.status(200).send(html)
            })
        } )
        /************
        var teamref = db.ref(`teams/${team}/members`)
        var ref = db.ref(`users`)
        var log = db.ref(`logs`)
        var userCount = emails.length
        var iter = 0
        emails.forEach(function(addr) {
            ref.orderByChild('email').equalTo(addr).once('value').then(snapshot => {
                snapshot.forEach(function(user) {
                    var name = user.val().name
                    var email = user.val().email
                    teamref.child(user.key).set({name: name, email: email})
                    ref.child(user.key).child('teams').child(team).set(true)
                    stuff += '<P/>OK added '+name+' ('+email+') to /teams/'+team+'/members'
                    stuff += '<P/>OK added team: '+team+' to '+name+'\'s list of teams'
                })

                ++iter
                if(iter == userCount) {
                    res.status(200).send(stuff)
                }
            })
        })
        ************/

    }
})


var addPeopleByEmail = function(team, emails, stuff, callback) {
    var teamref = db.ref(`teams/${team}/members`)
    var ref = db.ref(`users`)
    var log = db.ref(`logs`)
    var userCount = emails.length
    var iter = 0
    stuff += '<P/>Try adding these people: '+emails
    try {
        emails.forEach(function(addr) {
            stuff += '<P/>in loop:  Try adding this person: '+addr
            ref.orderByChild('email').equalTo(addr).once('value').then(snapshot => {
                snapshot.forEach(function(user) {
                    var name = user.val().name
                    var email = user.val().email
                    teamref.child(user.key).set({name: name, email: email})
                    ref.child(user.key).child('teams').child(team).set({team_name: team})
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

    var stuff = menu(team)

    if(!team || !email) {
        return res.status(200).send(stuff+"<P/>These request parms are required: <P/> team<P/> email (comma-sep list)")
    }
    else {
        var emails = email.split(',')
        var teamref = db.ref(`teams/${team}/members`)
        var ref = db.ref(`users`)
        var log = db.ref(`logs`)
        var userCount = emails.length
        var iter = 0
        emails.forEach(function(addr) {
            ref.orderByChild('email').equalTo(addr).once('value').then(snapshot => {
                snapshot.forEach(function(user) {
                    var name = user.val().name
                    var email = user.val().email
                    teamref.child(user.key).remove()
                    ref.child(user.key).child('teams').child(team).remove()
                    stuff += '<P/>OK removed '+name+' ('+email+') from /teams/'+team+'/members' // not displaying this anymore
                    stuff += '<P/>OK remove team: '+team+' from '+name+'\'s list of teams'      // not displaying this anymore
                })

                ++iter
                if(iter == userCount) {
                    //res.status(200).send(stuff)

                    return listMembers(team).then(html => {
                        return res.status(200).send(html)
                    })
                }
            })
        })

    }
})


// When a user is added as a member of a team, add this team to the user's list of teams also
// That way, the new team will show up in SwitchTeamsVC
exports.syncWithUsersListOfTeams = functions.database.ref('/teams/{team_name}/members/{uid}').onWrite(event => {

    var uid = event.params.uid
    var team_name = event.params.team_name

    var teamAdded = event.data.exists()
    var teamDeleted = !event.data.exists() && event.data.previous.exists()

    if(teamAdded) {
        return event.data.adminRef.root.child(`/users/${uid}/teams/${team_name}`).setValue({team_name: team_name})
    }
    else if(teamDeleted) {
        return event.data.adminRef.root.child(`/users/${uid}/teams/${team_name}`).remove()
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
        //event.data.adminRef.root.child(`temp_log`).push().set({msg: "event.data.exists()"})
        // query to see if we have a current_team yet
        // We will only set current_team to the new team if there is no current_team node yet
        var currentTeamRef = event.data.adminRef.root.child(`/users/${uid}/current_team`)
        return currentTeamRef.once('value').then(snapshot => {
            if(!snapshot.val()) {
                // just for debugging...
                //event.data.adminRef.root.child(`temp_log`).push().set({msg: "snapshot.val() does not exist"})
                currentTeamRef.set({team_name: team_name})
            }
        })
    }
    else if(teamDeleted) {
        // means the node was deleted - make sure it wasn't the team marked as the current_team
        // If it's the same team as the current_team, then delete the current_team node too
        // which means we probably need a trigger on current_team to detect when it's deleted so
        // we can go get another one.
        //event.data.adminRef.root.child(`temp_log`).push().set({msg: "event.data.exists() does not exist"})
        var currentTeamRef = event.data.adminRef.root.child(`/users/${uid}/current_team`)
        return currentTeamRef.once('value').then(snapshot => {
            if(snapshot.val() && snapshot.val().team_name == team_name) {
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
        return event.data.adminRef.root.child(`/users/${uid}/teams`).limitToFirst(1).once('value').then(snapshot => {
            var otherTeamsExist = snapshot.val()
            if(otherTeamsExist) {
                event.data.adminRef.root.child(`/users/${uid}/current_team`).set(snapshot.val())
            }
        })
    }
    else return false;
})


// This is a throw-away/one-time use function
// for production, to put everyone in the Cavalry that is already a user
exports.backfillCavalry = functions.https.onRequest((req, res) => {
    var stuff = ''

    var team = "The Cavalry"
    var ref = db.ref(`users`)
    ref.once('value').then(snapshot => {
        snapshot.forEach(function(child /* a user */) {
            var email = child.val().email
            if(!email) {
                stuff += '<P/>Hmmm - this person has no email address: '+child.key+' '+JSON.stringify(child.val())
            }
            else {
                stuff += '<P/>try adding this person: child.val().email = '+email
                addPeopleByEmail(team, [email], stuff, function(info) { stuff += info })
            }
        })
    })
    .then(() => {
        res.status(200).send(menu+stuff)
    })
    .catch(function(e) {
        res.status(200).send(menu+stuff+'<P/>ERROR: '+e)
    })

})



