const functions = require('firebase-functions');
const strings = require('./strings')
const admin = require('firebase-admin');

/* Listens for new messages added to /messages/:pushId and sends a notification to subscribed users */
// migrating from node.6 to node.8: https://cloud.google.com/functions/docs/migrating/nodejs-runtimes
// https://firebase.google.com/docs/functions/database-events
exports.pushMessages = functions.database.ref('/messages/{pushId}').onWrite( (change, context) => {
    console.log('onMessage.js: Push notification event triggered');

    /* Grab the current value of what was written to the Realtime Database */
    var valueObject = change.after.val();
    console.log('valueObject: ', valueObject);

    /* Create a notification and data payload. They contain the notification information, and message to be sent respectively */
    const payload = {
        notification: {
            title: strings.strings.appname,
            body: "New message",
            sound: "default"
        },
        data: {
            title: valueObject.title,
            message: valueObject.text
        }
    };

    /* Create an options object that contains the time to live for the notification and the priority. */
    const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24 //24 hours
    };

    // see  https://firebase.google.com/docs/reference/admin/node/admin.messaging
    return admin.messaging().sendToTopic("messages", payload, options);
});
