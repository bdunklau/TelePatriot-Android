'use strict';

// Sample trigger function that copies new Firebase data to a Google Sheet

// SOURCE:  https://github.com/firebase/functions-samples/blob/master/google-sheet-sync/functions/index.js


/***************************
READ THIS   ...SERIOUSLY

INSPIRATION:  The inspiration for this script is https://github.com/firebase/functions-samples/tree/master/google-sheet-sync
That page has a few url's wrong thought.  The instructions below are 100% correct.


Functions that access google sheets have to be configured in a very specific way.
We have to tell google what our app's client id is what that app's client secret is.

You do that from the command line on local pc, from the firebase-functions/functions directory

The command looks like this:

firebase functions:config:set googleapi.client_id="****EXPLAINED BELOW****" googleapi.client_secret="****EXPLAINED BELOW****"

Here's how you get the client id and client secret
1.  Go here https://console.developers.google.com/apis/credentials?project=telepatriot-bd737
2.  Scroll down to the "OAuth 2.0 client IDs" section
3.  click the edit pencil next to Web client 2 (or whatever we're using lately)
4.  client id and client secret are listed at the top

If you have to create a new OAuth 2.0 client ID, here's how you do it.
1.  Go here https://console.developers.google.com/apis/credentials?project=telepatriot-bd737
2.  Make sure you're on the Credentials tab
3.  Pull down "Create credentials"
4.  Choose "OAuth client ID"
5.  Choose "Web application"
6.  "Authorized redirect URIs" is the only field we care about
7.  Enter https://us-central1-telepatriot-bd737.cloudfunctions.net/oauthcallback
8.  Hit save/create/whatever - done

Put the client id and client secret into the "firebase functions:config:set..." command above
Run that command
Then do:  firebase deploy --only functions

After deploying the functions, you'll get this output on the command line:
Function URL (authgoogleapi): https://us-central1-telepatriot-bd737.cloudfunctions.net/authgoogleapi
Function URL (oauthcallback): https://us-central1-telepatriot-bd737.cloudfunctions.net/oauthcallback
Function URL (testsheetwrite): https://us-central1-telepatriot-bd737.cloudfunctions.net/testsheetwrite

Point your browser to the first url to call the authgoogleapi function (which is further down in this script):
https://us-central1-telepatriot-bd737.cloudfunctions.net/authgoogleapi

This URL asks google for credentials that are needed to read and write to google sheets

After you have authorized the telepatriot app, you will then point your browser to:
https://us-central1-telepatriot-bd737.cloudfunctions.net/testsheetwrite

The /testsheetwrite url is mapped to the testsheetwrite function (also below).  testsheetwrite writes to the
database at a hard-coded location.  The spreadsheet id and mission id are HARDCODED in the
database path in testsheetwrite.  So obviously we won't be writing to this path under
normal operation.

When you paste https://us-central1-telepatriot-bd737.cloudfunctions.net/testsheetwrite
into the browser, google will respond with something like this:
"Wrote 31, 24, 28 to DB, trigger should now update Sheet."

So go look at the google spreadsheet to confirm.

This whole file just demonstrates how to write to google sheets.  It's not production-ready code
***************************/



const functions = require('firebase-functions');
const admin = require('firebase-admin');
//const googleAuth = require('google-auth-library');
const google = require('googleapis');

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

// SEE THE INSTRUCTIONS AT THE TOP OF THIS SCRIPT  ...SERIOUSLY
// googleapi.client_id = Google API client ID,
// googleapi.client_secret = client secret, and
// googleapi.sheet_id = Google Sheet id (long string in middle of sheet URL)
//
// run this on local command line...
// CAN'T PUT CLIENT SECRET HERE BECAUSE OF GITHUB.
// firebase functions:config:set googleapi.client_id="****SEE INSTRUCTIONS****" googleapi.client_secret="****SEE INSTRUCTIONS****"

const CONFIG_CLIENT_ID = functions.config().googleapi.client_id;
const CONFIG_CLIENT_SECRET = functions.config().googleapi.client_secret;
const CONFIG_SHEET_ID = functions.config().googleapi.sheet_id;

const HARDCODED_SHEET_ID = '178GnEv36vJ_2Odke_JvRHwNI3nS48bfV23jWak4F1Dc'
const HARDCODED_MISSION_ID = '1'

// The OAuth Callback Redirect.
const FUNCTIONS_REDIRECT = `https://us-central1-telepatriot-bd737.cloudfunctions.net/oauthcallback`;

