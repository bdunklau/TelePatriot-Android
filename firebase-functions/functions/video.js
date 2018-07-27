'use strict';

/********************************************************************************
This file was originally created (2/27/18) to test uploading videos to YouTube
********************************************************************************/

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const google = require('googleapis'); // import-sheet.js also uses this
const fs = require('fs');

const bucket = admin.storage().bucket()

var style = "font-family:Arial;font-size:12px"
var tableheading = style + ';background-color:#ededed'

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


exports.video = functions.https.onRequest((req, res) => {

    debugs = []

    return getFirebaseStorageItems().then(items => {
        return res.status(200).send(renderPage({items:items}))
    })


})

var getFirebaseStorageItems = function() {
    return db.ref(`firebase_storage`).once('value').then(snapshot => {
        var items = []
        snapshot.forEach(function(child) {
            items.push(child.val())
        })
        return items
    })
}

var renderPage = function(stuff) {
    var html = ''
    html += '<html><head></head><body>'
    html += renderDebug(stuff.debug)
    html += renderItems(stuff.items)
    html += '</body></html>'
    return html
}

var renderDebug = function(debug) {
    if(!debug)
        return ''
    var html = '<table border="1" cellspacing="0" cellpadding="2">'
    _.each(debug, function(dbg) {
        html += '<tr><td>'+dbg.name+'</td><td>'+dbg.value+'</td></tr>'
    })
    html += '</table>'
    return html
}

var renderItems = function(items) {
    if(!items || items.length == 0)
        return ''

    var html = '<table border="1" cellspacing="0" cellpadding="2">'
    var keys = Object.keys(items[0])
    var colspan = 2
    html += '<tr><th colspan="'+colspan+'">Items in FirebaseStorage</th></tr>'

    _.each(items, function(item) {
        html += '<tr>'
        html +=     '<td><form method="post">'
        html +=         '<input type="text" size="45" placeholder="state abbrev" value="tx" name="state_abbrev"><p/>'
        html +=         '<input type="text" size="45" placeholder="state playlist" value="Convention of States Texas" name="state_playlist"><p/>'
        html +=         '<input type="text" size="45" placeholder="district playlist" value="Convention of States Texas - HD 33 - Justin Holland" name="district_playlist"><p/>'
        html +=         '<input type="hidden" value="'+item.md5Hash+'" name="md5Hash"/>'
        html +=         '<input type="text" size="45" placeholder="video title" value="Video Petition to Rep Justin Holland" name="youtube_video_title"><p/>'
        html +=         '<textarea placeholder="YouTube video description" rows="10" cols="45" name="youtube_video_description">This is a video to TX Rep Justin Holland (HD 33) thanking him for supporting the Convention of States resolution in May 2017.'
        html +=         '\n\nSign the Convention of States petition at https://www.conventionofstates.com'
        html +=         '\n\n[MD5]'+item["md5Hash"]+'[MD5]'
        html +=         '</textarea><p/>'
        html +=         '<input type="submit" value="unset" formaction="/unsetFirebaseStorageRecord" /> &nbsp;&nbsp;'
        html +=         '<input type="submit" value="set" formaction="/setFirebaseStorageRecord" /> &nbsp;&nbsp;'
        html +=         '<input type="submit" value="publish" formaction="/markForPublishVideo" /> &nbsp;&nbsp;'
        html +=     '</form></td>'
        html +=     '<td>'
        html +=         '<table border="0" cellspacing="1" cellpadding="0">'
        _.each(keys, function(key) {
            html += '<tr><td>'+key+'</td><td>'+item[key]+'</td></tr>'
        })
        html +=         '</table>'
        html +=     '</td>'
        html += '</tr>'
    })
    html += '</table>'
    return html
}

