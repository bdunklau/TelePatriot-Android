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

    // Also new as of 12/8/17, when we DEACTIVATE missions, we DELETE those mission items
    // from teams/${team}/missions/${missionId}/mission_items because now, this node ONLY contains active missions

    // if we are activating this mission...
    if(active) {

        // iterate over /teams/{team}/missions/{missionId}/mission_items
        var updates = {};
        return event.data.adminRef.root.child(`teams/${team}/missions/${missionId}/mission_items`).once('value').then(snapshot => {

            var counter = 0
            var total_rows_activated = 0
            snapshot.forEach(function (child) { // FYI, child is a DataSnapshot
                ++counter
                var key = child.key
                var val = JSON.stringify(child.val())
                var copy = JSON.parse(val)

                copy.active = active
                copy.uid_and_active = uid_and_active
                var phone = copy.phone
                var phone2 = copy.phone2

                // These next two lines are kind of a bandaid fix.  The best thing would be to strip out all
                // non-numeric chars at the time the spreadsheet was read.
                copy.phone = phone.replace(/\D/g,''); // gets rid of everything that isn't a digit
                copy.phone2 = phone2.replace(/\D/g,''); // had a problem on iPhones with format (###) ###-####

                copy.active_and_accomplished = active+"_"+child.val().accomplished
                copy.group_number = counter % 10 // fixed modulus should be ok regardless of how many spreadsheets we load

                // only write to this node if the mission item is active and new...
                if(copy.active_and_accomplished == 'true_new') {
                    adminRef.root.child(`teams/${team}/mission_items/${key}`).set(copy)
                    ++total_rows_activated
                }

                updates["teams/"+team+"/missions/"+missionId+"/mission_items/"+key+"/active"] = active
                updates["teams/"+team+"/missions/"+missionId+"/mission_items/"+key+"/uid_and_active"] = uid_and_active
                updates["teams/"+team+"/missions/"+missionId+"/mission_items/"+key+"/active_and_accomplished"] = active+"_"+child.val().accomplished

                // just for debugging...
                //adminRef.root.child("logs").push().set({team: team, missionId: missionId, key: key, active: active, uid_and_active: uid_and_active, active_and_accomplished: active+"_"+child.val().accomplished})
            })
            updates["teams/"+team+"/missions/"+missionId+"/total_rows_activated"] = total_rows_activated
            updates["teams/"+team+"/missions/"+missionId+"/total_rows_deactivated"] = 0

            // good example of multi-path updates
            return adminRef.root.update(updates)
        })

    }
    // if we are DE-activating this mission...
    else {
        // delete all nodes under teams/${team}/missions/${missionId}/mission_items for this mission
        var mref = event.data.adminRef.root.child(`teams/${team}/mission_items`)
        mref.orderByChild('mission_id').equalTo(missionId).once('value').then(snapshot => {
            var updates = {}
            var total_rows_deactivated = 0
            snapshot.forEach(function (child) {
                mref.child(child.key).remove()
                ++total_rows_deactivated
            })

            updates["teams/"+team+"/missions/"+missionId+"/total_rows_activated"] = 0
            updates["teams/"+team+"/missions/"+missionId+"/total_rows_deactivated"] = total_rows_deactivated

            // good example of multi-path updates
            adminRef.root.update(updates)
        })
    }

})
