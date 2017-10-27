'use strict';

const functions = require('firebase-functions');


// to either activate or deactivate missions
exports.missionActivation = functions.database.ref("missions/{missionId}/uid_and_active").onWrite(
    event => {

    // This keeps your trigger from being called recursively
    // The trick is finding the conditions where you want it to run and where you want
    // it to return early
    // Exit when the data is deleted.
    if (!event.data.exists()) {
        console.log("missionActivation: return early because !event.data.exists()")
        return true
    }

    // NOTE: event.data.val() and event.data.previous.val() are the current and previous values of uid_and_active
    if (event.data.previous.exists() && /* no change */ event.data.previous.val() == event.data.val()) {
        console.log("missionActivation: return early because event.data.previous.exists() && event.data.previous.val() == event.data.val()\n event.data.previous.val() = ",
                 event.data.previous.val(),"\nevent.data.val() = ", event.data.val())
        return true
    }

    var missionId = event.params.missionId
    var uid_and_active = event.data.val()
    var active = uid_and_active.endsWith("_true")
    var adminRef = event.data.adminRef

    var updates = {};
    return adminRef.root.child(`mission_items`).orderByChild('mission_id').equalTo(missionId).on('child_added', function(snapshot) {
        console.log("missionActivation: snapshot.key = ", snapshot.key)
        updates["mission_items/"+snapshot.key+"/active"] = active
        updates["mission_items/"+snapshot.key+"/uid_and_active"] = uid_and_active
        return adminRef.root.update(updates)
    });

})