exports.setFirebaseStorageRecord = functions.https.onRequest((req, res) => {
    var updates = {}
    updates[`temp`] = null  // would be better to figure out where these records are coming from
    updates[`templog`] = null
    updates[`templog2`] = null
    updates[`firebase_storage/${req.body.md5Hash}/state_abbrev`] = req.body.state_abbrev
    updates[`firebase_storage/${req.body.md5Hash}/state_playlist`] = req.body.state_playlist
    updates[`firebase_storage/${req.body.md5Hash}/district_playlist`] = req.body.district_playlist
    updates[`firebase_storage/${req.body.md5Hash}/youtube_video_title`] = req.body.youtube_video_title
    updates[`firebase_storage/${req.body.md5Hash}/youtube_video_description`] = req.body.youtube_video_description

    // multi-path update
    return db.ref(`/`).update(updates).then(() => {
        return getFirebaseStorageItems().then(items => {
            return res.status(200).send(renderPage({items:items}))
        })
    })
})

exports.unsetFirebaseStorageRecord = functions.https.onRequest((req, res) => {
    var updates = {}
    updates[`temp`] = null  // would be better to figure out where these records are coming from
    updates[`templog`] = null
    updates[`templog2`] = null
    updates[`firebase_storage/${req.body.md5Hash}/state_abbrev`] = null
    updates[`firebase_storage/${req.body.md5Hash}/state_playlist`] = null
    updates[`firebase_storage/${req.body.md5Hash}/publish`] = null
    updates[`firebase_storage/${req.body.md5Hash}/progress`] = null
    updates[`firebase_storage/${req.body.md5Hash}/district_playlist`] = null
    updates[`firebase_storage/${req.body.md5Hash}/youtube_video_title`] = null
    updates[`firebase_storage/${req.body.md5Hash}/youtube_video_description`] = null

    // multi-path update
    return db.ref(`/`).update(updates).then(() => {
        return getFirebaseStorageItems().then(items => {
            return res.status(200).send(renderPage({items:items}))
        })
    })
})


// We set /firebase_storage/{md5Hash}/publish = publish to cause the database trigger to begin
// the upload/insert process to YouTube
exports.markForPublishVideo = functions.https.onRequest((req, res) => {
    var updates = {}
    // guarantees that uploadToYouTube4 is re-triggered, saves me from having to manually jack with the db
    updates[`firebase_storage/${req.body.md5Hash}/publish`] = 'republish' // value doesn't actually have to be republish, just anything besides publish
    // multi-path update
    return db.ref(`/`).update(updates).then(() => {
        db.ref(`firebase_storage/${req.body.md5Hash}/publish`).set('publish').then(() => {
            return getFirebaseStorageItems().then(items => {
                return res.status(200).send(renderPage({items:items}))
            })
        })
    })
})

//Error: "onChange" is now deprecated, please use "onArchive", "onDelete", "onFinalize", or "onMetadataUpdate".
// Trigger - this gets called whenever a file is added to firebase storage
/**********
exports.newStorageItem = functions.storage.object().onArchive(event => {
    if(!event.data) {
        return false
    }
    const object = event.data
    if(!object) {
        console.log('No event.data object - the file was probably just deleted')
        return false
    }
    // use object.md5Hash as the primary key node value so that we don't create multiple nodes
    // for a single object
    return db.ref(`firebase_storage/${object.md5Hash}`).set(object)
})
*********/

