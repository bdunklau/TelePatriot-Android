const functions = require('firebase-functions');
const strings = require('./strings')
const admin = require('firebase-admin');

// see:  https://www.youtube.com/watch?v=7E13ZBCyKT0&index=2&list=PLl-K7zZEsYLkPZHe41m4jfAxUi0JjLgSM

/* Listens for new messages added to __________ and then ____________ */
exports.roleAssigned = functions.database.ref('/users/{uid}/roles/{role}').onWrite( event => {
    var evtsnapshot = event.data
    console.log("roleAssigned: uid=", event.params.uid, "role=", event.params.role)

    // Only edit data when it is first created.
    if (event.data.previous.exists()) {
        return;
    }
    // Exit when the data is deleted.
    if (!event.data.exists()) {
        return;
    }

    // event.params.role will be the value of the key so make the key 'Admin' and the value doesn't matter
    var uid = event.params.uid
    var role = event.params.role

    event.data.adminRef.root.child(`/users/${uid}`).once('value').then(snapshot => {
        console.log("snapshot.val(): ", snapshot.val())
        event.data.adminRef.root.child(`/roles/${role}/users/${uid}`)
            .set({name: snapshot.val().name, email: snapshot.val().email})
    })


    // now need to get the topics associated with this role
    return event.data.adminRef.root.child(`/roles/${role}/topics`).once('value').then(snapshot => {
          snapshot.forEach(function(child) {
            console.log("child.val(): ", child.val())
            var topic = child.val().name
            event.data.adminRef.root.child(`/users/${uid}/topics`).child(topic).set('true')
          });
    })

});



exports.roleUnassigned = functions.database.ref('/users/{uid}/roles/{role}').onDelete( event => {
    console.log("roleUnassigned: uid=", event.params.uid, "role=", event.params.role)
    // this is the DatabaseSnapshot object
    //var evtsnapshot = event.data.previous

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

});




