'use strict';

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

const HARDCODED_SHEET_ID = '1WXn8VMIfgIhzNNvx5NFEJmGUCsMGrufFU9r_743ukGs'
const HARDCODED_MISSION_ID = '2'

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


// trigger function to write to Sheet when new data comes in on CONFIG_DATA_PATH
exports.readSpreadsheet = functions.database.ref(`missions/{missionId}/{sheetId}`).onWrite(
  event => {
    const newRecord = event.data.current.val();
    console.log('readSpreadsheet:  newRecord = ', newRecord)
    console.log('readSpreadsheet:  event.params.sheetId = ', event.params.sheetId)


    var sheets = google.sheets('v4');
    sheets.spreadsheets.values.get({
        auth: auth,
        spreadsheetId: event.params.sheetId,
        range: 'Sheet1', // <-- read the whole sheet by just leaving the cell range out
    }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
      }
      var rows = response.values;
      if (rows.length == 0) {
          console.log('No data found.');
      } else {
          console.log('Name, Major:');
          for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            // Print columns A and E, which correspond to indices 0 and 4.
            console.log('%s, %s', row[0], row[4]);
          }
      }
  });

});


// HTTPS function to write new data to CONFIG_DATA_PATH, for testing
exports.testsheetImport = functions.https.onRequest((req, res) => {

  return db.ref(`missions/${HARDCODED_MISSION_ID}/${HARDCODED_SHEET_ID}`).set({
    firstColumn: random1,
    secondColumn: random2,
    thirdColumn: random3
  }).then(() => res.status(200).send(
    `Wrote ${random1}, ${random2}, ${random3} to DB, trigger should now update Sheet.`));
});



function readSheet(auth) {
  var sheets = google.sheets('v4');
  sheets.spreadsheets.values.get({
    auth: auth,
    spreadsheetId: HARDCODED_SHEET_ID,
    range: 'Sheet1', // <-- read the whole sheet by just leaving the cell range out
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var rows = response.values;
    if (rows.length == 0) {
      console.log('No data found.');
    } else {
      console.log('Name, Major:');
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        // Print columns A and E, which correspond to indices 0 and 4.
        console.log('%s, %s', row[0], row[4]);
      }
    }
  });

}