'use strict';

const functions = require('firebase-functions');


// to either activate or deactivate missions
exports.missionDeletion = functions.database.ref("missions/{missionId}/").onDelete(
    event => {

    var missionId = event.params.missionId

    let ref = event.data.adminRef.root.child(`/mission_items`)

    return ref.orderByChild('mission_id').equalTo(missionId).once('value', snapshot => {
         let updates = {};
         snapshot.forEach(child => updates[child.key] = null);
         ref.update(updates);
    });

})