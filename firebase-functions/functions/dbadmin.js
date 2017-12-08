'use strict';

const functions = require('firebase-functions')
const admin = require('firebase-admin')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

exports.insert = functions.https.onRequest((req, res) => {

    // allow for these req parms
    //      node
    //      attribute
    //      value
    var node = req.query.node
    var attribute = req.query.attribute
    var value = req.query.value


    return db.ref(`${node}`).set({attribute: value}).then(() => {
        db.ref(`${node}/${attribute}`).once('value').then(snapshot => {
            var stuff = 'OK<P/>JSON.stringify(snapshot) = '+JSON.stringify(snapshot)
            res.status(200).send(stuff)
        })
    })

})


exports.update = functions.https.onRequest((req, res) => {

    // allow for these req parms
    //      node
    //      attribute
    //      value
    var node = req.query.node
    var attribute = req.query.attribute
    var value = req.query.value


    return db.ref(`${node}`).child(attribute).set(value).then(() => {
        db.ref(`${node}`).once('value').then(snapshot => {
            var stuff = ''
            stuff += '<P/>snapshot = '+ snapshot
            stuff += '<P/>snapshot.val() = '+ JSON.stringify(snapshot.val())
            console.log("exports.query: snapshot = ", snapshot)
            console.log("exports.query: snapshot.val() = ", snapshot.val()) // is this...  {
            stuff += '<P/>children of '+node+'...'
            snapshot.forEach(function (child) { // FYI, child is a DataSnapshot
                var key = child.key
                var val = JSON.stringify(child.val())
                stuff += '<P/>'+ key +': '+val
            })
            res.status(200).send(stuff)
        })
    })

})


exports.query = functions.https.onRequest((req, res) => {

    // allow for these req parms
    //      node

    var node = req.query.node


    db.ref(`${node}`).once('value').then(snapshot => {
        var stuff = ''
        stuff += '<P/>snapshot = '+ snapshot
        stuff += '<P/>snapshot.val() = '+ JSON.stringify(snapshot.val())
        console.log("exports.query: snapshot = ", snapshot)
        console.log("exports.query: snapshot.val() = ", snapshot.val()) // is this...  {
        stuff += '<P/>children of '+node+'...'
        snapshot.forEach(function (child) { // FYI, child is a DataSnapshot
            var key = child.key
            var val = JSON.stringify(child.val())
            stuff += '<P/>'+ key +': '+val
        })
        res.status(200).send(stuff)
    })

})