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
const FUNCTIONS_REDIRECT = functions.config().googleapi.function_redirect  //`https://us-central1-telepatriot-dev.cloudfunctions.net/oauthcallback`;

// See import-sheet.js  This is where we specify all the SCOPEs.  I know it shouldn't all
// be in that file, but that's where it is right now.
// That file also contains the authgoogleapi http function that we need to get these tokens in the first place.
// See the Chrome bookmark "Google API: Authenticate"
var OAuth2 = google.auth.OAuth2;
var functionsOauthClient = new OAuth2(CONFIG_CLIENT_ID, CONFIG_CLIENT_SECRET,
                                FUNCTIONS_REDIRECT);

exports.youtube_playlists = functions.https.onRequest((req, res) => {
    return render(req, res)
})


exports.savePlaylist = functions.https.onRequest((req, res) => {
    if(req.body.key && req.body.key != '') {
        // updating...
        updatePlaylist(req, res)
    }
    else {
        // inserting...
        insertPlaylist(req, res)
    }
})


exports.editPlaylist = functions.https.onRequest((req, res) => {
    return render(req, res)
})


var insertPlaylist = function(req, res) {

    return getAuthorizedClient().then(auth => {
        var requestData = {'params': {'part': 'snippet,status', 'onBehalfOfContentOwner': ''},
                           'properties': {'snippet.title': req.body.title,
                                          'snippet.description': req.body.description,
                                          'snippet.tags[]': '',
                                          'snippet.defaultLanguage': '',
                                          'status.privacyStatus': 'Unlisted'}
                          }

        var parameters = removeEmptyParameters(requestData['params']);
        parameters['resource'] = createResource(requestData['properties']);
        parameters['auth'] = auth;
        var service = google.youtube('v3');
        service.playlists.insert(parameters, function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return false;
            }

            // flatten out some attributes so we can query on them...
            response.channelId = response.snippet.channelId
            response.channelTitle = response.snippet.channelTitle
            response.description = response.snippet.description
            response.created = date.asCentralTime()
            response.created_ms = date.asMillis()
            if(response.status && response.status.privacyStatus)
                response.privacyStatus = response.status.privacyStatus
            response.title = response.snippet.title
            // response already comes with an 'id' attribute
            // There's also a 'thumbnails' attribute under 'snippet'

            return db.ref('video/playlists').push().set(response).then(() => {
                return render(req, res)
            })
        });
    })

}


var updatePlaylist = function(req, res) {

    return getAuthorizedClient().then(auth => {
        var requestData = {'params': {'part': 'snippet,status', 'onBehalfOfContentOwner': ''},
                           'properties': {'id': req.body.id,
                                          'snippet.title': req.body.title,
                                          'snippet.description': req.body.description,
                                          'snippet.tags[]': '',
                                          'snippet.defaultLanguage': '',
                                          'status.privacyStatus': 'Unlisted'}
                          }

        var parameters = removeEmptyParameters(requestData['params']);
        parameters['resource'] = createResource(requestData['properties']);
        parameters['auth'] = auth;
        var service = google.youtube('v3');
        service.playlists.update(parameters, function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return false;
            }

            // flatten out some attributes so we can query on them...
            response.channelId = response.snippet.channelId
            response.channelTitle = response.snippet.channelTitle
            response.description = response.snippet.description
            response.created = date.asCentralTime()
            response.created_ms = date.asMillis()
            if(response.status && response.status.privacyStatus)
                response.privacyStatus = response.status.privacyStatus
            response.title = response.snippet.title
            // response already comes with an 'id' attribute
            // There's also a 'thumbnails' attribute under 'snippet'

            db.ref('templog2').push().set({update_response: response})

            return db.ref('video/playlists/'+req.body.key).update(response).then(() => {
                return render(req, res)
            })
        });
    })

}


exports.deletePlaylist = functions.https.onRequest((req, res) => {

    return getAuthorizedClient().then(auth => {

        var requestData = {'params': {'id': req.query.id,
                         'onBehalfOfContentOwner': ''}}
        var service = google.youtube('v3');
        var parameters = removeEmptyParameters(requestData['params']);
        parameters['auth'] = auth;
        service.playlists.delete(parameters, function(err, response) {
            if (err) {
              console.log('The API returned an error: ' + err);
              return;
            }
            // FYI - there is no response object on deletes
            db.ref('video/playlists').child(req.query.key).remove().then(() => {
                return render(req, res)
            })
        });
    })

})


