'use strict';

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const google = require('googleapis')
const sheets = google.sheets('v4')
const sheetIdUtil = require('./get-sheet-id')
const sheetReader = require('./import-sheet')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

var adminRef
var ref
var created_by_name
var created_by_uid
var team
var mark_for_merge

exports.readMasterSpreadsheet = functions.database.ref(`teams/{teamname}/master_missions/{master_mission_id}`).onWrite(
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


    adminRef = event.data.adminRef
    ref = event.data.ref
    created_by_name = event.data.val().name
    created_by_uid = event.data.val().uid
    team = event.params.teamname
    mark_for_merge = event.data.val().mark_for_merge
    var sheet_id = sheetIdUtil.sheetId(event.data.val().url)

    var masterMissionStuff = { master_mission_id: event.params.master_mission_id,
                             active: event.data.val().active,
                             description: event.data.val().description,
                             //mission_create_date:,
                             mission_name: event.data.val().name,
                             mission_type: event.data.val().phone,
                             name: created_by_name,
                             uid: created_by_uid,
                             uid_and_active: created_by_uid+'_false',
                             url: event.data.val().url,
                             sheet_id: sheet_id,
                             mark_for_merge: mark_for_merge // <-- notice new attribute (12/7/17)
                            }

    return readPromise(masterMissionStuff,
                       { spreadsheetId: sheet_id });

})


const CONFIG_CLIENT_ID = functions.config().googleapi.client_id;
const CONFIG_CLIENT_SECRET = functions.config().googleapi.client_secret;
const CONFIG_SHEET_ID = functions.config().googleapi.sheet_id;
// The OAuth Callback Redirect.
const FUNCTIONS_REDIRECT = functions.config().googleapi.function_redirect  //`https://us-central1-telepatriot-bd737.cloudfunctions.net/oauthcallback`;

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
    console.log('getAuthorizedClient2(sheet_id): oauthTokens: ', oauthTokens)
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
    .catch((err) => { console.log("error in getAuthorizedClient2(sheet_id): ", err)
    });
}


function readPromise(masterMissionStuff, requestWithoutAuth) {
    console.log('import-master-sheet.js: readPromise: entered')

    const request = requestWithoutAuth
    request.range = 'Sheet1'
    //request.valueRenderOption = 'FORMULA' // you COULD do this but you don't want it because you could have other
                                            // column with formulas when what you really want there are the visible values

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


var getMasterSheetCallback = function(err, response) {
    if (err) {
        console.log(`getMasterSheetCallback(): The API returned an error: ${err}`);
        return
    }

    var rows = response.values;
    var colnames = []
    var urlColumn = -1 // url column
    var campaignNameColumn = -1
    for(var c = 0; c < rows[0].length; c++) {
        if(rows[0][c].toLowerCase() == 'url') {
            urlColumn = c
            colnames.push(rows[0][c].toLowerCase())
        }
        else if(rows[0][c].toLowerCase() == 'campaign name') {
            campaignNameColumn = c
            colnames.push(rows[0][c].toLowerCase())
        }

    }

    var number_of_missions_in_master_mission = 0
    for(var r = 1; r < rows.length; r++) {
        var theval = rows[r][urlColumn]
        if(theval && isUrl(theval)) {
            ++number_of_missions_in_master_mission
        }
        // instead of console.log() - just for testing/debugging
        //db.ref(`logs`).push().set({number_of_missions_in_master_mission: number_of_missions_in_master_mission})
    }

    for(var r = 1; r < rows.length; r++) {
        // now we need to get the url and mission name from each line
        // and write to a /teams/{teamname}/missions/{missionId} node and then
        // let the onWrite() trigger in import-sheet.js handle the rest of the
        // importing
        // at each row, we need to read the url on that row...
        var urlVal = rows[r][urlColumn]
        if(urlVal && isUrl(urlVal)) {

            var url = getUrl(urlVal)

            var sheet_id = sheetIdUtil.sheetId(url)
            var mission_name = rows[r][campaignNameColumn]

            var mission = { //mission_id:
                        active: false,
                        description: 'todo',
                        //mission_create_date:,
                        mission_name: mission_name,
                        mission_type: 'Phone Campaign',
                        name: created_by_name,
                        uid: created_by_uid,  // how do we get this?
                        uid_and_active: created_by_uid+'_false',
                        url: url,
                        sheet_id: sheet_id,
                        mark_for_merge: true, // <-- notice new attribute (12/7/17)
                        number_of_missions_in_master_mission: number_of_missions_in_master_mission // <-- notice new attribute (12/7/17)
                       }
                       // number_of_missions_in_master_mission will be used as the modulus when determining
                       // what the group_number should be for each mission_item

            db.ref(`teams/${team}/missions`).push(mission);

        }

    }
}


var isUrl = function(val) {
    if(!val) {
        db.ref(`logs`).push().set({thing: "return false early because val does not exist"})
        return false
    }
    else {
        var hyperlink = '=hyperlink("'
        var lower = val.toLowerCase().trim()
        if(lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith(hyperlink)) return true
        else {
            db.ref(`logs`).push().set({thing: "return false because val does not start right: "+val})
            return false
        }
    }
}


var getUrl = function(val) {
    if(!val) return
    var lower = val.toLowerCase().trim()
    var thisstr = '=hyperlink("'
    if(lower.startsWith(thisstr)) {
        lower = lower.substring(thisstr.length)
        var quoteIdx = lower.indexOf('"')
        if(quoteIdx != -1)
            lower = lower.substring(0, quoteIdx)
        return lower
    }
    else return val
}


// test/dev function
exports.testReadMasterSpreadsheet = functions.https.onRequest((req, res) => {

    var url = req.query.url
    var sheet_id = sheetIdUtil.sheetId(url)
    var creator = 'Brent Dunklau'
    var creator_uid = 'MdaK0ltYeue0oGYF6gdks5S0yFh2'

    var master_mission = { //mission_id:
                    active: false,
                    description: 'todo',
                    //mission_create_date:,
                    master_mission_name: req.query.master_mission_name,
                    mission_type: 'Phone Campaign',
                    name: creator,
                    uid: creator_uid,
                    uid_and_active: creator_uid+'_false',
                    url: url,
                    //sheet_id: sheet_id, // determine this in the onWrite() trigger
                    mark_for_merge: true // <-- notice new attribute (12/7/17)
                   }

    return db.ref(`teams/The Cavalry/master_missions`).push(master_mission).then(
        () => {
            var stuff = 'OK<P/>req.query.url = '+url
            stuff += '<P/>sheet_id = '+sheet_id
            stuff += '<P/>master_mission_name = '+req.query.master_mission_name
            res.status(200).send(stuff)
        }
    )
})