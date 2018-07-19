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
    return db.ref('users').orderByChild('email').equalTo('bdunklau@yahoo.com').once('value').then(snapshot => {
        var uid
        snapshot.forEach(function(child) {
            uid = child.key
        })
        return render({req: req, res: res, uid: uid})
    })
})


exports.testSavePlaylist = functions.https.onRequest((req, res) => {
    return db.ref('users').orderByChild('email').equalTo('bdunklau@yahoo.com').once('value').then(snapshot => {
        var uid
        snapshot.forEach(function(child) {
            uid = child.key
        })

        // issue a request to insert/update then have a trigger listen for the request
        // to actually do the insert/update
        // This is what mobile clients will do...
        var request = {'title': req.body.title, 'description': req.body.description, 'privacyStatus': 'Unlisted'}
        request.action = 'save'
        if(req.body.id) {
            request.id = req.body.id
        }
        if(req.body.key) {
            request.key = req.body.key
        }
        request.date = date.asCentralTime()
        request.date_ms = date.asMillis()
        request.uid = req.body.uid
        return db.ref('video/playlist_requests').push().set(request).then(() => {
            return render({req: req, res: res, uid: uid})
        })
    })

})


exports.handlePlaylistRequest = functions.database.ref('video/playlist_requests/{key}').onWrite(event => {
    if(!event.data.val() && event.data.previous.val())
        return false //ignore deletes
    var request = event.data.val()
    if(request.id) {
        // update or delete
        if(request.action == 'delete') {
            // delete...
            return deletePlaylist(request)
        }
        else {
            // update...
            return updatePlaylist(request)
        }
    }
    else {
        // insert...
        return insertPlaylist(request)
    }
})


exports.testEditPlaylist = functions.https.onRequest((req, res) => {
    return db.ref('users').orderByChild('email').equalTo('bdunklau@yahoo.com').once('value').then(snapshot => {
        var uid
        snapshot.forEach(function(child) {
            uid = child.key
        })

        return render({req: req, res: res, uid: uid})
    })
})


var insertPlaylist = function(request) {

    return getAuthorizedClient().then(auth => {
        var requestData = {'params': {'part': 'snippet,status', 'onBehalfOfContentOwner': ''},
                           'properties': {'snippet.title': request.title,
                                          'snippet.description': request.description,
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

            return db.ref('video/playlists').push().set(response)
        });
    })

}


var deletePlaylist = function(request) {

    return getAuthorizedClient().then(auth => {
        var requestData = {'params': {'id': request.id,
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
            db.ref('video/playlists').child(request.key).remove()
        });
    })
}


var updatePlaylist = function(request) {

    return getAuthorizedClient().then(auth => {
        var requestData = {'params': {'part': 'snippet,status', 'onBehalfOfContentOwner': ''},
                           'properties': {'id': request.id,
                                          'snippet.title': request.title,
                                          'snippet.description': request.description,
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

            return db.ref('video/playlists/'+request.key).update(response)
        });
    })

}


exports.testDeletePlaylist = functions.https.onRequest((req, res) => {

    return getAuthorizedClient().then(auth => {
        // This is what mobile clients will do...
        var request = {}
        if(req.query.id) {
            request.id = req.query.id
            request.action = 'delete'
        }
        request.date = date.asCentralTime()
        request.date_ms = date.asMillis()
        request.uid = req.query.uid
        request.key = req.query.key
        return db.ref('video/playlist_requests').push().set(request).then(() => {
            return render({req: req, res: res, uid: request.uid})
        })

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
var listPlaylistsInDatabase = function(stuff) {
    var html = stuff.html
    var uid = stuff.uid
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
            html +=     '<td><a href="/testEditPlaylist?key='+playlist.key+'&id='+playlist.id+'&uid='+uid+'">edit</a></td>'
            html +=     '<td><a href="/testDeletePlaylist?key='+playlist.key+'&id='+playlist.id+'&uid='+uid+'">delete</a></td>'
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
    .then(html => {
        return db.ref('video/playlist_requests').once('value').then(snapshot => {
            html += '<P/>'
            html += '<table border="1" cellspacing="0" cellpadding="2">'
            html += '<tr>'
            html +=     '<th colspan="7">Playlist Requests at /video/playlist_requests</th>'
            html += '</tr>'
            html += '<tr>'
            html +=     '<th>date</th>'
            html +=     '<th>key</th>'
            html +=     '<th>id</th>'
            html +=     '<th>title</th>'
            html +=     '<th>action</th>'
            html +=     '<th>privacyStatus</th>'
            html +=     '<th>uid</th>'
            html += '</tr>'
            _.each(snapshot.val(), function(playlist_request) {
                var title = ''
                if(playlist_request.title) title = playlist_request.title
                html += '<tr>'
                html +=     '<td>'+playlist_request.date+'</td>'
                html +=     '<td>'+playlist_request.key+'</td>'
                html +=     '<td>'+playlist_request.id+'</td>'
                html +=     '<td>'+title+'</td>'
                html +=     '<td>'+playlist_request.action+'</td>'
                html +=     '<td>'+playlist_request.privacyStatus+'</td>'
                html +=     '<td>'+playlist_request.uid+'</td>'
                html += '</tr>'
            })
            html += '</table>'
            return html
        })
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



var render = function(stuff) {
    var req = stuff.req
    var res = stuff.res
    var uid = stuff.uid

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
                html += playlistForm({uid: uid})
            }
            else {
                data.key = snapshot.key
                data.uid = uid
                html += playlistForm(data)
            }
            return html
        })
        .then(html => {
            return listPlaylistsInDatabase({html: html, uid: uid}).then(playlistHtml => {
                return db.ref('video/youtube/channelId').once('value').then(snapshot => {
                    var input = {channelId: snapshot.val(), html: playlistHtml, callback: callback}
                    listPlaylistsOnYouTube(input)
                })
            })
        })
    }
    else {
        // inserting...
        html += playlistForm({uid: uid})
        return listPlaylistsInDatabase({html: html, uid: uid}).then(playlistHtml => {
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
    html += '<form method="post" action="/testSavePlaylist">'
    html += '<input type"text" name="title" size="75" placeholder="Playlist" value="'+title+'">'

    // hidden field determines insert or update...
    html += '<input type="hidden" name="key" value="'+key+'">'
    html += '<input type="hidden" name="id" value="'+id+'">'

    // text field specifies the user making the playlist request...
    html += '<input type="text" name="uid" value="'+data.uid+'">'

    html += '<p/><textarea name="description" rows="10" cols="100">'+description+'</textarea>'
    html += '<P/><input type="submit" value="save">'
    html += '</form>'
    return html
}