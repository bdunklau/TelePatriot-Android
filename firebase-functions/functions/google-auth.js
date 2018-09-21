'use strict';

/********************************************************************************************
CODE CLEANUP NEEDED - CODE DUPLICATION
We have taken code that was duplicated in demo-google-sheet-write.js and import-master-sheet.js
and we've put it here because there are other places where we need to authenticate with google
One place is google-compute.js
********************************************************************************************/

// most external dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash')
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const google = require('googleapis');
const date = require('./dateformat')
const d = require('./debug')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database()


// CODE DUPLICATION: We have this function declared in demo-google-sheet-write.js and there
// are actually TWO versions of this function in import-master-sheet.js
// OAuth token cached locally.
let oauthTokens = null;

const CONFIG_CLIENT_ID = functions.config().googleapi.client_id;
const CONFIG_CLIENT_SECRET = functions.config().googleapi.client_secret;
// The OAuth Callback Redirect.
const FUNCTIONS_REDIRECT = functions.config().googleapi.function_redirect  //`https://us-central1-telepatriot-[dev/prod].cloudfunctions.net/oauthcallback`;


var OAuth2 = google.auth.OAuth2;
var functionsOauthClient = new OAuth2(CONFIG_CLIENT_ID, CONFIG_CLIENT_SECRET,
                                FUNCTIONS_REDIRECT);

/***
to deploy everything in this file...
firebase deploy --only functions:getAuthorizedClient
***/


// CODE DUPLICATION: We have this function declared in demo-google-sheet-write.js and there
// are actually TWO versions of this function in import-master-sheet.js
exports.getAuthorizedClient = function() {
    console.log('getAuthorizedClient(): oauthTokens: ', oauthTokens)
    /* commented this out because was getting "Promise.success is not a function"
    if (oauthTokens) {
        return Promise.success(functionsOauthClient);
    }
    */
    return db.ref('/api_tokens').once('value').then(snapshot => {
        oauthTokens = snapshot.val();
        functionsOauthClient.credentials = oauthTokens;
        return functionsOauthClient;
    })
}
