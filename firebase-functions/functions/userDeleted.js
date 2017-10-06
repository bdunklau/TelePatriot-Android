const functions = require('firebase-functions')
const admin = require('firebase-admin')

// create reference to root of the database
const ref = admin.database().ref()

exports.deleteUserAccount = functions.auth.user().onDelete(event => {
    console.log("userDeleted.js: onDelete called")
    // UserRecord is created
    // according to: https://www.youtube.com/watch?v=pADTJA3BoxE&t=31s
    // UserRecord contains: displayName, email, photoUrl, uid
    // all of this is accessible via event.data
    const uid = event.data.uid
    const email = event.data.email
    const photoUrl = event.data.photoUrl || 'https://i.stack.imgur.com/34AD2.jpg'

    // apparently you have to use backticks, not single quotes
    const newUserRef = ref.child(`/users/${uid}`)
    return newUserRef.remove().then(snapshot => {
        return ref.child(`/no_roles/${uid}`).remove();
    });
})
