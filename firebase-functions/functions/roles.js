const functions = require('firebase-functions');
const strings = require('./strings')
const admin = require('firebase-admin');

// see:  https://www.youtube.com/watch?v=7E13ZBCyKT0&index=2&list=PLl-K7zZEsYLkPZHe41m4jfAxUi0JjLgSM

/* Listens for new messages added to __________ and then ____________ */
exports.roleAssigned = functions.database.ref('/users/{uid}/roles/{role}').onWrite( event => {
    var evtsnapshot = event.data
    console.log("roleAssigned: uid=", event.params.uid, "role=", event.params.role)

    // event.params.role will be the value of the key so make the key 'Admin' and the value doesn't matter

    event.data.adminRef.root.child('/roles/'+event.params.role+'/users').push(event.params.uid)

    // now need to get the topics associated with this role
    /*****/
    return event.data.adminRef.root.child('/roles/'+event.params.role+'/topics').once('value').then(snapshot => {
          snapshot.forEach(function(child) {
            console.log("child.val(): ", child.val())
            var topic = child.val().name
            event.data.adminRef.root.child('/users/'+event.params.uid+'/topics').child(topic).set('true')
          });
    })
    /*****/
});



exports.roleUnassigned = functions.database.ref('/users/{uid}/roles/{role}').onDelete( event => {
    var evtsnapshot = event.data
    console.log("roleAssigned: uid=", event.params.uid, "role=", event.params.role)

    // event.params.role will be the value of the key so make the key 'Admin' and the value doesn't matter

    // now need to get the topics associated with this role
    /*****/
    return event.data.adminRef.root.child('/roles/'+event.params.role+'/topics').once('value').then(snapshot => {
          snapshot.forEach(function(child) {
            console.log("child.val(): ", child.val())
            var topic = child.val().name
            event.data.adminRef.root.child('/users/'+event.params.uid+'/topics').child(topic).remove()
          });
    })
    /*****/
});



