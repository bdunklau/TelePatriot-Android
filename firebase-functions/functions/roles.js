const functions = require('firebase-functions');
const strings = require('./strings')
const admin = require('firebase-admin')
const date = require('./dateformat')

// see:  https://www.youtube.com/watch?v=7E13ZBCyKT0&index=2&list=PLl-K7zZEsYLkPZHe41m4jfAxUi0JjLgSM

// TODO fix this
/* Listens for new messages added to __________ and then ____________ */
exports.roleAssigned = functions.database.ref('/users/{uid}/roles/{role}').onCreate( event => {
    console.log("roleAssigned: uid=", event.params.uid, "role=", event.params.role)

    // event.params.role will be the value of the key so make the key 'Admin' and the value doesn't matter
    var uid = event.params.uid
    var role = event.params.role

    event.data.adminRef.root.child('/users/'+uid).once('value').then(snapshot => {
        event.data.adminRef.root.child('/roles/'+role+'/users/'+uid)
            .set({name: snapshot.val().name, email: snapshot.val().email})
    })


    // now need to get the topics associated with this role
    return event.data.adminRef.root.child('roles/'+role+'/topics').once('value').then(snapshot => {
          snapshot.forEach(function(child) {
            console.log("child.val(): ", child.val())
            var topic = child.val().name
            event.data.adminRef.root.child('/users/'+uid+'/topics/'+topic).set('true')
          });
    }).then(snapshot => {
        var datestr = date.asCentralTime()
        var msg = "Admin has assigned you to the "+role+" group"
        return event.data.adminRef.root.child('/users/'+uid+'/account_status_events').push({date: datestr, event: msg})
    })

});



exports.roleUnassigned = functions.database.ref('/users/{uid}/roles/{role}').onDelete( event => {
    console.log("roleUnassigned: uid=", event.params.uid, "role=", event.params.role)

    var role = event.params.role
    var uid = event.params.uid

    event.data.previous.adminRef.root.child(`/roles/${role}/users/${uid}`).remove()

    return event.data.adminRef.root.child(`/roles/${role}/topics`).once('value').then(snapshot => {

          snapshot.forEach(function(child) {
            console.log("child.val(): ", child.val())
            var topic = child.val().name
            event.data.adminRef.root.child(`/users/${uid}/topics/${topic}`).remove()
          });

    })
    .then(() => {
        var datestr = date.asCentralTime()
        var msg = "Admin has removed you from the "+role+" group"
        event.data.adminRef.root.child(`/users/${uid}/account_status_events`).push({date: datestr, event: msg})
    })

});




