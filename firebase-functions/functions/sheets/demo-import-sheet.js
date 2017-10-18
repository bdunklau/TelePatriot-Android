'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
//const googleAuth = require('google-auth-library');
const google = require('googleapis');
const sheetIdUtil = require('./get-sheet-id')
const date = require('../dateformat')

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
exports.readSpreadsheet = functions.database.ref(`missions/{missionId}`).onWrite(
  event => {

    // Only edit data when it is first created.
    if (event.data.previous.exists()) {
        console.log('readSpreadsheet: return early because event.data.previous.exists()')
        return false;
    }
    // Exit when the data is deleted.
    if (!event.data.exists()) {
        console.log('readSpreadsheet: return early because !event.data.exists()')
        return false;
    }

    console.log('event.data.val() = ', event.data.val())
    var uid = event.data.val().uid
    var millis = date.asMillis()
    var status = 'not started'
    event.data.ref.child('mission_create_date').set(date.asCentralTime())
    event.data.ref.child('uid_date_status').set(uid+'_'+millis+'_'+status)


    //var missionId = event.params.missionId
    //var mission_type = event.data.val().mission_type
    //var mission_name = event.data.val().mission_name
    //event.data.adminRef.root.child(`missions/${missionId}/mission_type`).set(mission_type)
    //event.data.adminRef.root.child(`missions/${missionId}/mission_name`).set(mission_name)

    //console.log('readSpreadsheet: event.data.val(): ', event.data.val())
    //var missionId = event.params.missionId
    var sheet_id = sheetIdUtil.sheetId(event.data.val().url)
    var dbref = event.data.ref

    return readPromise(dbref, {
      spreadsheetId: sheet_id,
      range: 'Sheet1'
    });
});


function readPromise(dbref, requestWithoutAuth) {
  console.log('readPromise: entered')

  return new Promise((resolve, reject) => {
    console.log('readPromise: new Promise(): entered')
    getAuthorizedClient().then(client => {
      console.log('readPromise: new Promise(): getAuthorizedClient().then(): entered')

      const sheets = google.sheets('v4');
      const request = requestWithoutAuth;
      request.auth = client;
      sheets.spreadsheets.values.get(request, (err, response) => {
        if (err) {
          console.log(`The API returned an error: ${err}`);
          return reject();
        }

        //console.log('readPromise:  response: ', response)

        var rows = response.values;
        var colnames = []
        for(var c = 0; c < rows[0].length; c++) {
            colnames.push(rows[0][c])
        }
        var data = []
        for(var r = 1; r < rows.length; r++) {
            var datarow = {}
            for(var c = 0; c < rows[0].length; c++) {
                if(rows[r][c])
                    datarow[colnames[c]] = rows[r][c];
            }
            data.push(datarow)
        }

        dbref.child('data').set(data)

        // got this from example code.  Not really sure what this does
        return resolve(response);
      });
    })
    .then(() => { dbref.child('sheet_id').set(requestWithoutAuth.spreadsheetId) })
    .then(() => {
        // write a mission_event to log the creation of this mission so we can report back
        // to the user if the mission was successfully created or there was an error
        // Include in the mission_event:  current time, current user, success, number of
        // items in the mission
        var mission_event = {date: date.asCentralTime()}
    })
    .catch((err) => {
        // This is where we should write a mission_event indicating the mission failed to save
        console.log('Uh oh! Error caught in appendPromise(): ', err); reject()
    });
  });
}


// HTTPS function to write new data to CONFIG_DATA_PATH, for testing
exports.testsheetImport = functions.https.onRequest((req, res) => {

  return db.ref(`missions`).push({ sheet_id: HARDCODED_SHEET_ID }).then(
     () => res.status(200).send(
    `Wrote stuff at `+(new Date())));
});

