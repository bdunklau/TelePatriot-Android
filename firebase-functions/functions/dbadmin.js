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

    var status = ''

    // make backup:  copy /teams/The Cavalry/master_missions to /teams/The Cavalry/master_missions_bak
    return db.ref(`/teams/The Cavalry/master_missions`).once('value').then(snapshot => {
        db.ref(`/teams/The Cavalry/master_missions_bak`).set(snapshot.val())
        status += '<P/>OK copied /teams/The Cavalry/master_missions to /teams/The Cavalry/master_missions_bak'
    })
    .then(() => {
        // make backup:  copy /teams/The Cavalry/missions to /teams/The Cavalry/missions_bak
        return db.ref(`/teams/The Cavalry/missions`).once('value').then(s2 => {
            db.ref(`/teams/The Cavalry/missions_bak`).set(s2.val())
            status += '<P/>OK copied /teams/The Cavalry/missions to /teams/The Cavalry/missions_bak'
        })
    })
    .then(() => {
        // make backup:  copy /teams/The Cavalry/mission_items to /teams/The Cavalry/mission_items_bak
        return db.ref(`/teams/The Cavalry/mission_items`).once('value').then(snapshot => {
            db.ref(`/teams/The Cavalry/mission_items_bak`).set(snapshot.val())
            status += '<P/>OK copied /teams/The Cavalry/mission_items to /teams/The Cavalry/mission_items_bak'
        })
    })
    .then(() => {
        // copy /teams/The Cavalry/missions to /missions
        return db.ref(`/teams/The Cavalry/missions`).once('value').then(s2 => {
            db.ref(`/missions`).set(s2.val())
            status += '<P/>OK copied /teams/The Cavalry/missions to /missions'
        })
        .then(() => {
            return db.ref(`/missions`).once('value').then(s2 => {
                s2.forEach(function (missionNode) {
                    db.ref(`/missions`).child(missionNode.key).child(`mission_items`).once('value').then(snap => {
                        snap.forEach(function (missionItemNode) {
                            db.ref(`/mission_items`).child(missionItemNode.key).set(missionItemNode.val())
                            status += '<P/>OK copied /missions/'+missionNode.key+'/mission_items/'+missionItemNode.key+' to /mission_items/'+missionItemNode.key
                        })
                    })
                })
            })
            .then(() => {
                // delete the mission_items node under each mission in /missions because that's how prod is now
                return db.ref(`/missions`).once('value').then(snap => {
                    snap.forEach(function (child) {
                        db.ref(`/missions`).child(child.key).child(`mission_items`).remove()
                        status += '<P/>OK delete /missions/'+child.key+'/mission_items'
                    })
                })
            })

            /************
            return s2.forEach(function (missionNode) {
                db.ref(`/teams/The Cavalry/missions`).child(missionNode.key).child(`mission_items`).once('value').then(s3 => {
                    if(s3.numChildren() < 2) {
                        status += '<P/>NOT GOOD - under /teams/The Cavalry/missions/'+missionNode.key+'/mission_items only '+s3.numChildren()+' nodes found'
                    }
                    s3.forEach(function (missionItemNode) {
                        db.ref(`/mission_items`).child(missionItemNode.key).set(missionItemNode.val())
                        status += '<P/>OK copied /teams/The Cavalry/missions/'+missionNode.key+'/mission_items/'+missionItemNode.key+' to /mission_items/'+missionItemNode.key
                    })
                })
            })
            *********/

        })

    })
    .then(() => {
        // delete /teams/The Cavalry/missions because prod does not have this
        status += '<P/>OK deleted /teams/The Cavalry/missions'
        return db.ref(`/teams/The Cavalry/missions`).remove()
    })
    .then(() => {
        // delete /teams/The Cavalry/mission_items because prod does not have this
        status += '<P/>OK deleted /teams/The Cavalry/mission_items'
        return db.ref(`/teams/The Cavalry/mission_items`).remove()
    })
    .then(() => {
        // make some /mission_items active and others inactive
        // what missions will we make active? mission_name=TP Test 1, TP Test 2
        return db.ref(`/mission_items`).orderByChild(`mission_name`).equalTo("TP Test 1").once('value').then(s2 => {
            s2.forEach(function (child) {
                db.ref(`/mission_items`).child(child.key).child('active_and_accomplised').set('true_new')
                status += '<P/>OK set /mission_items/'+child.key+'/active_and_accomplised = true_new'
            })
        })
        .then(() => {
            db.ref(`/mission_items`).orderByChild(`mission_name`).equalTo("TP Test 2").once('value').then(s2 => {
                s2.forEach(function (child) {
                    db.ref(`/mission_items`).child(child.key).child('active_and_accomplised').set('true_new')
                    status += '<P/>OK set /mission_items/'+child.key+'/active_and_accomplised = true_new'
                })
            })
        })
    })
    .then(() => {
        // delete group_number from all /mission_items
        // delete mark_for_merge from all /mission_items
        // delete number_of_missions_in_master_mission from all /mission_items
        return db.ref(`/mission_items`).once('value').then(s2 => {
            s2.forEach(function (child) {
                db.ref(`/mission_items`).child(child.key).child('group_number').remove()
                db.ref(`/mission_items`).child(child.key).child('mark_for_merge').remove()
                db.ref(`/mission_items`).child(child.key).child('number_of_missions_in_master_mission').remove()
                status += '<P/>OK deleted /mission_items/'+child.key+'/group_number, /mark_for_merge, and /number_of_missions_in_master_mission'
            })
        })
    })
    /*********
        **********/
    .then(() => {
        res.status(200).send(status)
    })






    // ************   WHAT ELSE ??  *************************
})



exports.migrateMissions = functions.https.onRequest((req, res) => {

    // make backup:  copy /missions to /missions_bak

    // make backup:  copy /mission_items to /mission_items_bak

    // copy /missions to /teams/The Cavalry/missions

    // delete mission_items under each of the /teams/The Cavalry/missions - because of trigger that create the mission_items nodes

    // copy mission_items from /mission_items to the right mission...  /teams/The Cavalry/missions/{mission_id}/mission_items

    // copy active mission_items from /mission_items to /teams/The Cavalry/mission_items

    // WHAT ABOUT group_number AND mark_for_merge ????


    // ************   WHAT ELSE ??  *************************
})



