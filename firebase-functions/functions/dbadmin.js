'use strict';

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

// throw-away function
exports.checkUsers = functions.https.onRequest((req, res) => {
    return db.ref(`users`).once('value').then(snapshot => {
        var stuff = '<html><head></head><body><table border="1">'
        stuff += '<tr>'
        stuff += '<th>key</th>'
        stuff += '<th>name</th>'
        stuff += '<th>email</th>'
        stuff += '<th>roles</th>'
        stuff += '</tr>'

        snapshot.forEach(function(child) {
            var display = false
            if(!child.val().roles || child.val().roles.length == 0) {
                return
            }

            if(child.val().roles.Volunteer && child.val().roles.Volunteer == true) {
                display = true
            }

            if(child.val().roles.Director && child.val().roles.Director == true) {
                display = true
            }

            if(child.val().roles.Admin && child.val().roles.Admin == true) {
                display = true
            }

            /*****
            if(!display) {
                return
            }
            *****/


            stuff += '<tr>'
            stuff += '<td>'+child.key+'</td>'
            stuff += '<td>'+child.val().name+'</td>'
            stuff += '<td>'+child.val().email+'</td>'
            stuff += '<td>'

            stuff += '<table>'
            if(child.val().roles.Volunteer && child.val().roles.Volunteer == true) {
                stuff += '<tr>'
                stuff += '<td>child.val().roles.Volunteer</td>'
                stuff += '<td>true</td>'
                stuff += '</tr>'
            }
            if(child.val().roles.Director && child.val().roles.Director == true) {
                stuff += '<tr>'
                stuff += '<td>child.val().roles.Director</td>'
                stuff += '<td>true</td>'
                stuff += '</tr>'
            }
            if(child.val().roles.Admin && child.val().roles.Admin == true) {
                stuff += '<tr>'
                stuff += '<td>child.val().roles.Admin</td>'
                stuff += '<td>true</td>'
                stuff += '</tr>'
            }
            stuff += '</table>'



            stuff += '</td>'

            stuff += '</tr>'
        })
        stuff += '</table></body></html>'
        res.status(200).send(stuff)
    })
})

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


