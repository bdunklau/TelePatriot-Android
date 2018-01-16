const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

// create reference to root of the database
const db = admin.database().ref()

exports.createUserAccount = functions.auth.user().onCreate(event => {
    console.log("userCreated.js: onCreate called")
    // UserRecord is created
    // according to: https://www.youtube.com/watch?v=pADTJA3BoxE&t=31s
    // UserRecord contains: displayName, email, photoUrl, uid
    // all of this is accessible via event.data

    const uid = event.data.uid
    const email = event.data.email
    const photoUrl = event.data.photoURL || 'https://i.stack.imgur.com/34AD2.jpg'

    // apparently you have to use backticks, not single quotes
    const newUserRef = db.child(`/users/${uid}`)


    console.log("createUserAccount: event.data = ", event.data)
    var name = email // default value if name not present
    if(event.data.displayName) name = event.data.displayName
    var created = date.asCentralTime()
    var userrecord = {name:name, photoUrl:photoUrl, email:email, created: created}

    // remember, .set() returns a promise
    // just about everything returns a promise

    return newUserRef.set(userrecord).then(snap => {

        return db.child(`/no_roles/${uid}`).set(userrecord)
            .then( hmmm => {
                admin.auth().getUser(uid)
                    .then(function(userRecord) {
                        console.log("Successfully fetched user data:", userRecord.toJSON());
                        db.child(`/users/${uid}/name`).set(userRecord.displayName) // displayName not ready
                        // above, but it is at this point
                        // https://github.com/firebase/firebaseui-web/issues/197
                    })
            })
    })
})


exports.approveUserAccount = functions.database.ref('/no_roles/{uid}').onDelete(event => {

    var uid = event.params.uid
    var name = event.data.previous.val().name
    var email = event.data.previous.val().email

    // put new users on this team by default...
    return db.child(`/administration/newusers/assign_to_team`).once('value').then(snapshot => {
        var team_name = snapshot.val()
        return team_name // return value here becomes the inbound parameter in the next "then" clause
    })
    .then(team_name => {
        db.child(`teams/${team_name}/members`).child(uid).set({name: name, email: email, date_added: date.asCentralTime()})
    })
})