'use strict';

const functions = require('firebase-functions');


// to either activate or deactivate missions
exports.missionActivation = functions.database.ref(`missions/{missionId}/{uid_and_active}`).onWrite(
    event => {

    var missionId = event.params.missionId
    var uid_and_active = event.params.uid_and_active
    var active = uid_and_active.endsWith("_true")
    var adminRef = event.data.adminRef

    var updates = {};
    adminRef.root.child("mission_details").on('value', function(snapshot) {
        updates["mission_details/"+snapshot.key+"/active"] = active;
        updates["mission_details/"+snapshot.key+"/uid_and_active"] = uid_and_active;
    });
    return adminRef.update(updates);

})