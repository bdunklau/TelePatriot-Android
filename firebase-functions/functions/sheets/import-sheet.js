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
// The OAuth Callback Redirect.
const FUNCTIONS_REDIRECT = functions.config().googleapi.function_redirect  //`https://us-central1-telepatriot-bd737.cloudfunctions.net/oauthcallback`;

const HARDCODED_SHEET_ID = '1WXn8VMIfgIhzNNvx5NFEJmGUCsMGrufFU9r_743ukGs'
const HARDCODED_MISSION_ID = '2'

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
    //var millis = date.asMillis()
    //var status = 'not started'

    var missionStuff = {mission_id: event.params.missionId,
                        active: event.data.val().active,
                        description: event.data.val().description, // don't have this yet, not ready
                        mission_create_date: date.asCentralTime(),
                        mission_name: event.data.val().mission_name,
                        mission_type: event.data.val().mission_type,
                        name: event.data.val().name,
                        script: event.data.val().script,           // don't have this yet, not ready
                        uid: event.data.val().uid,
                        uid_and_active: event.data.val().uid_and_active,
                        url: event.data.val().url
                        }

    event.data.ref.child('mission_create_date').set(date.asCentralTime())
    //event.data.ref.child('uid_date_status').set(uid+'_'+millis+'_'+status)
    event.data.ref.child('uid_and_active').set(uid+'_'+event.data.val().active)


    //var missionId = event.params.missionId
    //var mission_type = event.data.val().mission_type
    //var mission_name = event.data.val().mission_name
    //event.data.adminRef.root.child(`missions/${missionId}/mission_type`).set(mission_type)
    //event.data.adminRef.root.child(`missions/${missionId}/mission_name`).set(mission_name)

    //console.log('readSpreadsheet: event.data.val(): ', event.data.val())
    //var missionId = event.params.missionId
    var sheet_id = sheetIdUtil.sheetId(event.data.val().url)
    var adminRef = event.data.adminRef

    return readPromise(event.data.ref,
                       event.data.adminRef,
                       missionStuff,
                       { spreadsheetId: sheet_id });
});