// This trigger is designed to fire when /firebase_storage/{md5Hash}/publish is set to 'publish'
// bucket:  https://cloud.google.com/nodejs/docs/reference/storage/1.6.x/Bucket
exports.uploadToYouTube4 = functions.database.ref(`firebase_storage/{md5Hash}`).onWrite(event => {

        debugs = []
        dbg('uploadToYouTube4', 'begin')

        var vdescr = event.data.val().youtube_video_description
        var vtitle = event.data.val().youtube_video_title

        // Lots of conditions under which we DON'T want this trigger to fire...
        if( !event.data.val()                                   // if the firebase_storage/{md5Hash} record was deleted
            || event.data.val().resourceState == 'not_exists'   // if the video was deleted from yt
            || !event.data.val().publish                        // if there is no "publish" attribute
            || event.data.val().publish != 'publish'            // or if the attribute doesn't equal "publish"
            || event.data.val().progress                        // if we are only here because we're updating the "progress" number
            || !vtitle                                          // if there is no video title
            || !vdescr                                          // if there is no video description
            || vdescr.indexOf(event.params.md5Hash) == -1       // or if the descr doesn't have the md5Hash in it
         )
            return false


        var storageLocation = event.data.val().name
        var fileSize = event.data.val().size

        // uploading video to youtube...
        // try this also:  https://github.com/google/google-api-nodejs-client/issues/1014
        return new Promise((resolve, reject) => {
            dbg('start', date.asMillis())
            dbg('storageLocation:', storageLocation)

            // this block here is just "informational" - it serves no real purpose
            bucket.getFiles(function(err, files) {
                if (err) {
                    dbg('bucket.getFiles(): err', err)
                }
                else {
                    _.each(files, function(file) { // CRASH! Trying to debug the file object causes a crash and
                                                    // actually prevents the video from being uploaded to YouTube - oops
                        dbg('file', 'is this what is causing the problem?: file')
                    })
                }
            })

            var bucketFile = bucket.file(storageLocation)

            var requestData = {  'params': {'part': 'snippet,status'},
                                 'properties':
                                    {'snippet.categoryId': '22',
                                     'snippet.defaultLanguage': '',
                                     'snippet.description': vdescr,
                                     'snippet.tags[]': '',
                                     'snippet.title': vtitle,
                                     'status.embeddable': '',
                                     'status.license': '',
                                     'status.privacyStatus': 'private',
                                     'status.publicStatsViewable': ''
                                    },
                                 'mediaFilename': 'Truman-on-the-trampoline.mp4'}

            getAuthorizedClient().then(auth => {

                try {
                    //https://developers.google.com/youtube/v3/docs/videos/insert#usage
                    var parameters = removeEmptyParameters(requestData['params']);
                    dbg('uploadToYouTube()', 'removeEmptyParameters')
                    parameters['auth'] = auth;
                    dbg('auth', auth)
                    parameters['media'] = { body: bucketFile.createReadStream() };
                    dbg('uploadToYouTube()', 'bucketFile.createReadStream()')
                    parameters['notifySubscribers'] = false;
                    parameters['resource'] = createResource(requestData['properties']);
                    dbg('uploadToYouTube()', 'createResource(requestData[\'properties\'])')
                    var stuff = {parameters: parameters, size: event.data.val().size}

                    var parameters = stuff.parameters
                    var service = google.youtube('v3')
                    dbgKeys('parameters', parameters)

                    var req2 = service.videos.insert(parameters, function (error, data) {
                        dbg('insert: error', error)
                        dbg('insert: data', data)
                        console.log('error: ', error, '  data: ', data)
                        dbg('service.videos.insert callback', 'data: '+data)
                        dbg('service.videos.insert callback', 'error: '+error)

                        //process.exit()
                        //console.log(util.inspect(data, false, null));
                        //console.log(error);
                    });

                    return resolve()
                }
                catch(err2) {
                    dbg('err2', err2)
                }

            })
            .catch(err => {
                dbg('exception', err)
                return reject()
            })

        })

})


/**********************************
Video workflow... NOT SURE HOW MUCH OF THIS STILL APPLIES 6/11/18
video is dropped in to firebase storage
video is uploaded to yt - include md5Hash in the video description
yt sends us back notification of upload
notification contains video id but that doesn't help us match up the notification with a record in /firebase_storage
Notification triggers an api call to yt so we can get the video description
extract the md5Hash from the video description
Now we can associate a record from /firebase_storage with a notification in /youtube_notifications
clean up:  update the video descr on yt with md5Hash removed (because don't need it anymore)
***********************************/

/**********************************
Get YouTube Video Description...

https://www.googleapis.com/youtube/v3/videos?part=snippet&id=k7OGVYZL-i4&fields=items/snippet/title,items/snippet/description&key=AIzaSyC2hOku8c1EiFdnRKDVtwzN3H8VfiVUl2w
where:
    id=k7OGVYZL-i4 is the YouTube video id
    key=AIzaSyC2hOku8c1EiFdnRKDVtwzN3H8VfiVUl2w  is an API key
        This key happens to be "Browser key" from the "API Keys"
        section of this page: https://console.cloud.google.com/apis/credentials?project=telepatriot-dev&folder&organizationId

Response looks like this...

{
 "items": [
  {
   "snippet": {
    "title": "Changed",
    "description": "Oooooooooooo"
   }
  }
 ]
}
***********************************/


