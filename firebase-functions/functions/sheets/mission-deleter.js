'use strict';

const functions = require('firebase-functions');


// to either activate or deactivate missions
exports.missionDeletion = functions.database.ref("teams/{team_name}/missions/{missionId}/").onDelete(
    event => {

    var team_name = event.params.team_name
    var missionId = event.params.missionId

    let ref = event.data.adminRef.root.child(`/teams/${team_name}/mission_items`)

    return ref.orderByChild('mission_id').equalTo(missionId).once('value', snapshot => {
         let updates = {};
         snapshot.forEach(child => updates[child.key] = null);
         ref.update(updates);
    });

})