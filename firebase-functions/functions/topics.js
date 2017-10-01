const functions = require('firebase-functions');
const strings = require('./strings')
const admin = require('firebase-admin');

// see:  https://www.youtube.com/watch?v=7E13ZBCyKT0&index=2&list=PLl-K7zZEsYLkPZHe41m4jfAxUi0JjLgSM

/* Listens for new messages added to __________ and then ____________ */
exports.topicCreated = functions.database.ref('/roles/{role}/topics/{topicKey}').onWrite( event => {

    // Only edit data when it is first created.
    if (event.data.previous.exists()) {
        return;
    }
    // Exit when the data is deleted.
    if (!event.data.exists()) {
        return;
    }

    // this is the DatabaseSnapshot object
    //var evtsnapshot = event.data
    console.log("check:  event.data.val(): ", event.data.val())
    var topicName = event.data.val().name
    var role = event.params.role

    console.log("check:  topicName: ", topicName)

    // now get the users that have this role
    return event.data.adminRef.root.child(`/roles/${role}/users`).once('value').then(snapshot => {
          snapshot.forEach(function(child) {
            console.log("child.val(): ", child.val())
            console.log("child.key: ", child.key)
            var userUid = child.key
            event.data.adminRef.root.child('/users').child(userUid).child('/topics').child(topicName).set('true')
          });
    })

});



exports.topicDeleted = functions.database.ref('/roles/{role}/topics/{topicKey}').onDelete( event => {
    // this is the DatabaseSnapshot object
    //var evtsnapshot = event.data.previous

    var topicName = event.data.previous.val().name
    var role = event.params.role

    // now get the users that have this role
    return event.data.adminRef.root.child(`/roles/${role}/users`).once('value').then(snapshot => {
          snapshot.forEach(function(child) {
            var userUid = child.key
            event.data.adminRef.root.child('/users').child(userUid).child('/topics').child(topicName).remove()
          });
    })


});