// setup for authGoogleAPI
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var OAuth2 = google.auth.OAuth2;
var functionsOauthClient = new OAuth2(CONFIG_CLIENT_ID, CONFIG_CLIENT_SECRET,
                                FUNCTIONS_REDIRECT);

// OAuth token cached locally.
let oauthTokens = null;


// visit the URL for this Function to request tokens
exports.authgoogleapi = functions.https.onRequest((req, res) =>
  res.redirect(functionsOauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  }))
);

// setup for OauthCallback
const DB_TOKEN_PATH = '/api_tokens';

// after you grant access, you will be redirected to the URL for this Function
// this Function stores the tokens to your Firebase database
exports.oauthcallback = functions.https.onRequest((req, res) => {
  const code = req.query.code;
  functionsOauthClient.getToken(code, (err, tokens) => {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (err) {
      res.status(400).send(err);
      return;
    }
    db.ref(DB_TOKEN_PATH).set(tokens).then(
        () => res.status(200).send('App successfully configured with new Credentials. ' +
                                   'You can now close this page.'));
  });
});


// trigger function to write to Sheet when new data comes in on CONFIG_DATA_PATH
exports.appendrecordtospreadsheet = functions.database.ref(`missions/{missionId}/{sheetId}`).onWrite(
  event => {
    const newRecord = event.data.current.val();
    console.log('appendrecordtospreadsheet:  newRecord = ', newRecord)
    console.log('appendrecordtospreadsheet:  event.params.sheetId = ', event.params.sheetId)
    return updatePromise({
      spreadsheetId: event.params.sheetId,
      range: 'Sheet1!A1:C1',
      valueInputOption: 'USER_ENTERED',
      //insertDataOption: 'INSERT_ROWS', // comment this out when updating, uncomment when appending
      resource: {
        values: [[newRecord.firstColumn, newRecord.secondColumn, newRecord.thirdColumn]]
      }
    });
});

/*
// accepts an append request, returns a Promise to append it, enriching it with auth
// see also:  https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/update
function appendPromise(requestWithoutAuth) {
  return new Promise((resolve, reject) => {
    getAuthorizedClient().then(client => {
      const sheets = google.sheets('v4');
      const request = requestWithoutAuth;
      request.auth = client;
      sheets.spreadsheets.values.append(request, (err, response) => {
        if (err) {
          console.log(`The API returned an error: ${err}`);
          return reject();
        }
        return resolve(response);
      });
    }).catch((err) => {console.log('Uh oh! Error caught in appendPromise(): ', err); reject()});
  });
}
*/

// accepts an append request, returns a Promise to append it, enriching it with auth
function updatePromise(requestWithoutAuth) {
  return new Promise((resolve, reject) => {
    getAuthorizedClient().then(client => {
      const sheets = google.sheets('v4');
      const request = requestWithoutAuth;
      request.auth = client;
      sheets.spreadsheets.values.update(request, (err, response) => {
        if (err) {
          console.log(`The API returned an error: ${err}`);
          return reject();
        }
        return resolve(response);
      });
    }).catch((err) => {console.log('Uh oh! Error caught in appendPromise(): ', err); reject()});
  });
}


// checks if oauthTokens have been loaded into memory, and if not, retrieves them
function getAuthorizedClient() {
  console.log('getAuthorizedClient(): oauthTokens: ', oauthTokens)
  /* commented this out because was getting "Promise.success is not a function"
  if (oauthTokens) {
    return Promise.success(functionsOauthClient);
  }
  */
  return db.ref(DB_TOKEN_PATH).once('value').then(snapshot => {
    oauthTokens = snapshot.val();
    functionsOauthClient.credentials = oauthTokens;
    return functionsOauthClient;
  })
}

// HTTPS function to write new data to CONFIG_DATA_PATH, for testing
exports.testsheetwrite = functions.https.onRequest((req, res) => {
  console.log('CONFIG_CLIENT_ID: ', CONFIG_CLIENT_ID)
  console.log('CONFIG_CLIENT_SECRET: ', CONFIG_CLIENT_SECRET)
  const random1 = Math.floor(Math.random() * 100);
  const random2 = Math.floor(Math.random() * 100);
  const random3 = Math.floor(Math.random() * 100);
  const ID = new Date().getUTCMilliseconds();
  return db.ref(`missions/${HARDCODED_MISSION_ID}/${HARDCODED_SHEET_ID}`).set({
    firstColumn: random1,
    secondColumn: random2,
    thirdColumn: random3
  }).then(() => res.status(200).send(
    `Wrote ${random1}, ${random2}, ${random3} to DB, trigger should now update Sheet.`));
});