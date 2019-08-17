const functions = require('firebase-functions')
const admin = require('firebase-admin')

// create reference to root of the database
const db = admin.database()

exports.deleteUserAccount = functions.auth.user().onDelete(user => {
    var updates = {}
    updates['/no_roles/'+user.uid] = null
    updates['/users/'+user.uid] = null
    return db.ref('/').update(updates)
})