function createResource(properties) {
  var resource = {};
  var normalizedProps = properties;
  for (var p in properties) {
    var value = properties[p];
    if (p && p.substr(-2, 2) == '[]') {
      var adjustedName = p.replace('[]', '');
      if (value) {
        normalizedProps[adjustedName] = value.split(',');
      }
      delete normalizedProps[p];
    }
  }
  for (var p in normalizedProps) {
    // Leave properties that don't have values out of inserted resource.
    if (normalizedProps.hasOwnProperty(p) && normalizedProps[p]) {
      var propArray = p.split('.');
      var ref = resource;
      for (var pa = 0; pa < propArray.length; pa++) {
        var key = propArray[pa];
        if (pa == propArray.length - 1) {
          ref[key] = normalizedProps[p];
        } else {
          ref = ref[key] = ref[key] || {};
        }
      }
    };
  }
  return resource;
}


// OAuth token cached locally.
let oauthTokens = null;

// checks if oauthTokens have been loaded into memory, and if not, retrieves them
function getAuthorizedClient() {
  // commented this out because was getting "Promise.success is not a function"
  //if (oauthTokens) {
  //  return Promise.success(functionsOauthClient);
  //}

  return db.ref('/api_tokens').once('value').then(snapshot => {
    oauthTokens = snapshot.val();
    functionsOauthClient.credentials = oauthTokens;
    db.ref('templog2').push().set({oauthTokens: oauthTokens, date: date.asCentralTime()})
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


/***
We want to display 2 lists of playlists so we can visually confirm that what's in the
database is in fact on youtube also
***/
var listPlaylistsInDatabase = function(html) {
    return db.ref('video/playlists').once('value').then(snapshot => {
        var playlists = []
        snapshot.forEach(function(child) {
            var playlist = child.val()
            playlist.key = child.key
            playlists.push(playlist)
        })
        html += '<P/>'
        html += '<table border="1" cellspacing="0" cellpadding="2">'
        html += '<tr>'
        html +=     '<th colspan="11">Playlists at /video/playlists</th>'
        html += '</tr>'
        html += '<tr>'
        html +=     '<th></th>'
        html +=     '<th></th>'
        html +=     '<th></th>'
        html +=     '<th>key</th>'
        html +=     '<th>channelId</th>'
        html +=     '<th>channelTitle</th>'
        html +=     '<th>id</th>'
        html +=     '<th>title</th>'
        html +=     '<th>privacyStatus</th>'
        html +=     '<th>description</th>'
        html +=     '<th>created</th>'
        html += '</tr>'
        _.each(playlists, function(playlist) {
            html += '<tr>'
            html +=     '<td><a href="https://www.youtube.com/playlist?list='+playlist.id+'" target="yt">view</a></td>'
            html +=     '<td><a href="/editPlaylist?key='+playlist.key+'&id='+playlist.id+'">edit</a></td>'
            html +=     '<td><a href="/deletePlaylist?key='+playlist.key+'&id='+playlist.id+'">delete</a></td>'
            html +=     '<td>'+playlist.key+'</td>'
            html +=     '<td>'+playlist.channelId+'</td>'
            html +=     '<td>'+playlist.channelTitle+'</td>'
            html +=     '<td>'+playlist.id+'</td>'
            html +=     '<td>'+playlist.title+'</td>'
            html +=     '<td>'+playlist.privacyStatus+'</td>'
            html +=     '<td>'+playlist.description+'</td>'
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
var listPlaylistsOnYouTube = function(input) {
    var channelId = input.channelId
    var html = input.html
    var callback = input.callback
    var service = google.youtube('v3')
    getAuthorizedClient().then(auth => {

        var requestData = {'params': {'channelId': channelId,
                                           'maxResults': '25',
                                           'part': 'snippet,contentDetails'}}

        var parameters = removeEmptyParameters(requestData['params']);
        parameters['auth'] = auth;
        var rawPlaylists = []
        var onList = function(err, response) {
             if (err) {
               console.log('The API returned an error: ' + err);
               return;
             }
             rawPlaylists = response.items
             var playlists =  _.map(rawPlaylists, function(response_item) {
                 var playlist = {channelId: response_item.snippet.channelId,
                                 channelTitle: response_item.snippet.channelTitle,
                                 description: response_item.snippet.description,
                                 publishedAt: response_item.snippet.publishedAt,
                                 playlist_title: response_item.snippet.title}
                 return playlist
             })

             html += '<P/><table border="1" cellpadding="2" cellspacing="0">'
             html += '<tr>'
             html +=     '<th colspan="5">Playlists on YouTube</th>'
             html += '</tr>'
             html += '<tr>'
             html +=     '<th>channelId</th>'
             html +=     '<th>channelTitle</th>'
             html +=     '<th>description</th>'
             html +=     '<th>playlist_title</th>'
             html +=     '<th>publishedAt</th>'
             html += '</tr>'
             _.each(playlists, function(playlist) {
                 html += '<tr>'
                 html +=     '<td>'+playlist.channelId+'</td>'
                 html +=     '<td>'+playlist.channelTitle+'</td>'
                 html +=     '<td>'+playlist.description+'</td>'
                 html +=     '<td>'+playlist.playlist_title+'</td>'
                 html +=     '<td>'+playlist.publishedAt+'</td>'
                 html += '</tr>'
             })
             html += '</table>'
             callback(html)
         }
        service.playlists.list(parameters, onList);

    })
}



var render = function(req, res) {

    var callback = function(h) {
        return res.status(200).send(h)
    }

    var html = ''
    html += authGoogleComments(req)

    if(req.query.key) {
        // updating...
        return db.ref('video/playlists/'+req.query.key).once('value').then(snapshot => {
            var data = snapshot.val()
            if(!data) {
                html += playlistForm({})
            }
            else {
                data.key = snapshot.key
                html += playlistForm(data)
            }
            return html
        })
        .then(html => {
            return listPlaylistsInDatabase(html).then(playlistHtml => {
                return db.ref('video/youtube/channelId').once('value').then(snapshot => {
                    var input = {channelId: snapshot.val(), html: playlistHtml, callback: callback}
                    listPlaylistsOnYouTube(input)
                })
            })
        })
    }
    else {
        // inserting...
        html += playlistForm({})
        return listPlaylistsInDatabase(html).then(playlistHtml => {
            return db.ref('video/youtube/channelId').once('value').then(snapshot => {
                var input = {channelId: snapshot.val(), html: playlistHtml, callback: callback}
                listPlaylistsOnYouTube(input)
            })
        })
    }

}


/***
Presents helpful comments about authenticating with Google and provides a link to /authgoogleapi
This is stuff you'll forget, so having this text here makes sure you won't
***/
var authGoogleComments = function(req) {
    var html = ''
    html += '<h3>Problems with Google Permissions?</h3>'
    html += 'If you\'re having problems authenticating with YouTube or Google Sheets, it could be because you '
    html += 'aren\'t authenticated with Google or you need to re-authenticate.  Use the link below to '
    html += 'authenticate with Google...'
    var url = 'https://'+req.get('host')+'/authgoogleapi'
    html += '<P/><a href="'+url+'">'+url+'</a>'
    return html
}


var playlistForm = function(data) {

    var title = ''
    var description = ''
    var key = ''
    var id = ''
    if(data.title) {
        title = data.title
        description = data.description
        key = data.key
        id = data.id
    }
    var html = ''
    html += '<P/><b>Create/Edit YouTube Playlists</b>'
    html += '<form method="post" action="/savePlaylist">'
    html += '<input type"text" name="title" size="75" placeholder="Playlist" value="'+title+'">'

    // hidden field determines insert or update...
    html += '<input type="hidden" name="key" value="'+key+'">'
    html += '<input type="hidden" name="id" value="'+id+'">'

    html += '<p/><textarea name="description" rows="10" cols="100">'+description+'</textarea>'
    html += '<P/><input type="submit" value="save">'
    html += '</form>'
    return html
}