const functions = require('firebase-functions');
const strings = require('./strings')
const admin = require('firebase-admin')
const date = require('./dateformat')

// create reference to root of the database
const ref = admin.database().ref()

exports.notifyUserCreated = functions.auth.user().onCreate((user) => {
    console.log("notifications.js: notifyUserCreated called")
    // UserRecord is created
    // according to: https://www.youtube.com/watch?v=pADTJA3BoxE&t=31s
    // UserRecord contains: displayName, email, photoUrl, uid
    // all of this is accessible via user
    const uid = user.uid
    const email = user.email

    console.log("notifications.js: user = ", user)
    console.log("notifications.js: uid = ", uid)


    var newuser = email
    if(user.displayName) newuser = user.displayName
    var body = newuser+" just joined. Assign to group after vetting."
    var message = newuser+" just joined "+strings.strings.appname+".  Confirm that this person "+
    "should be allowed in.  If so, assign this person to a group"

    /* Create a notification and data payload. They contain the notification information, and message to be sent respectively */
    const payload = {
        // see  https://medium.com/@Miqubel/mastering-firebase-notifications-36a3ffe57c41
        notification: {
            title: "New User",
            body: body,
            sound: "default"
        },
        data: {
            title: "New "+strings.strings.appname+" User",
            message: message,
            uid: uid
        }
    };

    /* Create an options object that contains the time to live for the notification and the priority. */
    const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24 //24 hours
    };

    // see  https://firebase.google.com/docs/reference/admin/node/admin.messaging
    return admin.messaging().sendToTopic("AccountEvents", payload, options).then(function(response) {
        return ref.child('/users/'+uid+'/account_status_events').push(
            {date: date.asCentralTime(), event: "Admins have been notified..."})
    }).catch(function(response) { console.log("CAUGHT ERROR: ", response) });
});
