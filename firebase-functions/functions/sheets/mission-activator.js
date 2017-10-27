'use strict';

const functions = require('firebase-functions');


// to either activate or deactivate missions
exports.missionActivation = functions.database.ref(`missions/{missionId}/{uid_and_active}`).onWrite(
    event => {

    // This keeps your trigger from being called recursively
    // In this case, we want to only execute this trigger when the uid_and_active attribute
    // already exists
    if (event.data.previous.exists()) {
        return;
    }
    // Exit when the data is deleted.
    if (!event.data.exists()) {
        return;
    }

    if(event.data.previous.val().uid_and_active == event.data.val().uid_and_active)
        return // if there's no change to this value


    var missionId = event.params.missionId
    var uid_and_active = event.params.uid_and_active
    var active = uid_and_active.endsWith("_true")
    var adminRef = event.data.adminRef

    var updates = {};
    adminRef.root.child("mission_details").on('value', function(snapshot) {
        updates["mission_details/"+snapshot.key+"/active"] = active;
        updates["mission_details/"+snapshot.key+"/uid_and_active"] = uid_and_active;
    });
    return adminRef.root.update(updates);

})