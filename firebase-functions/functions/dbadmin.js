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


    if(!node || !attribute || !value) {
        return res.status(200).send("These request parms are required: <P/> node, attribute, value")
    }
    else {

        return db.ref(`${node}`).set({attribute: value}).then(() => {
            db.ref(`${node}/${attribute}`).once('value').then(snapshot => {
                var stuff = 'OK<P/>JSON.stringify(snapshot) = '+JSON.stringify(snapshot)
                res.status(200).send(stuff)
            })
        })
    }

})


exports.update = functions.https.onRequest((req, res) => {

    // allow for these req parms
    //      node
    //      attribute
    //      value
    var node = req.query.node
    var attribute = req.query.attribute
    var value = req.query.value

    if(!node || !attribute || !value) {
        return res.status(200).send("These request parms are required: <P/> node, attribute, value")
    }
    else {

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
    }

})


exports.query = functions.https.onRequest((req, res) => {

    // allow for these req parms
    //      node

    var node = req.query.node
    if(!node) {
        return res.status(200).send("This request parm is required: <P/> node - a path to a node in the tree")
    }
    else {
        return db.ref(`${node}`).once('value').then(snapshot => {
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
    }

})


exports.copy = functions.https.onRequest((req, res) => {

    // allow for these req parms
    //      from
    //      to

    var from = req.query.from
    var to = req.query.to
    if(!to || !from) {
        return res.status(200).send("These request parms are required: <P/> to, from - both are nodes in the tree")
    }
    else {
        return db.ref(`${from}`).once('value').then(snapshot => {
            db.ref(`${to}`).set(snapshot.val())
            res.status(200).send("no idea")
        })
    }

})


exports.deleteNodes = functions.https.onRequest((req, res) => {

    // allow for these req parms
    //      from
    //      to

    var node = req.query.node
    var lengthGreaterThan = req.query.lengthGreaterThan
    var lengthLessThan = req.query.lengthLessThan
    var ok = node && (lengthGreaterThan || lengthLessThan)

    if(!ok) {
        return res.status(200).send("Request parms needed for this function: <P/> node (required) <P/> lengthGreaterThan -OR- lengthLessThan")
    }
    else {
        // ok, normal operation
        var mref = db.ref(`${node}`)
        return mref.once('value').then(snapshot => {
            var childCount = snapshot.numChildren()
            var deletedCount = 0
            snapshot.forEach(function (child) {
                if(lengthGreaterThan && child.key.length > lengthGreaterThan) {
                    mref.child(child.key).remove()
                    ++deletedCount
                }
                else if(lengthLessThan && child.key.length < lengthLessThan) {
                    mref.child(child.key).remove()
                    ++deletedCount
                }
            })

            res.status(200).send("Deleted: "+deletedCount+" of the "+childCount+" child nodes of "+node)
        })

    }


})