'use strict';

const functions = require('firebase-functions')
const admin = require('firebase-admin')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

var menu = function() {
    var menu = '<P/><a href="/manageTeams">View All Teams</a>'
    menu += '<P/><a href="/createTeam">Create Team</a>'
    menu += '<P/><hr/>'
    return menu
}


var table = function(rows) {
    var html = '<table width="100%">'
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

var cell = function(data, colspan) {
    return '<td valign="top" colspan="'+colspan+'">' + data + '</td>'
}

var form = function(url, buttonHtml, fieldHtml) {
    return '<form method="post" action="'+url+'">'+buttonHtml+fieldHtml+'</form>'
}

var submitButton = function(text) {
    return '<input type="submit" value="'+text+'"/>'
}

var fieldHtml = function(name) {
    return '<input type="text" name="'+name+'"/>'
}


exports.manageTeams = functions.https.onRequest((req, res) => {

    var stuff = menu()

    db.ref(`teams`).once('value').then(snapshot => {
        var rows = []
        snapshot.forEach(function(child) {
            var team_name = cell(child.val().team_name, 1)
            var view_members = cell('<a href="/viewMembers?team='+child.val().team_name+'">View Members</a>', 1)
            //var deleteTeam = cell('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <a href="/deleteTeam?name='+child.val().team_name+'">!!! Delete Team !!!</a>', 1)
            var tr = row([team_name, view_members/*, deleteTeam*/])
            rows.push(tr)
        })
        var tbl = table(rows)
        return res.status(200).send(stuff+tbl)
    })

})


exports.viewMembers = functions.https.onRequest((req, res) => {

    var team_name = req.query.team

    var stuff = menu()

    return listMembers(team_name).then(html => {
        return res.status(200).send(html)
    })
})


var listMembers = function(team_name) {

    var stuff = menu()

    return db.ref(`teams`).child(team_name).child(`members`).once('value').then(snapshot => {
        var rows = []
        var header = row(cell(team_name + ' - Members', 1))
        rows.push(header)
        var field = fieldHtml('copyteam')
        var button = submitButton('Copy '+team_name)
        var frm = form('/copyTeam?team='+team_name, button, field)
        var cll = cell(frm, 1)
        rows.push(row([cll]))
        var rowsInner = []
        snapshot.forEach(function(child) {
            var deleteLink = cell('<a href="/removePeopleFromTeam?team='+team_name+'&email='+child.val().email+'">Remove</a>', 1)
            var member = cell(child.val().name, 1)
            var email = cell(child.val().email, 1)
            var tr = row([deleteLink, member, email])
            rowsInner.push(tr)
        })
        var left = cell(table(rowsInner), 1)
        var right = cell('<form method="post" action="/addPeopleToTeam?team='+team_name+'"><textarea rows="20" cols="40" name="email" placeholder="Enter one email address\nper line"></textarea><P/><input type="submit" value="Add People"></form>', 1)
        var rowA = row([left, right])
        rows.push(rowA)

        var html = table(rows)
        return stuff+html
    })
}


exports.copyTeam = functions.https.onRequest((req, res) => {
    var team_name = req.query.team
    var new_team = req.body.copyteam

    return db.ref(`/teams/${team_name}`).once('value').then(snapshot => {
        var copy = snapshot.val()
        copy.team_name = new_team
        db.ref(`/teams/${new_team}`).set(copy)
    })
    .then(() => {
        return listMembers(new_team).then(html => {
            return res.status(200).send(html)
        })
    })

})


exports.createTeam = functions.https.onRequest((req, res) => {

    var stuff = menu()
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

    var stuff = menu()

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

    var stuff = menu()


    if(!team || !email) {
        return res.status(200).send(stuff+"<P/>These request parms are required: <P/> team<P/> email (comma-sep list)<P/>req.body = "+JSON.stringify(req.body))
    }
    else if(!email) {
        return res.status(200).send(stuff+"<P/>These request parms are required: <P/> team<P/> email (comma-sep list)<P/>req.body = "+JSON.stringify(req.body))
    }
    else {
        var emails = email.split('\n')
        addPeopleByEmail(team, emails, stuff, function(info) {
            //res.status(200).send(info)

            return listMembers(team).then(html => {
                return res.status(200).send(html)
            })
        } )

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
        emails.forEach(function(addrUntrimmed) {
            var addr = addrUntrimmed.trim()
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


// TODO Needs to be a trigger that delete users and teams from each others nodes
// Don't tie them together here.  The problem with this approach is that if you manually
// delete a user-team association in one node, without a trigger, you have just
// compromised the data integrity
exports.removePeopleFromTeam = functions.https.onRequest((req, res) => {

    // allow for these req parms
    //      node
    var team = req.query.team
    var email = req.query.email

    var stuff = menu()

    if(!team || !email) {
        return res.status(200).send(stuff+"<P/>These request parms are required: <P/> team<P/> email (comma-sep list)")
    }
    else {
        var emails = email.split('\n')
        var teamref = db.ref(`teams/${team}/members`)
        var ref = db.ref(`users`)
        var log = db.ref(`logs`)
        var userCount = emails.length
        var iter = 0
        emails.forEach(function(addrUntrimmed) {
            var addr = addrUntrimmed.trim()
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
                var currentTeam = {}
                currentTeam[team_name] = {team_name: team_name}
                event.data.adminRef.root.child(`/users/${uid}/current_team`).set(currentTeam)
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
        res.status(200).send(menu()+stuff)
    })
    .catch(function(e) {
        res.status(200).send(menu()+stuff+'<P/>ERROR: '+e)
    })

})



