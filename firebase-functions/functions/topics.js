const functions = require('firebase-functions');
const strings = require('./strings')
const admin = require('firebase-admin');

const db = admin.database()

// see:  https://www.youtube.com/watch?v=7E13ZBCyKT0&index=2&list=PLl-K7zZEsYLkPZHe41m4jfAxUi0JjLgSM

/* Listens for new messages added to __________ and then ____________ */
exports.topicCreated = functions.database.ref('/roles/{role}/topics/{topicKey}').onWrite( (change, context) => {

    // Only edit data when it is first created.
    if (change.before.exists()) {
        return;
    }
    // Exit when the data is deleted.
    if (!change.after.exists()) {
        return;
    }

    var data = change.after.val()

    // this is the DatabaseSnapshot object
    //var evtsnapshot = data
    console.log("check:  data.val(): ", data.val())
    var topicName = data.name
    var role = context.params.role

    console.log("check:  topicName: ", topicName)

    // now get the users that have this role
    return db.ref().child('/roles/'+role+'/users').once('value').then(snapshot => {
          snapshot.forEach(function(child) {
            console.log("child.val(): ", child.val())
            console.log("child.key: ", child.key)
            var userUid = child.key
            admin.database().ref().child('/users').child(userUid).child('/topics').child(topicName).set('true')
          });
    })

});



exports.topicDeleted = functions.database.ref('/roles/{role}/topics/{topicKey}').onDelete( (snap, context) => {
    // this is the DatabaseSnapshot object
    //var evtsnapshot = data.previous

    var topicName = snap.val().name
    var role = context.params.role

    // now get the users that have this role
    return db.ref().child('/roles/'+role+'/users').once('value').then(snapshot => {
          snapshot.forEach(function(child) {
            var userUid = child.key
            admin.database().ref().child('/users').child(userUid).child('/topics').child(topicName).remove()
          });
    })


});



