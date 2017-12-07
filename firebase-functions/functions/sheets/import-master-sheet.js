'use strict';

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const google = require('googleapis')
const sheets = google.sheets('v4')
const sheetIdUtil = require('./get-sheet-id')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

var adminRef

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
    adminRef = event.data.adminRef

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

// This "2" version takes sheet_id as parameter
// checks if oauthTokens have been loaded into memory, and if not, retrieves them
function getAuthorizedClient2(sheet_id) {
    console.log('getAuthorizedClient(): oauthTokens: ', oauthTokens)
      /* commented this out because was getting "Promise.success is not a function"
      if (oauthTokens) {
        return Promise.success(functionsOauthClient);
      }
      */
    return db.ref(DB_TOKEN_PATH).once('value').then(snapshot => {
        oauthTokens = snapshot.val();
        functionsOauthClient.credentials = oauthTokens;
        return {client: functionsOauthClient, sheet_id: sheet_id};
    })
    .catch((err) => { console.log("error in getAuthorizedClient(): ", err)
    });
}



function readPromise(dbref, adminRef, masterMissionStuff, requestWithoutAuth) {
    console.log('import-master-sheet.js: readPromise: entered')

    const request = requestWithoutAuth;
    request.range = 'Sheet1'

    return new Promise((resolve, reject) => {
        console.log('readPromise: new Promise(): entered')

        getAuthorizedClient().then(client => {
            request.auth = client;
            sheets.spreadsheets.values.get(request, getMasterSheetCallback)
        })
        .catch((err) => {
            console.log('Uh oh! Error in the outer block: ', err);
        });

        return resolve(true)
    })
    .catch((err) => {
        // This is where we should write a mission_event indicating the mission failed to save
        console.log('Uh oh! Error caught towards the end: ', err);
    });
}



var tempUrls = []
var allMissionItems = [] // might move away from this
var masterList = {}

var getMasterSheetCallback = function(err, response) {
    if (err) {
        console.log(`getMasterSheetCallback(): The API returned an error: ${err}`);
        return
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

    console.log("rows.length = ", rows.length)

    for(var r = 1; r < rows.length; r++) {
        // at each row, we need to read the url on that row...
        var url = rows[r][legislatorColumn]
        var sheet_id = sheetIdUtil.sheetId(url)
        var missionName = rows[r][campaignNameColumn]
        tempUrls.push({url: url, missionName: missionName})
        console.log("tempUrls.push(): {url: url, missionName: missionName} = ", {url: url, missionName: missionName})

        // Now read each spreadsheet...
        getAuthorizedClient2(sheet_id).then(stuff => {
            var client = stuff.client
            var sheet_id = stuff.sheet_id
            var request = { spreadsheetId: sheet_id }
            request.auth = client;
            request.range = 'Description'
            console.log("different sheet_id?... ", sheet_id)
            sheets.spreadsheets.values.get(request, function(err, response) { // first, get mission description
                if (err) {
                    console.log(`getMissionDescriptionCallback(): The API returned an error: ${err}`)
                }

                console.log("CHECK THIS request.spreadsheetId = ", request.spreadsheetId) // looks like we're able to get the sheetId this way !
                masterList[request.spreadsheetId] = {}

                var rows = response.values;
                if(rows.length > 0 && rows[0].length > 0) {
                    masterList[request.spreadsheetId]['description'] = rows[0][0]
                    //adminRef.root.child('master_mission_info').push().set({description: rows[0][0]}) // works
                    getScript(masterList, request.spreadsheetId, request)

                }
            })
        })
    }
}


var getScript = function(masterList, sheetId, request) {

    request.range = 'Script'
    sheets.spreadsheets.values.get(request, (err, response) => {
        if (err) {
            console.log(`getScript(): The API returned an error: ${err}`);
            return
        }

        var rows = response.values;
        masterList[sheetId]['script'] = '';
        if(rows.length > 0 && rows[0].length > 0) {
            masterList[sheetId]['script'] = rows[0][0]
            //adminRef.root.child('master_mission_info').push().set({script: rows[0][0]}) // works
        }

        readMissionItems(sheetId, masterList[sheetId], request)
    })
}


var readMissionItems = function(sheetId, missionStuff, request) {
    request.range = 'Sheet1'
    // another inner callback, this time to get read each row of people
    sheets.spreadsheets.values.get(request, (err, response) => {
        if (err) {
            console.log(`readMissionItems(): The API returned an error while trying to read mission items: ${err}`)
            return
        }

        var rows = response.values;
        var columnInfo = getMissionColumnInfo(rows)

        for(var r = 1; r < rows.length; r++) {
            var missionItemRowInfo = eachMissionItem(r, rows, adminRef, columnInfo.colnames, columnInfo.emailColumn, columnInfo.phoneColumn, missionStuff)
            saveIfHasPhone(sheetId, masterList, missionItemRowInfo.hasPhone, missionItemRowInfo.missionCopy, adminRef)
        }
    })
}


var eachMissionItem = function(r, rows, adminRef, colnames, emailColumn, phoneColumn, missionStuff) {

    // works but only needed for testing/dev
    adminRef.root.child('master_mission_info').push().set({missionStuff: missionStuff})

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


var saveIfHasPhone = function(sheetId, masterList, hasPhone, missionCopy, adminRef) {
    if(hasPhone) {
        // compound key: capture the status of the mission (new, in progress, complete) together
        // with the active status (true/false) to figure out if this mission item is suitable
        // for assigning to a volunteer.
        // It's suitable if active_and_accomplished: true_new
        missionCopy['accomplished'] = "new"
        missionCopy['active_and_accomplished'] = "false_new"  // <--- not ready to be assigned because the mission isn't active yet
        //adminRef.root.child('master_mission_items').push().set(missionCopy) // temp, remove

        //console.log("missionCopy = ", missionCopy)
        masterList[sheetId].push(missionCopy)
    }
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
            emailColumn: emailColumn,
            phoneColumn: phoneColumn,
            threeWayPhoneColumn: threeWayPhoneColumn,
            threeWayNameColumn: threeWayNameColumn}
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



var getMissionSheetCallback = function(err, response) {
    console.log("getMissionSheetCallback ---------------")

    var rows = response.values;
    for(var r = 1; r < rows.length; r++) {
        allMissionItems.push(rows[r])
        // sanity check...
        if(r == rows.length -1) {
            console.log("rows["+r+"] = ", rows[r])
        }
    }
    console.log("allMissionItems.length = ", allMissionItems.length)
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