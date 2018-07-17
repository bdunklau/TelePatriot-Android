'use strict';

/********************************************************************************
See also video.js.  That file was created to test uploading videos to YouTube
But we aren't going to be uploading videos from firebase functions because of the
timeout limit.  Everything else, like creating playlists and adding videos to playlists,
we ARE going to be doing from firebase functions.  And that's what we're going to
do here
********************************************************************************/

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const google = require('googleapis');
//const googleAuth = require('google-auth-library');

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

const CONFIG_CLIENT_ID = functions.config().googleapi.client_id;
const CONFIG_CLIENT_SECRET = functions.config().googleapi.client_secret;
// The OAuth Callback Redirect.
const FUNCTIONS_REDIRECT = functions.config().googleapi.function_redirect  //`https://us-central1-telepatriot-bd737.cloudfunctions.net/oauthcallback`;

// setup for authGoogleAPI
const SCOPES = ['https://www.googleapis.com/auth/youtube']; // ref: https://developers.google.com/youtube/v3/docs/playlists/insert
var OAuth2 = google.auth.OAuth2;
var functionsOauthClient = new OAuth2(CONFIG_CLIENT_ID, CONFIG_CLIENT_SECRET,
                                FUNCTIONS_REDIRECT);

exports.youtube_main = functions.https.onRequest((req, res) => {
    return render(res)
})

/*********
exports.createPlaylist = functions.https.onRequest((req, res) => {

    return new Promise((resolve, reject) => {
        const sheets = google.sheets('v4');

        getAuthorizedClient().then(client => {

            const request = requestWithoutAuth;
            request.auth = client;
            request.range = 'Description'
            sheets.spreadsheets.values.get(request, (err, response) => {
                if (err) {
                    return reject();
                }

                var rows = response.values;
                var description = '';
                if(rows.length > 0 && rows[0].length > 0) {
                    dbref.child('description').set(rows[0][0])
                    missionStuff.description = rows[0][0]


                    // recursive callbacks...
                    request.range = 'Script'
                    sheets.spreadsheets.values.get(request, (err, response) => {
                        if (err) {
                            return reject();
                        }

                        var rows = response.values;
                        var description = '';
                        if(rows.length > 0 && rows[0].length > 0) {
                            dbref.child('script').set(rows[0][0])
                            missionStuff.script = rows[0][0]

                            request.range = 'Sheet1'
                            // another inner callback, this time to read each row of people
                            sheets.spreadsheets.values.get(request, (err, response) => {
                                  if (err) {
                                      return reject();
                                  }

                                  var rows = response.values;
                                  var columnInfo = getMissionColumnInfo(rows)
                                  var totalRowsInSpreadsheetWithPhone = 0

                                  for(var r = 1; r < rows.length; r++) {
                                        var missionItemRowInfo = exports.eachMissionItem(r, rows, adminRef, columnInfo.colnames, columnInfo.emailColumn, columnInfo.phoneColumn, missionStuff)
                                        if(missionItemRowInfo.hasPhone) { ++totalRowsInSpreadsheetWithPhone }
                                        exports.saveIfHasPhone(missionItemRowInfo.hasPhone, missionItemRowInfo.missionCopy, dbref)
                                  }

                                  dbref.child('total_rows_in_spreadsheet').set(rows.length - 1) // // -1 so we don't count the header row
                                  dbref.child('total_rows_in_spreadsheet_with_phone').set(totalRowsInSpreadsheetWithPhone)
                                  dbref.child('total_rows_activated').set(0)
                                  dbref.child('total_rows_deactivated').set(totalRowsInSpreadsheetWithPhone)
                                  dbref.child('total_rows_completed').set(0)
                                  dbref.child('percent_complete').set(0) // 0 - 100,  see mission-stats.js
                            });

                        } // if(rows.length > 0 && rows[0].length > 0)
                    })


                } // if(rows.length > 0 && rows[0].length > 0)
            })


            return resolve();

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
        });
    });
})
*******/


// OAuth token cached locally.
let oauthTokens = null;

// checks if oauthTokens have been loaded into memory, and if not, retrieves them
function getAuthorizedClient() {
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


function playlistsInsert(auth, requestData) {
  var service = google.youtube('v3');
  var parameters = removeEmptyParameters(requestData['params']);
  parameters['auth'] = auth;
  parameters['resource'] = createResource(requestData['properties']);
  service.playlists.insert(parameters, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    console.log(response);
  });
}

function removeEmptyParameters(params) {
  for (var p in params) {
    if (!params[p] || params[p] == 'undefined') {
      delete params[p];
    }
  }
  return params;
}

/**********
//See full code sample for authorize() function code.
authorize(JSON.parse(content), {'params': {'part': 'snippet,status',
                 'onBehalfOfContentOwner': ''}, 'properties': {'snippet.title': '',
                 'snippet.description': '',
                 'snippet.tags[]': '',
                 'snippet.defaultLanguage': '',
                 'status.privacyStatus': ''
      }}, playlistsInsert);
      *************/


/***
We want to display 2 lists of playlists so we can visually confirm that what's in the
database is in fact on youtube also
***/
var listPlaylistsInDatabase = function() {
    return db.ref('video/playlists').once('value').then(snapshot => {
        var playlists = []
        snapshot.forEach(function(child) {
            var playlist = child.val()
            playlist.key = child.key
            playlists.push(playlist)
        })
        var html = '<P/>'
        html += '<table border="1" cellspacing="0" cellpadding="2">'
        html += '<tr>'
        html +=     '<th colspan="4">Playlists at /video/playlists</th>'
        html += '</tr>'
        html += '<tr>'
        html +=     '<th></th>'
        html +=     '<th>key</th>'
        html +=     '<th>playlist_name</th>'
        html +=     '<th>created</th>'
        html += '</tr>'
        _.each(playlists, function(playlist) {
            html += '<tr>'
            html +=     '<td><a href="/deletePlaylist?key='+playlist.key+'">delete</a></td>'
            html +=     '<td>'+playlist.key+'</td>'
            html +=     '<td>'+playlist.playlist_name+'</td>'
            html +=     '<td>'+playlist.created+'</td>'
            html += '</tr>'
        })
        html += '</table>'
        return html
    })
}


/***
We want to display 2 lists of playlists so we can visually confirm that what's in the
database is in fact on youtube also
***/
var listPlaylistsOnYouTube = function(channelId) {
    var service = google.youtube('v3')
    return getAuthorizedClient().then(client => {

        var requestData = {'params': {'channelId': channelId,
                                           'maxResults': '25',
                                           'part': 'snippet,contentDetails'}}

        var parameters = removeEmptyParameters(requestData['params']);
        service.playlists.list(parameters, function(err, response) {
            if (err) {
              console.log('The API returned an error: ' + err);
              return;
            }
            db.ref('templog2').push().set({response: response})
        });

    })
}


var render = function(res) {
    var html = ''
    html += createPlaylistForm()
    html += listPlaylistsInDatabase()
    listPlaylistsOnYouTube()
    return res.status(200).send(html)
}


var createPlaylistForm = function() {
    var html = '<P/>'
    html += '<form method="post" action="/createPlaylist">'
    html += '<input type"text" name="playlist" size="75" placeholder="Playlist" value="Playlist">'
    html += ' <input type="submit" value="create">'
    html += '</form>'
    return html
}