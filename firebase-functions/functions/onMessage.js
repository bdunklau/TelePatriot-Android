const functions = require('firebase-functions');
const strings = require('./strings')
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

/* Listens for new messages added to /messages/:pushId and sends a notification to subscribed users */
exports.pushNotification = functions.database.ref('/messages/{pushId}').onWrite( event => {
    console.log('onMessage.js: Push notification event triggered');

    /* Grab the current value of what was written to the Realtime Database */
    var valueObject = event.data.val();
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
    return admin.messaging().sendToTopic("notifications", payload, options);
});