// CONFIRMED by comparing the dev db with the prod db.  The function below creates
// /missions and /mission_items in the dev db that are identical to the nodes in the prod
// database.  So now, we can actually work on the script that converts the old format to
// the new format.  And we can do it on the dev db first, which was the whole point of this script.
// To make sure that migrateMissions works, we have to test on the dev db first,
// which means we have to prepare the dev db by making it look like the prod db...
exports.prepareDevDatabaseToTestMigration = functions.https.onRequest((req, res) => {


    // DO WE NEED TO CREATE/SIMULATE SOME "in progress" /mission_items ?????


    var status = ''

    // restore backup:  Copy /teams/The Cavalry/missions_bak over to /missions
    return db.ref(`/teams/The Cavalry/missions_bak`).once('value').then(snapshot => {
        db.ref(`/missions`).set(snapshot.val())
        status += '<P/>OK copied /teams/The Cavalry/missions_bak to /missions'
    })
    .then(() => {
        // delete group_number from all /missions
        // delete mark_for_merge from all /missions
        // delete number_of_missions_in_master_mission from all /missions
        return db.ref(`/missions`).once('value').then(s2 => {
            s2.forEach(function (child) {
                db.ref(`/missions`).child(child.key).child('group_number').remove()
                db.ref(`/missions`).child(child.key).child('mark_for_merge').remove()
                db.ref(`/missions`).child(child.key).child('number_of_missions_in_master_mission').remove()
                status += '<P/>OK deleted /missions/'+child.key+'/group_number, /mark_for_merge, and /number_of_missions_in_master_mission'
            })
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

    })
    .then(() => {
        // make some /mission_items active and others inactive
        // what missions will we make active? mission_name=TP Test 1, TP Test 2
        return db.ref(`/mission_items`).orderByChild(`mission_name`).equalTo("TP Test 1").once('value').then(s2 => {
            s2.forEach(function (child) {
                db.ref(`/mission_items`).child(child.key).child('active').set(true)
                db.ref(`/mission_items`).child(child.key).child('active_and_accomplished').set('true_new')
                status += '<P/>OK set /mission_items/'+child.key+'/active = true'
                status += '<P/>OK set /mission_items/'+child.key+'/active_and_accomplished = true_new'
            })
        })
        .then(() => {
            return db.ref(`/mission_items`).orderByChild(`mission_name`).equalTo("TP Test 2").once('value').then(s2 => {
                s2.forEach(function (child) {
                    db.ref(`/mission_items`).child(child.key).child('active').set(true)
                    db.ref(`/mission_items`).child(child.key).child('active_and_accomplished').set('true_new')
                    status += '<P/>OK set /mission_items/'+child.key+'/active = true'
                    status += '<P/>OK set /mission_items/'+child.key+'/active_and_accomplished = true_new'
                })
            })
        })
        .then(() => {
            // for consistency, set the "TP Test 1" and "TP Test 2" MISSIONS also to be active
            return db.ref(`/missions`).orderByChild(`mission_name`).equalTo("TP Test 1").once('value').then(s2 => {
                s2.forEach(function (child) {
                    db.ref(`/missions`).child(child.key).child('active').set(true)
                    db.ref(`/missions`).child(child.key).child('uid_and_active').set(child.val().uid+'_true')
                    status += '<P/>OK set /missions/'+child.key+'/active = true'
                    status += '<P/>OK set /missions/'+child.key+'/uid_and_active = '+child.val().uid+'_true'
                })
            })
        })
        .then(() => {
            // for consistency, set the "TP Test 1" and "TP Test 2" MISSIONS also to be active
            return db.ref(`/missions`).orderByChild(`mission_name`).equalTo("TP Test 2").once('value').then(s2 => {
                s2.forEach(function (child) {
                    db.ref(`/missions`).child(child.key).child('active').set(true)
                    db.ref(`/missions`).child(child.key).child('uid_and_active').set(child.val().uid+'_true')
                    status += '<P/>OK set /missions/'+child.key+'/active = true'
                    status += '<P/>OK set /missions/'+child.key+'/uid_and_active = '+child.val().uid+'_true'
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



})



exports.migrateMissions = functions.https.onRequest((req, res) => {

    // make backup:  copy /missions to /missions_bak

    // make backup:  copy /mission_items to /mission_items_bak - THESE ARE ALREADY MADE


    var status = ''

    // copy /missions to /teams/The Cavalry/missions

    return db.ref(`/missions`).once('value').then(snapshot => {
        db.ref(`/teams/The Cavalry/missions`).set(snapshot.val())
        status += '<P/>OK copied /missions to /teams/The Cavalry/missions'
    })
    .then(() => {
        // insert:  mark_for_merge = true  (the only missions we have are Idaho missions)
        // insert:  number_of_missions_in_master_mission = 15
        return db.ref(`/teams/The Cavalry/missions`).once('value').then(snapshot => {
            snapshot.forEach(function (missionNode) {
                db.ref(`/teams/The Cavalry/missions`).child(missionNode.key).child('mark_for_merge').set(true)
                db.ref(`/teams/The Cavalry/missions`).child(missionNode.key).child('number_of_missions_in_master_mission').set(15)
                status += '<P/>OK set /teams/The Cavalry/missions/'+missionNode.key+'/mark_for_merge = true'
                status += '<P/>OK set /teams/The Cavalry/missions/'+missionNode.key+'/number_of_missions_in_master_mission = 15'
            })
        })
    })
    .then(() => {
        res.status(200).send(status)
    })




    // copy mission_items from /mission_items to the right mission...  /teams/The Cavalry/missions/{mission_id}/mission_items

    // insert:  Iterate over every mission item under:  /teams/The Cavalry/missions/{mission_id}/mission_items
    //          and set number_of_missions_in_master_mission = 15
    //
    // OOOPS - new mission_item attributes:  completed_by_name, completed_by_uid, mission_complete_date, notes, outcome
    //          figure this out later - we CAN get this info
    //
    // copy active mission_items from /mission_items to /teams/The Cavalry/mission_items, active_and_accomplished=true_new
    //      BUT THEY DON'T HAVE group_number's  !!!!!!!!!!!


    // ************   WHAT ELSE ??  *************************
})


// run this separately because mission_items are inserted via trigger, which happens after
// the migrateMissions function tries to delete them
exports.deleteMissionItems = functions.https.onRequest((req, res) => {

    var status = ''

    // delete mission_items under each of the /teams/The Cavalry/missions - because there's a trigger that create the mission_items nodes
    //      We don't want these nodes created by the trigger in this case.  We want them created by this script, by copying the right nodes
    //      from /mission_items
    var mref = db.ref(`/teams/The Cavalry/missions`)
    return mref.once('value').then(snapshot => {
        snapshot.forEach(function (missionNode) {
            mref.child(missionNode.key).child('mission_items').remove()
            status += '<P/>OK deleted /teams/The Cavalry/missions/'+missionNode.key+'/mission_items'
        })
    })
    .then(() => {
        res.status(200).send(status)
    })
})


// copy mission_items from /mission_items to the right mission...  /teams/The Cavalry/missions/{mission_id}/mission_items
exports.copyOverMissionItems = functions.https.onRequest((req, res) => {

    var status = ''
    var number_of_missions_in_master_mission = 15 // default, might be overridden below

    var sref = db.ref(`/teams/The Cavalry/missions`)
    var mref = db.ref(`/mission_items`)
    return mref.once('value').then(snapshot => {
        snapshot.forEach(function (missionItemNode) {

            if(!missionItemNode.key) {
                status += '<P/>============================================================================='
                status += '<P/> ERROR missionItemNode.key = '+missionItemNode.key + ' this is bad - fix code'
                status += '<P/>============================================================================='
            }

            var missionId = missionItemNode.val().mission_id
            if(!missionId) {
                status += '<P/>============================================================================='
                status += '<P/> ERROR missionItemNode.val().mission_id = '+missionItemNode.val().mission_id + ' for missionItemNode.key = '+missionItemNode.key
                status += '<P/>============================================================================='
            }

            sref.child(missionId).child('mission_items').child(missionItemNode.key).set(missionItemNode.val())
            status += '<P/>OK copied /mission_items/'+missionItemNode.key+' to /teams/The Cavalry/missions/'+missionId+'/mission_items/'+missionItemNode.key

            // copy number_of_missions_in_master_mission value
            sref.child(missionId).once('value').then(s2 => {
                if(s2.val().number_of_missions_in_master_mission) {
                    number_of_missions_in_master_mission = s2.val().number_of_missions_in_master_mission
                }
                sref.child(missionId).child('mission_items').child(missionItemNode.key).child('number_of_missions_in_master_mission').set(number_of_missions_in_master_mission)
            })
        })
    })
    // also copy all /mission_items over to /teams/The Cavalry/mission_items, and then, delete all the mission_items that are "complete"
    .then(() => {

        return db.ref(`/mission_items`).orderByChild('active_and_accomplished').equalTo("true_new").once('value').then(snapshot => {
            var ct = snapshot.numChildren()
            snapshot.forEach(function(child) {
                db.ref(`/teams/The Cavalry/mission_items`).child(child.key).set(child.val())
                status += '<P/>OK copied '+ct+' mission_items from /mission_items to /teams/The Cavalry/mission_items'
            })
        })

    })
    .then(() => {
        // add node: number_of_missions_in_master_mission to each  /teams/The Cavalry/mission_items
        // add node: number_of_missions_in_master_mission to each  /teams/The Cavalry/mission_items
        var mref = db.ref(`/teams/The Cavalry/mission_items`)
        return mref.once('value').then(snapshot => {
            var iter = 0
            snapshot.forEach(function (child) {
                var group_number = iter % number_of_missions_in_master_mission
                ++iter
                mref.child(child.key).child('number_of_missions_in_master_mission').set(number_of_missions_in_master_mission)
                mref.child(child.key).child('group_number').set(group_number)
                status += '<P/>OK added number_of_missions_in_master_mission='+number_of_missions_in_master_mission+' to /teams/The Cavalry/mission_items/'+child.key
                status += '<P/>OK added group_number='+group_number+' to /teams/The Cavalry/mission_items/'+child.key
            })
        })

    })
    .then(() => {
        res.status(200).send(status)
    })
    .catch(function(e) {
        res.status(200).send(status+'<P/>ERROR: '+e)
    })

})


exports.selectDistinct = functions.https.onRequest((req, res) => {
    var status = ''

    var node = req.query.node
    var attribute = req.query.attribute
    if(!node || !attribute) {
        status += 'Required request parameters: <P/> node <P/> attribute'
        res.status(200).send(status)
    }
    else {
        var values = []
        status += "<P/>node: "+node+"<P/>attribute: "+attribute+"<P/>values..."
        return db.ref(`${node}`).orderByChild(attribute).once('value').then(snapshot => {
            snapshot.forEach(function (child) {
                var theval = child.val()[attribute]
                if(values.indexOf(theval) == -1) {
                    values.push(theval)
                    status += '<P/>'+theval
                }
            })
        })
        .then(() => {
            res.status(200).send(status)
        })
    }
})


exports.query = functions.https.onRequest((req, res) => {
    var status = ''

    var node = req.query.node
    if(!node) {
        status += 'Required request parameters: <P/> node<P/> optional: attribute<P/> optional: value'
        res.status(200).send(status)
    }
    else {
        var attribute = req.query.attribute
        var value = req.query.value
        var nodeInfo = node

        var theref = db.ref(`${node}`)
        if(attribute && value) {
            nodeInfo += ' where '+attribute+' = '+value
            theref = db.ref(`${node}`).orderByChild(attribute).equalTo(value)
        }

        return theref.once('value').then(snapshot => {
            var ct = snapshot.numChildren()
            status += '<P/>There are '+ct+' children of '+nodeInfo
            status += '<P/>'+node+' as json string...<br/>'+JSON.stringify(snapshot.val())
            snapshot.forEach(function (child) {
                status += '<P/>child node: key='+child.key+' value = '+JSON.stringify(child.val())
            })
        })
        .then(() => {
            res.status(200).send(status)
        })
    }
})



// initially created to add account_disposition=enabled to each child of /users
exports.addAttributeToChildren = functions.https.onRequest((req, res) => {
    var status = ''

    var parentNode = req.query.parentNode
    var attr = req.query.attr
    var value = req.query.value


    if(!parentNode || !attr || !value) {
        status += 'Required request parameters: <P/> parentNode<P/> attr<P/> value'
        res.status(200).send(status)
    }


    else {

        var theref = db.ref(`${parentNode}`)
        var updates = {}
        return theref.once('value').then(snapshot => {
            var ct = snapshot.numChildren()
            status += '<P/>There are '+ct+' children of '+parentNode
            snapshot.forEach(function (child) {
                var path = parentNode + "/" + child.key + "/" + attr
                updates[path] = value
                status += '<P/>set: updates['+path+'] = ' + value
            })

            return {updates: updates, status: status}
        })
        .then((result) => {
            var updates = result.updates
            // good example of multi-path updates
            return db.ref().update(updates).then(() => {
                res.status(200).send(result.status)
            })

        })
    }
})


// copies the /users node over to /archive_users_yyyyMMdd
exports.archive = functions.https.onRequest((req, res) => {

    var status = ''
    var node = req.query.node

    if(!node) {
        status += 'Required request parameter:  node'
        res.status(200).send(status)
    }

    else {
        if(node.startsWith("/")) {
            node = node.substring(1)
        }

        var datePart = date.as_yyyyMMdd()
        var destNode = "zzz_archive_"+node+"_"+datePart
        var fromNode = node

        return db.ref(`${fromNode}`).once('value').then(snapshot => {
            db.ref(`${destNode}`).set(snapshot.val())
            res.status(200).send("OK: copied "+fromNode+" -to-> "+destNode)
        })
    }
})