/******************
// Triggered when YouTube calls us back and writes to /youtube_notifications
// When YouTube calls us back, we have to turn around and make an api call here to get the
// video's description - hassle
exports.getAdditionalYouTubeInfo = functions.database.ref(YOUTUBE_NOTIFICATIONS+'/{pkey}/youtube_notification').onWrite(event => {
    if(!event.data.val())
        return false // ignore deletes
    if(event.data.val().feed['at:deleted-entry'])
        return false // ignore if YouTube calls us back to say the video has been deleted
    var videoId = event.data.val().feed['entry']['yt:videoId']['_text']
    if(!videoId) {
        console.log('videoId: ', videoId)
        console.log('event.data.val(): ', event.data.val())
        return false // have to have video id also
    }

    return getAuthorizedClient().then(auth => {
        var requestData = { 'params': {'part': 'snippet,contentDetails', 'id':videoId},
                            'properties':
                                {'snippet.categoryId': '22',
                                 'snippet.defaultLanguage': '',
                                 'snippet.description': 'Description of uploaded video.',
                                 'snippet.tags[]': '',
                                 'snippet.title': 'Test video upload',
                                 'status.embeddable': '',
                                 'status.license': '',
                                 'status.privacyStatus': 'private',
                                 'status.publicStatsViewable': ''
                                },
                             'mediaFilename': 'Truman-on-the-trampoline.mp4'
                            }
        db.ref(`templog2/auth`).set(auth)

        var parameters = removeEmptyParameters(requestData['params']);
        parameters['auth'] = auth

        // good ref:  https://developers.google.com/youtube/v3/docs/videos/list
        var service = google.youtube('v3')
        service.videos.list(parameters, function (error, data) {
            db.ref(`templog2/error`).set(error)
            db.ref(`templog2/data`).set(data)
        });
    })
})
*********************/


var debugs = []
var dbg = function(name, value) {
    if(!value || value === undefined) {
        value = 'value is undefined'
    }
    debugs.push({'name': name, 'value': value})
    db.ref(`templog2`).push().set({'name': name, 'value': value})
}

var dbgKeys = function(descr, obj) {
    dbg('Object', descr)
    var keys = Object.getOwnPropertyNames(obj)//.keys(obj)
    _.each(keys, function(key) {
        dbg(descr+' props', key)
    })
}

/**
 * Remove parameters that do not have values.
 *
 * @param {Object} params A list of key-value pairs representing request
 *                        parameters and their values.
 * @return {Object} The params object minus parameters with no values set.
 */
function removeEmptyParameters(params) {
  for (var p in params) {
    if (!params[p] || params[p] == 'undefined') {
      delete params[p];
    }
  }
  return params;
}

/**
 * Create a JSON object, representing an API resource, from a list of
 * properties and their values.
 *
 * @param {Object} properties A list of key-value pairs representing resource
 *                            properties and their values.
 * @return {Object} A JSON object. The function nests properties based on
 *                  periods (.) in property names.
 */
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


const CONFIG_CLIENT_ID = functions.config().googleapi.client_id;
const CONFIG_CLIENT_SECRET = functions.config().googleapi.client_secret;
const FUNCTIONS_REDIRECT = functions.config().googleapi.function_redirect  //`https://us-central1-telepatriot-bd737.cloudfunctions.net/oauthcallback`;

// setup for authGoogleAPI
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload']; // see https://developers.google.com/youtube/v3/docs/videos/insert#usage
var OAuth2 = google.auth.OAuth2;
var functionsOauthClient = new OAuth2(CONFIG_CLIENT_ID, CONFIG_CLIENT_SECRET,
                                FUNCTIONS_REDIRECT);

// OAuth token cached locally.
let oauthTokens = null;

// setup for OauthCallback
const DB_TOKEN_PATH = '/api_tokens';

// checks if oauthTokens have been loaded into memory, and if not, retrieves them
function getAuthorizedClient() {
  dbg('oauthTokens', oauthTokens)
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


// uploading:     https://firebase.google.com/docs/storage/web/upload-files
// downloading:   https://firebase.google.com/docs/storage/web/download-files

// =======================================================================

// ref:  https://developers.google.com/youtube/v3/docs/videos/insert#usage
// Sample nodejs code for videos.insert