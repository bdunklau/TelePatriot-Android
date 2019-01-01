const functions = require('firebase-functions')
const admin = require('firebase-admin')

// create reference to root of the database
const db = admin.database()

exports.deleteUserAccount = functions.auth.user().onDelete(event => {
    var updates = {}
    updates['/no_roles/'+event.data.uid] = null
    updates['/users/'+event.data.uid] = null
    return db.ref('/').update(updates)
})
