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


// missions or mission_items depending on your "node" value
exports.queryActive = functions.https.onRequest((req, res) => {
    return queryActiveStatus(req, res, true)
})


// missions or mission_items depending on your "node" value
exports.queryInactive = functions.https.onRequest((req, res) => {
    return queryActiveStatus(req, res, false)
})


var queryActiveStatus = function(req, res, bool) {

    // allow for these req parms
    //      node

    var node = req.query.node
    if(!node) {
        return res.status(200).send("This request parm is required: <P/> node - a path to a node in the tree<P/> Node can either point to missions or mission_items")
    }
    else {
        return db.ref(`${node}`).orderByChild("active").equalTo(bool).once('value').then(snapshot => {
            var childCount = snapshot.numChildren()
            var stuff = ''
            stuff += '<P/>snapshot.numChildren() = '+ childCount
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

}


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
    var where = req.query.where
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


// example: for deleting all the group_number nodes under mission_items
exports.deleteAttributes = functions.https.onRequest((req, res) => {

    var node = req.query.node
    var attribute = req.query.attribute

    var ok = node && attribute

    if(!ok) {
        return res.status(200).send("Request parms needed for this function: <P/> node <P/> attribute")
    }
    else {
        // ok, normal operation
        var mref = db.ref(`${node}`)
        return mref.once('value').then(snapshot => {
            var childCount = snapshot.numChildren()
            var deletedCount = 0
            snapshot.forEach(function (child) {
                mref.child(child.key).child(attribute).remove()
                ++deletedCount
            })

            res.status(200).send("Deleted: "+deletedCount+" of the "+childCount+" "+attribute+" nodes of "+node)
        })

    }

})


// example: for adding group_number attribute to all mission_items in prod database
exports.addGroupNumbers = functions.https.onRequest((req, res) => {

    var node = req.query.node
    var attribute = "group_number"
    var modulus = 5

    var ok = node && attribute

    if(!ok) {
        return res.status(200).send("Request parms needed for this function: <P/> node")
    }
    else {
        // ok, normal operation
        var mref = db.ref(`${node}`)
        return mref.once('value').then(snapshot => {
            var childCount = snapshot.numChildren()
            var added = 0
            snapshot.forEach(function (child) {
                var group_number = added % modulus
                mref.child(child.key).child(attribute).set(group_number)
                ++added
            })

            res.status(200).send("Added: "+added+" of the "+childCount+" "+attribute+" nodes of "+node)
        })

    }

})


// to make sure that migrateMissions works, we have to test on the dev db first,
// which means we have to prepare the dev db by making it look like the prod db...
exports.prepareDevDatabaseToTestMigration = functions.https.onRequest((req, res) => {

    // make backup:  copy /teams/The Cavalry/master_missions to /teams/The Cavalry/master_missions_bak

    // make backup:  copy /teams/The Cavalry/missions to /teams/The Cavalry/missions_bak

    // make backup:  copy /teams/The Cavalry/mission_items to /teams/The Cavalry/mission_items_bak

    // copy /teams/The Cavalry/missions to /missions

    // copy all /teams/The Cavalry/missions/{mission_id}/mission_items to /mission_items

    // make some /mission_items active and other inactive

    // delete group_number from all /mission_items

    // delete mark_for_merge from all /mission_items

    // delete number_of_missions_in_master_mission from all /mission_items

    // ************   WHAT ELSE ??  *************************
})



exports.migrateMissions = functions.https.onRequest((req, res) => {

    // make backup:  copy /missions to /missions_bak

    // make backup:  copy /mission_items to /mission_items_bak

    // copy /missions to /teams/The Cavalry/missions

    // delete mission_items under each of the /teams/The Cavalry/missions

    // copy mission_items from /mission_items to the right mission...  /teams/The Cavalry/missions/{mission_id}/mission_items

    // copy active mission_items from /mission_items to /teams/The Cavalry/mission_items

    // WHAT ABOUT group_number AND mark_for_merge ????


    // ************   WHAT ELSE ??  *************************
})



