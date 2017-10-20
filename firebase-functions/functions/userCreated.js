const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

// create reference to root of the database
const ref = admin.database().ref()

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
    const newUserRef = ref.child(`/users/${uid}`)


    console.log("createUserAccount: event.data = ", event.data)
    var name = email // default value if name not present
    if(event.data.displayName) name = event.data.displayName
    var created = date.asCentralTime()
    var userrecord = {name:name, photoUrl:photoUrl, email:email, created: created}

    // remember, .set() returns a promise
    // just about everything returns a promise

    return newUserRef.set(userrecord).then(snap => {

        return ref.child(`/no_roles/${uid}`).set(userrecord)
            .then( hmmm => {
                admin.auth().getUser(uid)
                    .then(function(userRecord) {
                        console.log("Successfully fetched user data:", userRecord.toJSON());
                        ref.child(`/users/${uid}/name`).set(userRecord.displayName) // displayName not ready
                        // above, but it is at this point
                        // https://github.com/firebase/firebaseui-web/issues/197
                    })
            })
    })
})