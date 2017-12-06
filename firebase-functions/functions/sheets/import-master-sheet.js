'use strict';

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const google = require('googleapis')
const sheetIdUtil = require('./get-sheet-id')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


exports.readMasterSpreadsheet = functions.database.ref(`master_missions/{missionId}`).onWrite(
  event => {

    // Only edit data when it is first created.
    if (event.data.previous.exists()) {
        console.log('readMasterSpreadsheet: return early because event.data.previous.exists()')
        return false;
    }
    // Exit when the data is deleted.
    if (!event.data.exists()) {
        console.log('readMasterSpreadsheet: return early because !event.data.exists()')
        return false;
    }

    var masterMissionStuff = {}

    var sheet_id = event.data.val().sheet_id
    var adminRef = event.data.adminRef

    return readPromise(event.data.ref,
                       event.data.adminRef,
                       masterMissionStuff,
                       { spreadsheetId: sheet_id });

})


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

// setup for OauthCallback
const DB_TOKEN_PATH = '/api_tokens';


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
    .catch((err) => { console.log("error in getAuthorizedClient(): ", err)
    });
}



function readPromise(dbref, adminRef, masterMissionStuff, requestWithoutAuth) {
    console.log('import-master-sheet.js: readPromise: entered')

    return new Promise((resolve, reject) => {
        console.log('readPromise: new Promise(): entered')
        const sheets = google.sheets('v4');

        getAuthorizedClient().then(client => {

            const request = requestWithoutAuth;
            request.auth = client;
            request.range = 'Sheet1'
            var missionsAndData = {} // keyed by the mission name, i.e. "Test Idaho SD 34 - Brent Hill"
                                     // value is a [] of all the mission items from each sheet's Sheet1
            sheets.spreadsheets.values.get(request, (err, response) => {
                /********************
                if (err) {
                    console.log(`The API returned an error: ${err}`);
                    return reject();
                }

                var rows = response.values;
                var colnames = []
                var legislatorColumn = -1 // url column
                var campaignNameColumn = -1
                for(var c = 0; c < rows[0].length; c++) {
                    if(rows[0][c].toLowerCase() == 'legislator') {
                        legislatorColumn = c
                        colnames.push(rows[0][c].toLowerCase())
                    }
                    else if(rows[0][c].toLowerCase() == 'campaign name') {
                        campaignNameColumn = c
                        colnames.push(rows[0][c].toLowerCase())
                    }

                }

                for(var r = 1; r < rows.length; r++) {
                    // at each row, we need to read the url on that row...
                    var url = rows[r][legislatorColumn]
                    var sheet_id = sheetIdUtil.sheetId(url)
                    var missionName = rows[r][campaignNameColumn]

                    new Promise((resolve, reject) => {
                        sheets.spreadsheets.values.get(request, (err, response) => {})
                        console.log("r = "+r+" : response = ", response)
                        return resolve(response)
                    })
                    .then((xxxx) => { console.log("xxxx = ", xxxx)  })
                    .catch((err) => {
                        // This is where we should write a mission_event indicating the mission failed to save
                        console.log('Uh oh! Error caught in row loop: ', err); reject()
                    });


                }
                *******************/


            })

            console.log("return resolve(response), where response = ", response)

            return resolve(response)

        })
        .then((theResponse) => {
            console.log("XXXXXXCXXXXXXXXXXXXXXXXXXXXXXXX")
            console.log("theResponse : ", theResponse)
        })
        .then(() => {
        })
        .catch((err) => {
            console.log('Uh oh! Error in the outer block: ', err); reject()
        });

    })
    .catch((err) => {
        // This is where we should write a mission_event indicating the mission failed to save
        console.log('Uh oh! Error caught towards the end: ', err); reject()
    });
}



// HTTPS function to write new data to CONFIG_DATA_PATH, for testing
exports.testReadMasterSpreadsheet = functions.https.onRequest((req, res) => {

    var url = req.query.url
    var sheet_id = sheetIdUtil.sheetId(url)

    return db.ref(`master_missions`).push({ sheet_id: sheet_id }).then(
        () => {
            var stuff = 'OK<P/>req.query.url = '+url
            stuff += '<P/>sheet_id = '+sheet_id
            res.status(200).send(stuff)
        }
    )
})