function readPromise(dbref, adminRef, missionStuff, requestWithoutAuth) {
    console.log('readPromise: entered')

    return new Promise((resolve, reject) => {
        console.log('readPromise: new Promise(): entered')
        const sheets = google.sheets('v4');

        getAuthorizedClient().then(client => {
            console.log('readPromise: new Promise(): getAuthorizedClient().then(): entered')

            const request = requestWithoutAuth;
            request.auth = client;
            request.range = 'Description'
            console.log('readPromise: looking for mission description: check client = ', client)
            sheets.spreadsheets.values.get(request, (err, response) => {
                if (err) {
                    console.log(`The API returned an error: ${err}`);
                    return reject();
                }

                console.log('readPromise: looking for mission description: inside callback: response.values = ', response.values)
                var rows = response.values;
                var description = '';
                if(rows.length > 0 && rows[0].length > 0) {
                    dbref.child('description').set(rows[0][0])
                    missionStuff.description = rows[0][0]


                    // recursive callbacks...
                    request.range = 'Script'
                    console.log('readPromise: looking for mission Script: check client = ', client)
                    sheets.spreadsheets.values.get(request, (err, response) => {
                        if (err) {
                            console.log(`The API returned an error: ${err}`);
                            return reject();
                        }

                        console.log('readPromise: looking for mission Script: inside callback: response.values = ', response.values)
                        var rows = response.values;
                        var description = '';
                        if(rows.length > 0 && rows[0].length > 0) {
                            dbref.child('script').set(rows[0][0])
                            missionStuff.script = rows[0][0]

                            request.range = 'Sheet1'
                            // another inner callback, this time to get read each row of people
                            sheets.spreadsheets.values.get(request, (err, response) => {
                                  if (err) {
                                      console.log(`The API returned an error: ${err}`);
                                      return reject();
                                  }

                                  //console.log('readPromise:  response: ', response)

                                  var rows = response.values;
                                  var columnInfo = getMissionColumnInfo(rows)
                                  /***************
                                  var colnames = []
                                  var emailColumn = -1
                                  var phoneColumn = -1
                                  var threeWayPhoneColumn = -1
                                  var threeWayNameColumn = -1
                                  for(var c = 0; c < rows[0].length; c++) {
                                        if(rows[0][c].toLowerCase() == 'email') {
                                            emailColumn = c
                                            colnames.push(rows[0][c].toLowerCase())
                                        }
                                        else if(isPhoneColumn(rows[0][c])) {
                                            phoneColumn = c
                                            colnames.push("phone")
                                        }
                                        else if(is3WayPhoneColumn(rows[0][c])) {
                                            threeWayPhoneColumn = c
                                            colnames.push("phone2")
                                        }
                                        else if(is3WayNameColumn(rows[0][c])) {
                                            threeWayNameColumn = c
                                            colnames.push("name2")
                                        }
                                        else {
                                            colnames.push(rows[0][c].toLowerCase())
                                        }
                                  }
                                  ************/

                                  for(var r = 1; r < rows.length; r++) {
                                        var missionItemRowInfo = eachMissionItem(rows, adminRef, columnInfo.emailColumn, columnInfo.phoneColumn)
                                        /*****************
                                        var missionCopy = JSON.parse(JSON.stringify(missionStuff))
                                        var hasPhone = true;

                                        for(var c = 0; c < rows[0].length; c++) {
                                            // as long as the cell has data in it...
                                            if(rows[r][c]) {

                                                // see if it's the email column so we can strip any " (Yes)" or " (No)" from email strings
                                                if(c == emailColumn) {
                                                    var stripped = stripYesNo(rows[r][c])
                                                    missionCopy[colnames[c]] = stripped;
                                                }
                                                else {
                                                    // otherwise just store the cell data
                                                    missionCopy[colnames[c]] = rows[r][c];
                                                }
                                            }
                                            else if(c == phoneColumn) {
                                                // The if block above was false, meaning no data in that cell
                                                // So are we on the phone column?  If so, skip the whole row - don't
                                                // write it to the database because we can't call this person anyway
                                                hasPhone = false
                                            }
                                        }
                                        **************/

                                        saveIfHasPhone(missionItemRowInfo.hasPhone, missionItemRowInfo.missionCopy, adminRef)
                                        /***************
                                        if(hasPhone) {
                                            // compound key: capture the status of the mission (new, in progress, complete) together
                                            // with the active status (true/false) to figure out if this mission item is suitable
                                            // for assigning to a volunteer.
                                            // It's suitable if active_and_accomplished: true_new
                                            missionCopy['accomplished'] = "new"
                                            missionCopy['active_and_accomplished'] = "false_new"  // <--- not ready to be assigned because the mission isn't active yet
                                            adminRef.root.child('mission_items').push().set(missionCopy)
                                        }
                                        ************/

                                  }

                            });


                        } // if(rows.length > 0 && rows[0].length > 0)
                    })


                } // if(rows.length > 0 && rows[0].length > 0)
            })


            return resolve(response);

        })
        .then(() => { dbref.child('sheet_id').set(requestWithoutAuth.spreadsheetId) })
        .then(() => {
            // write a mission_event to log the creation of this mission so we can report back
            // to the user if the mission was successfully created or there was an error
            // Include in the mission_event:  current time, current user, success, number of
            // items in the mission
            //
            // I dunno ...maybe
            //
            var mission_event = {date: date.asCentralTime()}
        })
        .catch((err) => {
            // This is where we should write a mission_event indicating the mission failed to save
            console.log('Uh oh! Error caught in appendPromise(): ', err); reject()
        });
    });
}


