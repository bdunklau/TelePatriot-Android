'use strict';

const functions = require('firebase-functions')
const admin = require('firebase-admin')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

var menu = '<P/><a href="/createTeam">createTeam</a>'
menu += '<P/><a href="/deleteTeam">deleteTeam</a>'
menu += '<P/><a href="/addPeopleToTeam">addPeopleToTeam</a>'
menu += '<P/><a href="/removePeopleFromTeam">removePeopleFromTeam</a>'
menu += '<P/><hr/>'


exports.manageTeams = functions.https.onRequest((req, res) => {

    var stuff = menu
    return res.status(200).send(stuff)

})


exports.createTeam = functions.https.onRequest((req, res) => {

    var stuff = menu
    // allow for these req parms
    //      node
    var name = req.query.name


    if(!name) {
        return res.status(200).send(stuff+"<P/>These request parms are required: <P/> name")
    }
    else {
        db.ref(`/teams/${name}`).set({'stub': true})
        stuff += '<P/>OK created team: '+name
        return res.status(200).send(stuff)
    }

})


exports.deleteTeam = functions.https.onRequest((req, res) => {

    var stuff = menu
    // allow for these req parms
    //      node
    var name = req.query.name


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

    var stuff = menu
    // allow for these req parms
    //      node
    var team = req.query.team
    var email = req.query.email


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

    }
})


exports.removePeopleFromTeam = functions.https.onRequest((req, res) => {

    var stuff = menu
    // allow for these req parms
    //      node
    var team = req.query.team
    var email = req.query.email


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
                    stuff += '<P/>OK removed '+name+' ('+email+') from /teams/'+team+'/members'
                    stuff += '<P/>OK remove team: '+team+' from '+name+'\'s list of teams'
                })

                ++iter
                if(iter == userCount) {
                    res.status(200).send(stuff)
                }
            })
        })

    }
})



