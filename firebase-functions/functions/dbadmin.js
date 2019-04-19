'use strict';

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

/***
to deploy everything in this file...
firebase deploy --only functions:checkUsers,functions:insert,functions:update,functions:queryActive,functions:queryInactive,functions:copy,functions:deleteNodes,functions:deleteAttributes,functions:selectDistinct,functions:query,functions:addAttributeToChildren,functions:archive
***/


// throw-away function
exports.checkUsers = functions.https.onRequest((req, res) => {
    return db.ref('users').once('value').then(snapshot => {
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

        return db.ref(node).set({attribute: value}).then(() => {
            db.ref(node+'/'+attribute).once('value').then(snapshot => {
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

        return db.ref(node).child(attribute).set(value).then(() => {
            db.ref(node).once('value').then(snapshot => {
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
        return db.ref(node).orderByChild("active").equalTo(bool).once('value').then(snapshot => {
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
        return db.ref(from).once('value').then(snapshot => {
            db.ref(to).set(snapshot.val())
            res.status(200).send("Copied this node: "+from+"<P/>To this node: "+to)
        })
    }

})


exports.deleteNodes = functions.https.onRequest((req, res) => {

    // allow for these req parms
    //      from
    //      to

    var node = req.query.node

    if(!node) {
        return res.status(200).send("Request parms needed for this function: <P/> node")
    }
    else {
        var updates = {}
        updates[node] = null
        return db.ref('/').update(updates).then(() => {
            res.status(200).send("Deleted node: "+node)
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
        var mref = db.ref(node)
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
        return db.ref(node).orderByChild(attribute).once('value').then(snapshot => {
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

        var theref = db.ref(node)
        if(attribute && value) {
            nodeInfo += ' where '+attribute+' = '+value
            theref = db.ref(node).orderByChild(attribute).equalTo(value)
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

        var theref = db.ref(parentNode)
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

        return db.ref(fromNode).once('value').then(snapshot => {
            db.ref(destNode).set(snapshot.val())
            res.status(200).send("OK: copied "+fromNode+" -to-> "+destNode)
        })
    }
})