var getMissionColumnInfo = function(rows) {

    var colnames = []
    var emailColumn = -1
    var phoneColumn = -1
    var threeWayPhoneColumn = -1
    var threeWayNameColumn = -1
    for(var c = 0; c < rows[0].length; c++) {
        if(rows[0][c].toLowerCase() == 'email') {
            emailColumn = c
            colnames.push(rows[0][c].toLowerCase())
        }
        else if(isPhoneColumn(rows[0][c])) {
            phoneColumn = c
            colnames.push("phone")
        }
        else if(is3WayPhoneColumn(rows[0][c])) {
            threeWayPhoneColumn = c
            colnames.push("phone2")
        }
        else if(is3WayNameColumn(rows[0][c])) {
            threeWayNameColumn = c
            colnames.push("name2")
        }
        else {
            colnames.push(rows[0][c].toLowerCase())
        }
    }

    return {colnames: colnames,
            emailColumn: emailColumnm,
            phoneColumn: phoneColumn,
            threeWayPhoneColumn: threeWayPhoneColumn,
            threeWayNameColumn: threeWayNameColumn}
}


var eachMissionItem = function(rows, adminRef, emailColumn, phoneColumn) {

    var missionCopy = JSON.parse(JSON.stringify(missionStuff))
    var hasPhone = true;

    for(var c = 0; c < rows[0].length; c++) {
        // as long as the cell has data in it...
        if(rows[r][c]) {

            // see if it's the email column so we can strip any " (Yes)" or " (No)" from email strings
            if(c == emailColumn) {
                var stripped = stripYesNo(rows[r][c])
                missionCopy[colnames[c]] = stripped;
            }
            else {
                // otherwise just store the cell data
                missionCopy[colnames[c]] = rows[r][c];
            }
        }
        else if(c == phoneColumn) {
            // The if block above was false, meaning no data in that cell
            // So are we on the phone column?  If so, skip the whole row - don't
            // write it to the database because we can't call this person anyway
            hasPhone = false
        }
    }

    return {hasPhone: hasPhone, missionCopy: missionCopy}
}


var saveIfHasPhone = function(hasPhone, missionCopy, adminRef) {
    if(hasPhone) {
        // compound key: capture the status of the mission (new, in progress, complete) together
        // with the active status (true/false) to figure out if this mission item is suitable
        // for assigning to a volunteer.
        // It's suitable if active_and_accomplished: true_new
        missionCopy['accomplished'] = "new"
        missionCopy['active_and_accomplished'] = "false_new"  // <--- not ready to be assigned because the mission isn't active yet
        adminRef.root.child('mission_items').push().set(missionCopy)
    }
}


var stripYesNo = function(val) {
    if(!val)
        return ''
    if(val.toLowerCase().indexOf("(no)") != -1) {
        var idx = val.toLowerCase().indexOf("(no)")
        return val.substring(0, idx).trim()
    }
    else if(val.toLowerCase().indexOf("(yes)") != -1) {
        var idx = val.toLowerCase().indexOf("(yes)")
        return val.substring(0, idx).trim()
    }
    else return val
}

var isPhoneColumn = function(val) {
    if(!val)
        return false
    var lower = val.toLowerCase()
    if(lower == "phone" || lower == "phone#" || lower == "phone number" || lower == "phone num" || lower == "phone #")
        return true
    else return false
}


/**
If we find a column named "phone2" that's how we'll know this is a 3way call mission
**/
var is3WayPhoneColumn = function(val) {
    return isNamed(val, "phone2")
}


/**
If we find a column named "phone2" that's how we'll know this is a 3way call mission
**/
var is3WayNameColumn = function(val) {
    return isNamed(val, "name2")
}


var isNamed = function(val, named) {
    if(!val)
        return false
    var lower = val.toLowerCase()
    if(lower == named)
        return true
    else return false
}


// HTTPS function to write new data to CONFIG_DATA_PATH, for testing
exports.testsheetImport = functions.https.onRequest((req, res) => {

  return db.ref(`missions`).push({ sheet_id: HARDCODED_SHEET_ID }).then(
     () => res.status(200).send(
    `Wrote stuff at `+(new Date())));
});


// REPLACE THE FUNCTION BELOW WITH A TRIGGER THAT WILL DELETE MISSION ITEMS
// (under /mission_items) WHEN THE ASSOCIATE /missions NODE IS REMOVED
// HTTPS function to write new data to CONFIG_DATA_PATH, for testing
exports.deleteMissionItems = functions.https.onRequest((req, res) => {

  return db.ref(`mission_items`).remove()
});

