'use strict';

const functions = require('firebase-functions');


// to either activate or deactivate missions
exports.missionActivation = functions.database.ref("teams/{team}/missions/{missionId}/uid_and_active").onWrite(
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

    var team = event.params.team
    var missionId = event.params.missionId
    var uid_and_active = event.data.val()
    var active = uid_and_active.endsWith("_true")
    var adminRef = event.data.adminRef

    // New as of 12/8/17 - When we activate missions, THIS is the point at which we write mission_items
    // to the tree, not before

    // iterate over /teams/{team}/missions/{missionId}/mission_items
    var updates = {};
    return event.data.adminRef.root.child(`teams/${team}/missions/${missionId}/mission_items`).once('value').then(snapshot => {

        var counter = 0
        snapshot.forEach(function (child) { // FYI, child is a DataSnapshot
            ++counter
            var key = child.key
            var val = JSON.stringify(child.val())
            var copy = JSON.parse(val)

            copy.active = active
            copy.uid_and_active = uid_and_active
            copy.active_and_accomplished = active+"_"+child.val().accomplished
            copy.group_number = calculateGroupNumber(copy, counter)

            // only write to this node if the mission item is active and new...
            if(copy.active_and_accomplished == 'true_new')
                adminRef.root.child(`teams/${team}/mission_items/${key}`).set(copy)

            updates["teams/"+team+"/missions/"+missionId+"/mission_items/"+key+"/active"] = active
            updates["teams/"+team+"/missions/"+missionId+"/mission_items/"+key+"/uid_and_active"] = uid_and_active
            updates["teams/"+team+"/missions/"+missionId+"/mission_items/"+key+"/active_and_accomplished"] = active+"_"+child.val().accomplished

            // just for debugging...
            //adminRef.root.child("logs").push().set({team: team, missionId: missionId, key: key, active: active, uid_and_active: uid_and_active, active_and_accomplished: active+"_"+child.val().accomplished})
        })
        return adminRef.root.update(updates)
    })

    // set active, uid_and_active, and active_and_accomplished

    // COPY these nodes over to /teams/{team}/mission_items

    /***********
    return adminRef.root.child(`teams/${team}/mission_items`).orderByChild('mission_id').equalTo(missionId).on('child_added', function(snapshot) {
        console.log("missionActivation: snapshot.key = ", snapshot.key)
        console.log("missionActivation: snapshot.val() = ", snapshot.val())
        updates["mission_items/"+snapshot.key+"/active"] = active
        updates["mission_items/"+snapshot.key+"/uid_and_active"] = uid_and_active
        updates["mission_items/"+snapshot.key+"/active_and_accomplished"] = active+"_"+snapshot.val().accomplished
        return adminRef.root.update(updates)
    });
    ***********/
})

var calculateGroupNumber = function(mission_item, counter) {
    var modulus = 1
    if(mission_item.number_of_missions_in_master_mission)
        modulus =  mission_item.number_of_missions_in_master_mission

    return counter % modulus
}