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
    console.log("userCreated.js: onCreate event.data: ", event.data)
    console.log("userCreated.js: event.data.metadata: ", event.data.metadata)
    console.log("userCreated.js: event.data.metadata.UserRecordMetadata: ", event.data.metadata.UserRecordMetadata)

    const uid = event.data.uid
    const email = event.data.email
    const photoUrl = event.data.metadata.photoUrl || 'https://i.stack.imgur.com/34AD2.jpg'

    // apparently you have to use backticks, not single quotes
    const newUserRef = ref.child(`/users/${uid}`)


    var name = email // default value if name not present
    if(event.data.displayName) name = event.data.displayName
    var created = date.asCentralTime()
    var userrecord = {name:name, photoUrl:photoUrl, email:email, created: created}

    // remember, .set() returns a promise
    //return newUserRef.set(userrecord)

    return newUserRef.set(userrecord).then(snap => {
        return ref.child(`/no_roles/${uid}`).set(userrecord)
    })
})
