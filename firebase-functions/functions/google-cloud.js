'use strict';

/********************************************************************************
See:  https://cloud.google.com/nodejs/docs/reference/compute/0.10.x/
********************************************************************************/

// external dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')
const d = require('./debug')
const googleAuth = require('./google-auth')
const google = require('googleapis');
const request = require('request')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database()

// Example:  Create VM instance
// Code:  https://github.com/googleapis/nodejs-compute#installing-the-client-library


// [START auth]
// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GCLOUD_PROJECT environment variable. See
// https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application
const Compute = require('@google-cloud/compute');
// [END auth]

// [START initialize]
// Creates a client
const compute = new Compute();
// [END initialize]

/***
paste this on the command line...
firebase deploy --only functions:cloud,functions:dockers,functions:testCreateVideoNode,functions:testCreateAnotherDocker,functions:testStartDocker,functions:testStartRecording,functions:testStartRecording2,functions:testStopRecording,functions:testStopRecording2,functions:testPublish,functions:testStopDocker,functions:testStopAndRemoveDocker,functions:removeRecording,functions:listRecordings,functions:listImages,functions:dockerRequest,functions:setRoom_id,functions:recording_has_started,functions:whenVideoIdIsCreated,functions:youtubeVideoDescription,functions:video_title
***/

exports.cloud = functions.https.onRequest((req, res) => {
    return mainStuff({}).then(stuff => {
        return res.status(200).send(render(stuff))
    })
})


exports.dockers = functions.https.onRequest((req, res) => {
    return showDockers({vm_host: req.query.vm_host, vm_port: req.query.vm_port, res: res})
})


exports.testCreateVideoNode = functions.https.onRequest((req, res) => {
    var sampleNode = {}
    // see constructor of VideoNode.java
    sampleNode['node_create_date'] = date.asCentralTime()
    sampleNode['node_create_date_ms'] = date.asMillis()
    var video_participant = {}
    db.ref('users').orderByChild('email').equalTo('bdunklau@yahoo.com').once('value').then(snapshot => {
        var uid
        snapshot.forEach(function(child) {
            uid = child.key
        })
        video_participant['uid'] = uid
        video_participant['name'] = 'Brent Dunklau'
        video_participant['email'] = 'bdunklau@yahoo.com'
        video_participant['start_date'] = date.asCentralTime()
        video_participant['start_date_ms'] = date.asMillis()
        sampleNode['video_participants'] = [video_participant]
        // No, room_id is = video_node_key (more convenient, easier to track that way)
        //sampleNode['room_id'] = date.asMillis() // create the room_id at the time the video node is created
        sampleNode['video_mission_description'] = 'This is a video petition.  In a video petition, the person being interviewed *must* mention the legislator by name and must emphasize that the person being interviewed is a constituent of this legislator.  Next, one of the people in the video needs to state what the legislator\'s declared position is on COS (for, against, undecided)'
        sampleNode['youtube_video_description'] = 'This is a video petition to legislator_rep_type legislator_full_name (legislator_state_abbrev_upper legislator_chamber_abbrev legislator_district) from a constituent, constituent_name, asking legislator_rep_type legislator_full_name to support the Convention of States resolution. \r\n \r\nIf you are a constituent, you can also ask legislator_rep_type legislator_full_name to support the Convention of States resolution by phone, email or social media. \r\nPhone: legislator_phone \r\nEmail: legislator_email \r\nFacebook: https://www.facebook.com/legislator_facebook \r\nTwitter: https://www.twitter.com/legislator_twitter \r\n \r\nAnd if you haven\'t signed the Convention of States petition, you can do that here: https:\/\/www.conventionofstates.com   Be sure to get your friends and family to sign also, then have them contact *their* state legislators. \r\n \r\nTogether, we can be a part of the solution that\'s as big as the problem!'
        sampleNode['youtube_video_description_unevaluated'] = 'This is a video petition to legislator_rep_type legislator_full_name (legislator_state_abbrev_upper legislator_chamber_abbrev legislator_district) from a constituent, constituent_name, asking legislator_rep_type legislator_full_name to support the Convention of States resolution. \r\n \r\nIf you are a constituent, you can also ask legislator_rep_type legislator_full_name to support the Convention of States resolution by phone, email or social media. \r\nPhone: legislator_phone \r\nEmail: legislator_email \r\nFacebook: https://www.facebook.com/legislator_facebook \r\nTwitter: https://www.twitter.com/legislator_twitter \r\n \r\nAnd if you haven\'t signed the Convention of States petition, you can do that here: https:\/\/www.conventionofstates.com   Be sure to get your friends and family to sign also, then have them contact *their* state legislators. \r\n \r\nTogether, we can be a part of the solution that\'s as big as the problem!'
        var key = db.ref('video/list').push().getKey()
        return db.ref('video/list/'+key).set(sampleNode).then(() => {
            var input = {video_node_key: key, vm_host: req.query.vm_host, vm_port: req.query.vm_port}
            return mainStuff(input).then(stuff => {
                return res.status(200).send(render(stuff))
            })
        })
    })
})


exports.testCreateAnotherDocker = functions.https.onRequest((req, res) => {
    /****************
    var callback = function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...
        if(!error) {
            var docker = JSON.parse(body)
            // body contains 'name' and 'port'
            docker.vm_host = host
            docker.vm_port = port
            docker.vm_host_port_name = host+'_'+port+'_'+docker.name
            docker.running = true
            docker.recording = false
            docker.container_created = date.asCentralTime()
            docker.container_created_ms = date.asMillis()
            docker.container_started = date.asCentralTime()
            docker.container_started_ms = date.asMillis()
            //docker.response = response // there is a function in the response that will throw an exception
            //docker.error = error
            db.ref('administration/dockers').push().set(docker)
        }
        return showDockers({vm_host: host, vm_port: port, res: res})
    }
    *****************/
    return createDocker({vm_host: req.query.vm_host,
                         vm_port: req.query.vm_port,
                         res: res,
                         callback: onDockerCreation,
                         nextAction: showDockers})
})


exports.testStartDocker = functions.https.onRequest((req, res) => {
    return startDocker({vm_host: req.query.vm_host,
                        vm_port: req.query.vm_port,
                        docker_name: req.query.docker_name,
                        res: res,
                        callback: showDockers})
})


/*****************************************************************
This method is not tied to any /video/list/[key] entry.  All this method does
is verify that we can call the docker instance to make it start recording

testStartRecording2 - below - is more realistic
******************************************************************/
exports.testStartRecording = functions.https.onRequest((req, res) => {
    // not https ?!
    var url = 'http://'+req.body.vm_host+':'+req.body.dockerPort+'/record/'+req.body.room_id+'/'+req.body.uniqueIdentifier
    return request(url, function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...

        // write to the container's node under /administration/dockers...
        var docker_name = 'recorder'+req.body.dockerPort
        var searchValue = req.body.vm_host+'_'+req.body.vm_port+'_'+docker_name
        return db.ref('administration/dockers').orderByChild('vm_host_port_name').equalTo(searchValue).once('value').then(snapshot => {
            // should only be one child
            snapshot.forEach(function(child) {
                var updates = {}
                updates['running'] = true
                updates['recording'] = true
                updates['recording_started'] = date.asCentralTime()
                updates['recording_started_ms'] = date.asMillis()
                updates['recording_stopped'] = null
                updates['recording_stopped_ms'] = null
                child.ref.update(updates)
            })
            return showDockers({vm_host: req.body.vm_host, vm_port: req.body.vm_port, res: res})
        })
    })
})


/**************************************************************
This is basically the way mobile clients will start a recording.  The other function,
testStartRecording, contains the url to a docker instance.  Mobile clients aren't
going to know this and they aren't going to be issuing GET requests.

 This function tests the database trigger that listens on video/video_events
 Mobile clients will write to video/video_events when they want to start recording
and stop recording.  This http test function allows us to write to the same place that
 the mobile clients will write to.

 The trigger exports.dockerRequest is responsible for determining what docker instance is
 available for recording.  See the comment header above that trigger for the explanation of
 how it makes this determination
*******************************************************************/
exports.testStartRecording2 = functions.https.onRequest((req, res) => {
    return db.ref('video/list/'+req.query.video_node_key).once('value').then(snapshot => {
        return handleVideoEvent({request_type: 'start recording',
                                 video_node_key: req.query.video_node_key,
                                 room_id: snapshot.val().room_id,
                                 recording_started: req.query.recording_started, // these next 4 are only needed for this web page
                                 res: res,
                                 vm_host: req.query.vm_host,   // mobile clients won't need to know these 4 things
                                 vm_port: req.query.vm_port})
    })


})


exports.testStopRecording = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vm_host+':'+req.query.vm_port+'/stop-recording?docker_name='+req.query.docker_name
    return request(url, function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...

        // write to the container's node under /administration/dockers...
        var searchValue = req.query.vm_host+'_'+req.query.vm_port+'_'+req.query.docker_name
        return db.ref('administration/dockers').orderByChild('vm_host_port_name').equalTo(searchValue).once('value').then(snapshot => {
            // should only be one child
            snapshot.forEach(function(child) {
                var updates = {}
                updates['running'] = true
                updates['recording'] = false
                updates['recording_stopped'] = date.asCentralTime()
                updates['recording_stopped_ms'] = date.asMillis()
                child.ref.update(updates)
            })
            return showDockers({vm_host: req.query.vm_host, vm_port: req.query.vm_port, res: res})
        })
    })
})


exports.testStopRecording2 = functions.https.onRequest((req, res) => {
    return db.ref('video/list/'+req.query.video_node_key).once('value').then(snapshot => {
        return handleVideoEvent({request_type: 'stop recording',
                                 video_node_key: req.query.video_node_key,
                                 room_id: snapshot.val().room_id,
                                 recording_started: req.query.recording_started, // these next 5 are only needed for this web page
                                 recording_stopped: req.query.recording_stopped,
                                 res: res,
                                 vm_host: req.query.vm_host,   // mobile clients won't need to know these 5 things
                                 vm_port: req.query.vm_port})
    })
})


exports.testPublish = functions.https.onRequest((req, res) => {

    return db.ref('video/list/'+req.query.video_node_key).once('value').then(snapshot => {
        return handleVideoEvent({request_type: 'start publishing',
                                 video_node_key: req.query.video_node_key,
                                 recording_started: req.query.recording_started, // here and below are only needed for this web page
                                 recording_stopped: req.query.recording_stopped,
                                 publish_started: true,
                                 res: res})
    })
})


exports.testStopDocker = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vm_host+':'+req.query.vm_port+'/stop-docker?docker_name='+req.query.docker_name
    return request(url, function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...

        // write to the container's node under /administration/dockers...
        var searchValue = req.query.vm_host+'_'+req.query.vm_port+'_'+req.query.docker_name
        return db.ref('administration/dockers').orderByChild('vm_host_port_name').equalTo(searchValue).once('value').then(snapshot => {
            // should only be one child
            snapshot.forEach(function(child) {
                var updates = {}
                updates['running'] = false
                updates['recording'] = false
                if(child.val().recording_started && !child.val().recording_stopped) {
                    updates['recording_stopped'] = date.asCentralTime()
                    updates['recording_stopped_ms'] = date.asMillis()
                }
                updates['container_stopped'] = date.asCentralTime()
                updates['container_stopped_ms'] = date.asMillis()
                child.ref.update(updates)
            })
            return showDockers({vm_host: req.query.vm_host, vm_port: req.query.vm_port, res: res})
        })
    })
})


exports.testStopAndRemoveDocker = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vm_host+':'+req.query.vm_port+'/stop-and-remove-docker?docker_name='+req.query.docker_name
    return request(url, function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...

        // delete the container's node under /administration/dockers...
        var searchValue = req.query.vm_host+'_'+req.query.vm_port+'_'+req.query.docker_name
        return db.ref('administration/dockers').orderByChild('vm_host_port_name').equalTo(searchValue).once('value').then(snapshot => {
            // should only be one child
            snapshot.forEach(function(child) {
                child.ref.remove()
            })
            return showDockers({vm_host: req.query.vm_host, vm_port: req.query.vm_port, res: res})
        })
    })
})


exports.removeRecording = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vm_host+':'+req.query.vm_port+'/remove-recording?docker_name='+req.query.docker_name+'&filename='+req.query.filename
    return request(url, function(error, response, body) {
        var stuff = {}
        stuff.response = response
        stuff.body = body
        stuff.vm_host = req.query.vm_host
        stuff.vm_port = req.query.vm_port
        stuff.res = res
        stuff.docker_name = req.query.docker_name
        return showDockers2(stuff)
    })
})


exports.listRecordings = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vm_host+':'+req.query.vm_port+'/list-recordings?docker_name='+req.query.docker_name
    return request(url, function(error, response, body) {
        var stuff = {}
        stuff.response = response
        stuff.body = body
        stuff.vm_host = req.query.vm_host
        stuff.vm_port = req.query.vm_port
        stuff.res = res
        stuff.docker_name = req.query.docker_name
        return showDockers2(stuff)
    })
})


exports.listImages = functions.https.onRequest((req, res) => {

    // getting rid of templog2 is just ad hoc housecleaning
    return db.ref('templog2').remove().then(() => {

        return getVms(function(stuff) {
            return res.status(200).send(render(stuff))
        })
    })

})


// Need this callback function because recording doesn't start instantly.  So we display a spinner for the
// user in VideoChatVC.startRecording().  In startRecording() in this script, we construct a callback url
// which we send to the docker container.  The docker container does a GET request on this url which
// sets the recording_started/recording_started_ms attributes.  The live query on the video node (video/list/{key})
// in the mobile clients detects 'recording_started' which has the effect of dismissing the spinner
exports.recording_has_started = functions.https.onRequest((req, res) => {
    var updates = {}
    updates['video/list/'+req.query.video_node_key+'/recording_started'] = date.asCentralTime()
    updates['video/list/'+req.query.video_node_key+'/recording_started_ms'] = date.asMillis()
    updates['administration/dockers/'+req.query.docker_key+'/recording_started'] = date.asCentralTime()
    updates['administration/dockers/'+req.query.docker_key+'/recording_started_ms'] = date.asMillis()

    return db.ref('/').update(updates).then(() => {
        return res.status(200).send('ok: google-cloud.js:recording_has_started() handled your request')
    })
})












///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
// Helper functions



var mainStuff = function(stuff) {
    return db.ref('administration/hosts').once('value').then(snapshot => {
        var hosts = []
        var vms = []
        snapshot.forEach(function(child) {
            var host = child.val()
            host.key = child.key
            hosts.push(host)
        })
        var firebaseHost = _.find(hosts, {type: 'firebase functions'}).host
        var vms = _.filter(hosts, {type: 'virtual machine'})
        stuff.vmsInDatabase = vms
        stuff.firebaseHost = firebaseHost
        return stuff
    })
    .then(stuff => {
        var vmHtml = htmlOfHosts(stuff.vmsInDatabase, 'Virtual Machines Stored in the database under /administration/hosts')
        var firebaseHostHtml = htmlForFirebaseHost(stuff)
        stuff.vmsInDatabase = vmHtml
        stuff.firebaseHost = firebaseHostHtml
        return stuff
    })
    .then(stuff => {
        return db.ref('administration/dockers').once('value').then(snapshot => {
            var html = ''
            html += '<table cellspacing="0" border="1" cellpadding="2">'
            html += '<tr>'
            html +=     '<th colspan="12">/administration/dockers</th>'
            html += '</tr>'
            html += '<tr>'
            html +=     '<th>key</th>'
            html +=     '<th>VM Host</th>'
            html +=     '<th>VM Port</th>'
            html +=     '<th>Docker</th>'
            html +=     '<th>Port</th>'
            html +=     '<th>Running</th>'
            html +=     '<th>Recording</th>'
            html +=     '<th>Container Created</th>'
            html +=     '<th>Container Started</th>'
            html +=     '<th>Recording Started</th>'
            html +=     '<th>Recording Stopped</th>'
            html +=     '<th>Container Stopped</th>'
            html += '</tr>'
            snapshot.forEach(function(child) {
                html += '<tr>'
                html +=     '<td>'+child.key+'</td>'
                html +=     '<td>'+child.val().vm_host+'</td>'
                html +=     '<td>'+child.val().vm_port+'</td>'
                html +=     '<td>'+child.val().name+'</td>'
                html +=     '<td>'+child.val().port+'</td>'
                html +=     '<td>'+child.val().running+'</td>'
                html +=     '<td>'+child.val().recording+'</td>'
                html +=     '<td>'+child.val().container_created+'</td>'
                html +=     '<td>'+child.val().container_started+'</td>'
                html +=     '<td>'+child.val().recording_started+'</td>'
                html +=     '<td>'+child.val().recording_stopped+'</td>'
                html +=     '<td>'+child.val().container_stopped+'</td>'
                html += '</tr>'
            })
            html += '</table>'
            stuff.administration_dockers = html
            return stuff
        })
    })
    .then(stuff => {
        return db.ref('video/video_events').once('value').then(snapshot => {
            var html = ''
            html += '<table cellspacing="0" border="1" cellpadding="2">'
            html += '<tr>'
            html +=     '<th colspan="5">/video/video_events</th>'
            html += '</tr>'
            html += '<tr>'
            html +=     '<th>key</th>'
            html +=     '<th>request_date</th>'
            html +=     '<th>request_type</th>'
            //html +=     '<th>room_id</th>'
            html +=     '<th>uid (user id)</th>'
            //html +=     '<th>unique_file_ext</th>'
            html +=     '<th>video_node_key</th>'
            html += '</tr>'
            snapshot.forEach(function(child) {
                html += '<tr>'
                html +=     '<td>'+child.key+'</td>'
                html +=     '<td>'+child.val().request_date+'</td>'
                html +=     '<td>'+child.val().request_type+'</td>'
                //html +=     '<td>'+child.val().room_id+'</td>'
                html +=     '<td>'+child.val().uid+'</td>'
                //html +=     '<td>'+child.val().unique_file_ext+'</td>'
                html +=     '<td>'+child.val().video_node_key+'</td>'
                html += '</tr>'
            })
            html += '</table>'
            stuff.video_events = html
            return stuff
        })
    })
    .then(stuff => {
        var html = '<P/>'
        html += '<table border="0">'
        html +=     '<tr><td valign="top">'
        html += 'Step 1: <a href="/testCreateVideoNode?vm_host='+stuff.vm_host+'&vm_port='+stuff.vm_port+'">create video node (/video/list/[key])</a><br/>'
        if(stuff.video_node_key) {
            html += 'Step 1 Result: Created /video/list/'+stuff.video_node_key+'<br/>'
            if(!stuff.recording_started) {
                html += 'Step 2: <a href="/testStartRecording2?vm_host='+stuff.vm_host+'&vm_port='+stuff.vm_port+'&video_node_key='+stuff.video_node_key+'&recording_started=true">Start Recording</a> &nbsp;&nbsp;<br/>'
            }
            else if(!stuff.recording_stopped) {
                html += 'Step 2: !!! Recording !!!<br/>'
                html += 'Step 3: <a href="/testStopRecording2?vm_host='+stuff.vm_host+'&vm_port='+stuff.vm_port+'&video_node_key='+stuff.video_node_key+'&recording_started=true&recording_stopped=true">Stop Recording</a><br/>'
            }
            else if(!stuff.publish_started) {
                // recording as started AND stopped - time to publish !
                html += 'Step 2: Recording Started<br/>'
                html += 'Step 3: Recording Stopped<br/>'
                html += 'Step 4: <a href="/testPublish?vm_host='+stuff.vm_host+'&vm_port='+stuff.vm_port+'&video_node_key='+stuff.video_node_key+'&recording_started=true&recording_stopped=true&publish_started=true">Publish to YouTube</a><br/>'
            }
            else {
                //publish has started
                html += 'Step 2: Recording Started<br/>'
                html += 'Step 3: Recording Stopped<br/>'
                html += 'Step 4: Publish Started - this is the end<br/>'
            }
        }
        html += '</td>'
        html += '<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>'
        html += '<td>'
        html +=     testScenarios()
        html += '</td></tr>'
        html += '</table>'
        stuff.steps_to_run_video = html
        return stuff
    })
}


var createDocker = function(stuff) {
    var url = 'http://'+stuff.vm_host+':'+stuff.vm_port+'/create-another-docker'
    return request(url, function(error, response, body) {
        stuff.error = error
        stuff.response = response
        stuff.body = body // i.e.  {"name": "recorder8000", "port": "8000"}
        stuff.callback(stuff)
    })
}


var onDockerCreation = function(stuff) {
    // body/response doesn't matter because we will get the Up/Exited status by
    // calling mainStuff()...
    if(!stuff.error) {
        var docker = JSON.parse(stuff.body)
        // stuff.body contains 'name' and 'port'
        docker.vm_host = stuff.vm_host
        docker.vm_port = stuff.vm_port
        docker.vm_host_port_name = stuff.vm_host+'_'+stuff.vm_port+'_'+docker.name
        docker.running = true
        docker.recording = false
        docker.container_created = date.asCentralTime()
        docker.container_created_ms = date.asMillis()
        docker.container_started = date.asCentralTime()
        docker.container_started_ms = date.asMillis()
        //docker.response = response // there is a function in the response that will throw an exception
        var docker_key = db.ref('administration/dockers').push().getKey()
        db.ref('administration/dockers/'+docker_key).set(docker)
        stuff.docker_key = docker_key
        stuff.docker = docker
        return stuff.nextAction(stuff)
    }
}


var startDocker = function(stuff) {
    var url = 'http://'+stuff.vm_host+':'+stuff.vm_port+'/start-docker?docker_name='+stuff.docker_name
    return request(url, function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...

        // write to the container's node under /administration/dockers...
        var searchValue = stuff.vm_host+'_'+stuff.vm_port+'_'+stuff.docker_name
        return db.ref('administration/dockers').orderByChild('vm_host_port_name').equalTo(searchValue).once('value').then(snapshot => {
            // should only be one child
            var docker_key
            snapshot.forEach(function(child) {
                var updates = {}
                updates['running'] = true
                updates['recording'] = false
                updates['container_started'] = date.asCentralTime()
                updates['container_started_ms'] = date.asMillis()
                updates['recording_started'] = null
                updates['recording_started_ms'] = null
                updates['recording_stopped'] = null
                updates['recording_stopped_ms'] = null
                updates['container_stopped'] = null
                updates['container_stopped_ms'] = null
                child.ref.update(updates)
                stuff.docker_key = child.key // <-- for the callback
            })
            // In some cases, callback is showDockers().  In others, it's startRecording()
            return stuff.callback(stuff)
        })
    })

}


var handleVideoEvent = function(input) {
    // create a video_event...
    var video_event = {}  // simulated user id...
    // TODO query to get user id, don't hardcode because this uid is only for dev server
    db.ref('users').orderByChild('email').equalTo('bdunklau@yahoo.com').once('value').then(snapshot => {
        var uid
        snapshot.forEach(function(child) {
            uid = child.key
        })
        video_event['uid'] = uid
        video_event['request_type'] = input.request_type // could be 'start recording', 'stop recording', 'start publishing'
        video_event['request_date'] = date.asCentralTime()
        video_event['request_date_ms'] = date.asMillis()
        video_event['video_node_key'] = input.video_node_key
        //video_event['room_id'] = input.room_id           // don't think we need this here
        //video_event['unique_file_ext'] = date.asMillis() // don't think we need this here
        // we have a trigger listening on video/video_events - exports.dockerRequest
        return db.ref('video/video_events').push().set(video_event).then(() => {
            return mainStuff(input).then(stuff => {
                return input.res.status(200).send(render(stuff))
            })
        })
    })

}


// See exports.testStartRecording2 and exports.dockerRequest
var startRecording = function(stuff) {

    return db.ref('video/list/'+stuff.video_node_key).once('value').then(snapshot => {
        var room_id = snapshot.val().room_id

        // make the docker container call back to us once recording has actually started...


        return db.ref('administration/hosts').orderByChild('type')
            .equalTo('firebase functions').limitToFirst(1).once('value').then(snapshot2 => {

            var firebase_host
            snapshot2.forEach(function(child) { firebase_host = child.val().host })

            // See docker: /home/webapp/app.py
            var callback_server = firebase_host
            var callback_uri = 'recording_has_started'
            var video_node_key = stuff.video_node_key
            var docker_key = stuff.docker_key

            // not https ?!
            var recorderUrl = 'http://'+stuff.vm_host+':'+stuff.docker.port+'/record/'+room_id
            recorderUrl += '/'+callback_server
            recorderUrl += '/'+callback_uri
            recorderUrl += '/'+video_node_key
            recorderUrl += '/'+docker_key

            db.ref('video/video_events').push().set({
                date: date.asCentralTime(), date_ms: date.asMillis(),
                event_type: 'call_docker', 'docker_url': recorderUrl
            })

            request(recorderUrl, function(error, response, body) {
                // note: you cannot send the reponse object to the database for debugging. That will cause an error because
                // the response object contains functions as attributes and firebase doesn't like that
                if(!error) {
                    var updates = {}
                    // multi-path updates...
                    updates['administration/dockers/'+stuff.docker_key+'/running'] = true
                    updates['administration/dockers/'+stuff.docker_key+'/recording'] = true
                    updates['administration/dockers/'+stuff.docker_key+'/recording_stopped'] = null
                    updates['administration/dockers/'+stuff.docker_key+'/recording_stopped_ms'] = null

                    // also need to update the video node at /video/list/[video_node_key] with...
                    updates['video/list/'+stuff.video_node_key+'/recording_stopped'] = null
                    updates['video/list/'+stuff.video_node_key+'/recording_stopped_ms'] = null
                    updates['video/list/'+stuff.video_node_key+'/vm_host'] = stuff.vm_host
                    updates['video/list/'+stuff.video_node_key+'/vm_port'] = stuff.vm_port
                    updates['video/list/'+stuff.video_node_key+'/docker_name'] = stuff.docker.name
                    updates['video/list/'+stuff.video_node_key+'/docker_port'] = stuff.docker.port
                    updates['video/list/'+stuff.video_node_key+'/docker_key'] = stuff.docker_key
                    return db.ref('/').update(updates)
                }
                else {
                    snapshot.ref.set({
                        date: date.asCentralTime(), date_ms: date.asMillis(),
                        error: error
                    })
                }
            })

        })

    })

}


// We know the video_node_key.  Use it to look up docker_key (/administration/dockers/{docker_key}) on that record.
// We wrote the docker_key to the video node in startRecording (just above)
var stopRecording = function(stuff) {
    var url = 'http://'+stuff.vm_host+':'+stuff.vm_port+'/stop-recording?docker_name='+stuff.docker_name
    request(url, function(error, response, body) {
        // note: you cannot send the reponse object to the database for debugging. That will cause an error because
        // the response object contains functions as attributes and firebase doesn't like that
        if(!error) {
            var updates = {}
            // multi-path updates...
            updates['administration/dockers/'+stuff.docker_key+'/running'] = true
            updates['administration/dockers/'+stuff.docker_key+'/recording'] = false
            updates['administration/dockers/'+stuff.docker_key+'/recording_stopped'] = date.asCentralTime()
            updates['administration/dockers/'+stuff.docker_key+'/recording_stopped_ms'] = date.asMillis()
            // also need to update the video node at /video/list/[video_node_key] with...
            updates['video/list/'+stuff.video_node_key+'/recording_stopped'] = date.asCentralTime()
            updates['video/list/'+stuff.video_node_key+'/recording_stopped_ms'] = date.asMillis()
            return db.ref('/').update(updates)

        }
        // TODO what if error is thrown?
    })
}


var getVms = function(callback) {
    const options = {
        maxResults: 10 // limits the number of vm's that would be returned/displayed - why would we want to do that?
    };
    compute.getVMs(options, (err, vms) => {
        if (err) {
          return res.status(200).send(render({error:err}))
        }
        console.log('VMs:', vms);
        var vmList = []
        _.each(vms, function(vm) {
            var vmm = {}
            vmm.name = vm.name
            vmm.url = vm.url
            vmm.metadata_id = vm.metadata.id
            vmm.metadata_kind = vm.metadata.kind
            vmm.metadata_name = vm.metadata.name
            vmm.metadata_description = vm.metadata.description
            vmm.metadata_status = vm.metadata.status
            vmm.id = vm.id
            vmList.push(vmm)
        })
        callback({vms:vmList, vmsTitle:'This section does not come from the database. It comes from a Google API call.'})
        //return res.status(200).send(render({vms:vmList, vmsTitle:'This section does not come from the database. It comes from a Google API call.'}))
        /*********
        VMs: [ VM {
            name: 'ubuntu-docker',
            zone:
             Zone {
               metadata: {},
               baseUrl: '/zones',
               parent: [Object],
               id: 'us-east1-b',
               createMethod: undefined,
               methods: [Object],
               interceptors: [],
               Promise: [Function: Promise],
               create: undefined,
               delete: undefined,
               setMetadata: undefined,
               compute: [Object],
               name: 'us-east1-b',
               gceImages: [Object] },
            hasActiveWaiters: false,
            waiters: [],
            url: 'https://www.googleapis.com/compute/v1/projects/telepatriot-dev/zones/us-east1-b/instances/ubuntu-docker',
            metadata:
             { kind: 'compute#instance',
               id: '2981403966515886168',
               creationTimestamp: '2018-03-21T18:28:24.108-07:00',
               name: 'ubuntu-docker',
               description: '',
               tags: [Object],
               machineType: 'https://www.googleapis.com/compute/v1/projects/telepatriot-dev/zones/us-east1-b/machineTypes/f1-micro',
               status: 'RUNNING',
               zone: 'https://www.googleapis.com/compute/v1/projects/telepatriot-dev/zones/us-east1-b',
               canIpForward: false,
               networkInterfaces: [Object],
               disks: [Object],
               metadata: [Object],
               serviceAccounts: [Object],
               selfLink: 'https://www.googleapis.com/compute/v1/projects/telepatriot-dev/zones/us-east1-b/instances/ubuntu-docker',
               scheduling: [Object],
               cpuPlatform: 'Intel Haswell',
               labelFingerprint: '42WmSpB8rSM=',
               startRestricted: false,
               deletionProtection: false },
            baseUrl: '/instances',
            parent:
             Zone {
               metadata: {},
               baseUrl: '/zones',
               parent: [Object],
               id: 'us-east1-b',
               createMethod: undefined,
               methods: [Object],
               interceptors: [],
               Promise: [Function: Promise],
               create: undefined,
               delete: undefined,
               setMetadata: undefined,
               compute: [Object],
               name: 'us-east1-b',
               gceImages: [Object] },
            id: 'ubuntu-docker',
            createMethod: [Function: bound wrapper],
            methods: { create: true, exists: true, get: true, getMetadata: true },
            interceptors: [],
            Promise: [Function: Promise] } ]
        **********/
    });
}














///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
// Triggers

// probably other attributes of the video node that we should set here on the server so that
// we don't have to do that in both clients.  Something to think about TODO
exports.setRoom_id = functions.database.ref('video/list/{video_node_key}').onWrite(event => {
    if(!event.data.val() && event.data.previous.val())
        return false //ignore deleted nodes
    if(event.data.previous.val().room_id)
        return false // if room_id was already set, return early
    return event.data.ref.child('room_id').set(event.params.video_node_key)
})



// Creates the YouTube video title using legislator info
// and video type.
exports.video_title = functions.database.ref('video/list/{videoKey}').onWrite(event => {
    if(!event.data.exists())
        return false //return early if node was deleted
    if(!event.data.val().youtube_video_description_unevaluated)
        return false // this has to exist, otherwise quit
    if(event.data.val().video_title && event.data.previous.val().video_title && event.data.val().video_title == event.data.previous.val().video_title)
        return false // the video title didn't change

    var legislatorDidntChange = event.data.val().leg_id && event.data.previous.val().leg_id && event.data.val().leg_id == event.data.previous.val().leg_id

    var currentCount = !event.data.val().video_participants ? 0 : event.data.val().video_participants.length
    var prevCount =  !event.data.previous.val().video_participants ? 0 : event.data.previous.val().video_participants.length

    var participantAdded = currentCount > prevCount
    var personChanged = participantAdded
    /***** You can debug the conditional that makes us return early below by uncommenting this block, then manually changing
    the youtube video description through the app.  After saving the change, view /templog in the database and examine these attributes...    ****/
//    event.data.adminRef.root.child('templog').set({legislatorDidntChange: legislatorDidntChange,
//                personChanged: personChanged,
//                differentPerson: differentPerson, participantsAdded: participantsAdded})


    // If the only thing that changed was the video description itself, return early.  Don't overwrite the
    // user's manual edit of the video description field
    if(legislatorDidntChange && !personChanged)
        return false

    // construct the video title...
    var from = ''
    if(event.data.val().video_participants && event.data.val().video_participants.length > 0) {
        from = ' from '+event.data.val().video_participants[event.data.val().video_participants.length-1].name
    }
    var to = ''
    if(event.data.val())
    // Example: "Video Petition from Brent Dunklau to Rep Justin Holland (TX HD 33)"
    var video_title = event.data.val().video_type+from+' to '+rep+' '+event.data.val().legislator_first_name+' '+event.data.val().legislator_last_name+' ('+event.data.val().legislator_state_abbrev.toUpperCase()+' '+ch+' '+event.data.val().legislator_district+')'

    // multi-path update even if in this case, it's only one path
    var updates = {}
    updates['video/list/'+event.params.videoKey+'/video_title'] = video_title

    return event.data.adminRef.root.child('/').update(updates)
})



// Creates the YouTube video description using legislator info (name, email, phone, etc)
// and video type.
exports.youtubeVideoDescription = functions.database.ref('video/list/{videoKey}').onWrite(event => {
    if(!event.data.exists())
        return false //return early if node was deleted
    if(!event.data.val().youtube_video_description_unevaluated)
        return false // this has to exist, otherwise quit

    var descriptionAlreadyEvaluated = event.data.val().youtube_video_description && event.data.val().youtube_video_description_unevaluated
        && event.data.val().youtube_video_description != event.data.val().youtube_video_description_unevaluated

    var legislatorDidntChange = event.data.val().leg_id && event.data.previous.val().leg_id && event.data.val().leg_id == event.data.previous.val().leg_id

    var currentCount = !event.data.val().video_participants ? 0 : event.data.val().video_participants.length
    var prevCount =  !event.data.previous.val().video_participants ? 0 : event.data.previous.val().video_participants.length
    var differentPerson = event.data.val().video_participants && event.data.previous.val().video_participants
                    && event.data.val().video_participants[event.data.val().video_participants.length-1].uid != event.data.previous.val().video_participants[event.data.previous.val().video_participants.length-1].uid

    var participantsAdded = currentCount > prevCount
    var personChanged = differentPerson || participantsAdded

    var youtubeVideoDescriptionChanged = event.data.val().youtube_video_description && event.data.previous.val().youtube_video_description
                                && event.data.val().youtube_video_description != event.data.previous.val().youtube_video_description

    /***** You can debug the conditional that makes us return early below by uncommenting this block, then manually changing
    the youtube video description through the app.  After saving the change, view /templog in the database and examine these attributes...    ****/
//    event.data.adminRef.root.child('templog').set({descriptionAlreadyEvaluated: descriptionAlreadyEvaluated, legislatorDidntChange: legislatorDidntChange,
//                personChanged: personChanged, youtubeVideoDescriptionChanged: youtubeVideoDescriptionChanged,
//                differentPerson: differentPerson, participantsAdded: participantsAdded})


    // If the only thing that changed was the video description itself, return early.  Don't overwrite the
    // user's manual edit of the video description field
    if(descriptionAlreadyEvaluated && legislatorDidntChange && !personChanged && youtubeVideoDescriptionChanged)
        return false

    // BUT if we add a participant, we should re-evaluate the description because the second person is assumed
    // to be the constituent.  But if there's only one person on the call, we assume THAT person is the constituent
    // We may end up blowing away user changes.  We'll see...

    var description = event.data.val().youtube_video_description_unevaluated
    var ch = event.data.val().legislator_chamber && event.data.val().legislator_chamber.toLowerCase()=='lower' ? 'HD' : 'SD'
    var rep = event.data.val().legislator_chamber && event.data.val().legislator_chamber.toLowerCase()=='lower' ? 'Rep' : 'Sen'
    var constituent
    if(!event.data.val().video_participants || !event.data.val().video_participants.length) {
        constituent = 'constituent_name'
    }
    else {
        constituent = event.data.val().video_participants[event.data.val().video_participants.length-1].name
    }

    var replace = [
        {"this": "constituent_name", "withThat": constituent},
        {"this": "legislator_chamber_abbrev", "withThat": ch},
        {"this": "legislator_district", "withThat": event.data.val().legislator_district},
        {"this": "legislator_email", "withThat": event.data.val().legislator_email},
        {"this": "legislator_facebook", "withThat": event.data.val().legislator_facebook},
        {"this": "legislator_facebook_id", "withThat": event.data.val().legislator_facebook_id},
        {"this": "legislator_twitter", "withThat": event.data.val().legislator_twitter},
        {"this": "legislator_rep_type", "withThat": rep},
        {"this": "legislator_full_name", "withThat": event.data.val().legislator_full_name},
        {"this": "legislator_phone", "withThat": event.data.val().legislator_phone}
    ]

    // "internal confusion" about whether I should be using _abbrev or not  LOL
    if(event.data.val().legislator_state_abbrev) {
        replace.push({"this": "legislator_state_abbrev_upper", "withThat": event.data.val().legislator_state_abbrev.toUpperCase()})
    }
    else if(event.data.val().legislator_state) {
        replace.push({"this": "legislator_state_abbrev_upper", "withThat": event.data.val().legislator_state.toUpperCase()})
    }

    _.each(replace, function(rep) {
        description = _.replace(description, new RegExp(rep['this'],"g"), rep['withThat'])
    })

    // multi-path update even if in this case, it's only one path
    var updates = {}
    updates['video/list/'+event.params.videoKey+'/youtube_video_description'] = description

    return event.data.adminRef.root.child('/').update(updates)
})


// youtube-subscribe.js:video_processing_callback() writes the newly minted video_id to
// the video node.  So here, we listen for that write and we call back to the docker container
// and tell it to notify us when the video is actually ready for viewing.
exports.monitor_video_processing = functions.database.ref('video/list/{video_node_key}').onWrite(event => {
    if(!event.data.val() && event.data.previous.val())
        return false //ignore deleted nodes
    if(!event.data.val().video_id)
        return false // only listen when video/list/{video_node_key}/video_id is written
    if(event.data.previous.val().video_id && event.data.val().video_id == event.data.previous.val().video_id)
        return false // ignore if video/list/{video_node_key}/video_id didn't actually change

    return db.ref('administration/hosts').once('value').then(snapshot => {
        var firebase, vm;
        snapshot.forEach(function(child) {
            if(child.val().type == 'virtual machine') vm = child.val()
            else if(child.val().type = 'firebase functions') firebase = child.val().host // assume port 80
        })

        return event.data.adminRef.root.child('video/list/'+event.params.video_node_key).once('value').then(snap2 => {
            var monitor_url = 'http://'+vm.host+':'+vm.port
                +'/monitor_video_processing?video_node_key='+event.params.video_node_key
                +'&docker_name='+snap2.val().docker_name
                +'&video_id='+event.data.val()
                +'&callback_server='+firebase
                +'&callback_uri=video_processing_complete'
                +'&maxRetries=100&secondsBetweenRetries=30'
            request(monitor_url, function(error, response, body) {
                // the real response isn't here - it's in youtube-subscribe:video_processing_complete()
            })
        })
    })
})


/************************************
This function was named whenVideoIdIsCreated() because it's supposed to be those things that happen
when video/list/{video_node_key}/video_id is created.  But I realized that the trigger function
above, exports.monitor_video_processing(), is also triggered by the creation of the video_id attribute
So whenVideoIdIsCreated() isn't the greatest name.  But in whenVideoIdIsCreated(), what we're doing is
creating the video_url and then we're posting to FB and TW and then we're sending out an email with
links to YT, FB and TW
**********************************/
exports.whenVideoIdIsCreated = functions.database.ref('video/list/{video_node_key}').onWrite(event => {
    if(!event.data.val() && event.data.previous.val())
        return false //ignore deleted nodes
    if(!event.data.val().video_id)
        return false // only listen when video/list/{video_node_key}/video_id is written
    if(event.data.previous.val().video_id && event.data.val().video_id == event.data.previous.val().video_id)
        return false // ignore if video/list/{video_node_key}/video_id didn't actually change

    var video_url = 'https://www.youtube.com/watch?v='+event.data.val().video_id
    return event.data.ref.child('video_url').set(video_url).then(() => {
        // post to FB
        var facebook_request = {
            //uid: req.query.uid, // do we care what the uid is?
            date: date.asCentralTime(),
            date_ms: date.asMillis(),
            text: event.data.val().youtube_video_description, // Make the FB post the same as the YT video description
            link: video_url  // i.e. YouTube video link
        }

        // This call triggers facebook.js:handleFacebookRequest()
        // Old comment not as helpful as it could be: There are also facebook_comment_requests because that's where we will actually be tagging legislators - in the comments
        return db.ref('facebook_post_requests').push().set(facebook_request)

        // post to TW

        // Send the email
    })
})


/*************************************************************
Mobile clients write to video/video_events and we have a test method above that
writes to video/video_events also - testStartRecording2

A docker request can either be a 'start recording' request or a 'stop recording' request
Start recording requests (event.data.val().request_type = 'start recording') cause this function
to query /administration/dockers looking for an instance that is running:true and recording:false
If no instance like that can be found, we next look for running:false and then start that instance
If no stopped instance can be found, this function will create a new instance, start it, then
start the recording

WHAT DO WE EXPECT TO HAPPEN HERE?...
*************************************************************/
exports.dockerRequest = functions.database.ref('video/video_events/{key}').onCreate(event => {
    // ignore deletes...
    if(!event.data.val()) {
        db.ref('templog2').push().set({dockerRequest: 'oops: !event.data.val()', date: date.asCentralTime()})
        return false
    }

    db.ref('templog2').push().set({dockerRequest: 'check: event.data.val()', date: date.asCentralTime()})
    db.ref('templog2').push().set({event_data_val: event.data.val(), date: date.asCentralTime()})

    // ignore malformed...
    if(!event.data.val().request_type) {
        db.ref('templog2').push().set({dockerRequest: 'oops: !event.data.val().request_type', date: date.asCentralTime()})
        return false
    }
    var type = event.data.val().request_type


    // we don't 'request a room' - we are requesting a 'recording secretary'.  The room is just a
    // name/string that we already know
    if(type == 'start recording') {
        db.ref('templog2').push().set({dockerRequest: 'OK: type = start recording', date: date.asCentralTime()})

        //find the first 'virtual machine' node from /administration/hosts
        return db.ref('administration/hosts').orderByChild('type').equalTo('virtual machine').limitToFirst(1).once('value').then(snapshot => {
            // TODO error handling if no vm's found?  This should never be the case because we hand jam the vm into the database

            var vm
            snapshot.forEach(function(child) {
                vm = child.val()
            })

            db.ref('templog2').push().set({check: 'check vm', vm: vm, date: date.asCentralTime()})

            // then find all /administration/dockers nodes that match the vm's 'host' value (an IP address)
            return event.data.adminRef.root.child('administration/dockers').orderByChild('vm_host').equalTo(vm.host).once('value').then(snapshot => {
                var dockers = []
                snapshot.forEach(function(child) {
                    dockers.push({key: child.key, docker: child.val()})
                })
                db.ref('templog2').push().set({dockerRequest: 'CHECK: dockers.length = '+dockers.length, date: date.asCentralTime()})
                var availableDockers = _.filter(dockers, function(docker) {
                    return docker.docker.running && !docker.docker.recording
                })

                db.ref('templog2').push().set({dockerRequest: 'CHECK: availableDockers...', date: date.asCentralTime()})
                if(availableDockers) db.ref('templog2').push().set({availableDockers: availableDockers})

                if(!availableDockers || availableDockers.length == 0) {
                    db.ref('templog2').push().set({dockerRequest: 'nothing available - looking for stopped dockers...', date: date.asCentralTime()})
                    var stoppedDockers = _.filter(dockers, function(docker) {
                        return !docker.docker.running
                    })
                    if(!stoppedDockers || stoppedDockers.length == 0) {
                        db.ref('templog2').push().set({dockerRequest: 'hmmm... no stopped dockers either', date: date.asCentralTime()})
                        // create a new docker instance, then start the recording
                        return createDocker({vm_host: vm.host,
                                             vm_port: vm.port,
                                             video_node_key: event.data.val().video_node_key,
                                             callback: onDockerCreation,
                                             nextAction: startRecording})
                    }
                    else {
                        var selectedDocker = stoppedDockers[0]
                        db.ref('templog2').push().set({dockerRequest: 'OK: at least we found a stopped docker', date: date.asCentralTime()})
                        db.ref('templog2').push().set({stoppedDocker: selectedDocker, date: date.asCentralTime()})
                        // found a docker, it just wasn't running, so start it...

                        return startDocker({vm_host: vm.host,
                                            vm_port: vm.port,
                                            docker_name: selectedDocker.docker.name,
                                            // for startRecording...
                                            docker: selectedDocker.docker,
                                            video_node_key: event.data.val().video_node_key,
                                            room_id: event.data.val().room_id,
                                            //unique_file_ext: event.data.val().unique_file_ext, // get from video/list node instead
                                            callback: startRecording })
                    }
                }
                else {
                    var selectedDocker = availableDockers[0]
                    startRecording({vm_host: vm.host,
                                   vm_port: vm.port,
                                   docker: selectedDocker.docker,
                                   docker_key: selectedDocker.key,
                                   video_node_key: event.data.val().video_node_key,
                                   //unique_file_ext: event.data.val().unique_file_ext, // get from video/list node instead
                                   room_id: event.data.val().room_id})
                }
            })
        })
    }
    else if(type == 'stop recording') {
        // construct the url to the virtual machine to tell it to stop recording...
        return db.ref('video/list/'+event.data.val().video_node_key).once('value').then(snapshot => {
            var video_node = snapshot.val()
            var args = {video_node_key: event.data.val().video_node_key,
                        vm_host: video_node.vm_host,
                        vm_port: video_node.vm_port,
                        docker_name: video_node.docker_name,
                        docker_key: video_node.docker_key}
            return stopRecording(args)
        })
    }
    else if(type == 'start publishing') {

        return event.data.adminRef.root.child('administration/hosts').orderByChild('type')
            .equalTo('firebase functions').limitToFirst(1).once('value').then(snapshot => {

            var firebase_host
            snapshot.forEach(function(child) { firebase_host = child.val().host })

            return event.data.adminRef.root.child('video/list/'+event.data.val().video_node_key).once('value').then(snapshot => {

                snapshot.ref.update({publishing_started: date.asCentralTime(), publishing_started_ms: date.asMillis()})

                var vm_host = snapshot.val().vm_host
                var vm_port = snapshot.val().vm_port
                var title = snapshot.val().video_title
                var description = snapshot.val().youtube_video_description
                var docker_name = snapshot.val().docker_name
                var uid = event.data.val().uid
                var callbackurl = 'https://'+firebase_host+'/video_processing_callback?video_node_key='+event.data.val().video_node_key // assume port 80

                // See ~/nodejs/index.js on the virtual machines
                var vmUrl = 'http://'+vm_host+':'+vm_port+'/publish?title='+title
                    +'&description='+description+'&docker_name='+docker_name+'&uid='+uid+'&callbackurl='+callbackurl

                return request(vmUrl, function(error, response, body) {
                    // response doesn't matter because we have passed a callback url that will be called
                    // when the uploading begins and ends.
                    if(error) {
                        event.data.adminRef.root.child('video/list/'+event.data.val().video_node_key+'/publishing_error')
                            .set({date: date.asCentralTime(), date_ms: date.asMillis(), error: error, vm_url: vmUrl})
                    }
                })

            })

        })

    }

    // ignore all others...
    else return false
})









///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
// Layout


var getDockerHtml = function(dockers, url, vm_host, vm_port) {
    var html = ''
    html += '<b>Docker Instances returned by this url:</b><br/>'
    html += '<a href="'+url+'">'+url+'</a> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
    html += '<a href="/testCreateAnotherDocker?vm_host='+vm_host+'&vm_port='+vm_port+'">Create Another Docker</a> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
    html += '<br/>'
    html += '<table border="1">'
    _.each(dockers, function(docker) {
        var isUp = false
        if(docker.status && docker.status.toLowerCase().startsWith('up')) isUp = true
        var startDocker = '<a href="/testStartDocker?vm_host='+vm_host+'&vm_port='+vm_port+'&docker_name='+docker.name+'">start</a>'
        var stopDocker = '<a href="/testStopDocker?vm_host='+vm_host+'&vm_port='+vm_port+'&docker_name='+docker.name+'">stop</a>'
        var stopAndRemove = '<a href="/testStopAndRemoveDocker?vm_host='+vm_host+'&vm_port='+vm_port+'&docker_name='+docker.name+'">stop & remove</a>'
        var portStr = ''
        if(docker.port) portStr = docker.port
        var stopRecording = '<a href="/testStopRecording?vm_host='+vm_host+'&vm_port='+vm_port+'&docker_name='+docker.name+'">stop</a>'

        html +=             '<tr>'
        //                      the left hand cell is where we list all the attributes of the docker instance
        html +=                 '<td>'
        html +=                     '<table border="0">'
        html +=                         '<tr>'
        html +=                             '<td><b>Docker:</b></td>'
        html +=                             '<td>'+docker.name+' ['+startDocker+'] ['+stopDocker+'] ['+stopAndRemove+']</td>'
        html +=                         '</tr>'
        html +=                         '<tr>'
        html +=                             '<td>Status</td>'
        html +=                             '<td>'+docker.status+'</td>'
        html +=                         '</tr>'
        if(isUp) {
        html +=                         '<tr>'
        html +=                             '<td>Port</td>'
        html +=                             '<td>'+portStr+'</td>'
        html +=                         '</tr>'
        html +=                         '<tr>'
        html +=                             '<td>Port Mapping</td>'
        html +=                             '<td>'+docker.port_mapping+'</td>'
        html +=                         '</tr>'
        html +=                     '<form method="post" action="/testStartRecording">'
        html +=                         '<tr>'
        html +=                             '<td>&nbsp;<P/><b>Recording</b></td>'
        html +=                             '<td>&nbsp;<P/>'+stopRecording+'</td>'
        html +=                         '</tr>'
        html +=                         '<tr>'
        html +=                             '<td>Room</td>'
        html +=                             '<td><input type="text" name="room_id" value="'+date.asMillis()+'" />'
        html +=                                 '<input type="hidden" name="vm_host" value="'+vm_host+'"/>'
        html +=                                 '<input type="hidden" name="vm_port" value="'+vm_port+'"/></td>'
        html +=                                 '<input type="hidden" name="dockerPort" value="'+docker.port+'"/></td>'
        html +=                         '</tr>'
        html +=                         '<tr>'
        html +=                             '<td>Unique File Ext</td>'
        html +=                             '<td><input type="text" name="uniqueIdentifier" value="'+date.asMillis()+'" /></td>'
        html +=                         '</tr>'
        html +=                         '<tr>'
        html +=                             '<td></td>'
        html +=                             '<td><input type="submit" value="start recording" /></td>'
        html +=                         '</tr>'
        html +=                     '</form>'
        } // end if(isUp)
        html +=                     '</table>'
        html +=                 '</td>'

        //                      the right hand cell is where we list all the recording-xxxxx.flv files for the docker instance
        html +=                 '<td valign="top">'
        html +=                     '<table border="0">'
        html +=                         '<tr>'
        // the actual command has " marks:  docker exec recorder8001 sh -c "ls -al /opt/vidyo/recording-*.*"
        var tooltip = 'Runs: docker exec '+docker.name+' sh -c ls -al /opt/vidyo/recording-*.*'
        html +=                             '<td><a href="/listRecordings?vm_host='+vm_host+'&vm_port='+vm_port+'&docker_name='+docker.name+'" title="'+tooltip+'">List Recordings</a></td>'
        html +=                         '</tr>'
                                    _.each(docker.recordings, function(fileStuff) {
                                        var idx = fileStuff.indexOf('/opt/vidyo')
                                        if(idx == -1) return
                                        var filename = fileStuff.substring(idx)
                                        var rmFile = '[<a href="/removeRecording?vm_host='+vm_host+'&vm_port='+vm_port+'&docker_name='+docker.name+'&filename='+filename+'">delete</a>]'
                                        html += '<tr><td>'+rmFile+' '+fileStuff+'</td></tr>'
                                    })
        html +=                     '</table>'
        html +=                 '</td>'
        html +=             '</tr>'

    })
    html += '</table>'
    return html
}


var showDockers = function(stuff) {
    var host = stuff.vm_host
    var port = stuff.vm_port
    var res = stuff.res
    var url = 'http://'+host+':'+port+'/dockers' // not https ?!
    request(url, function(error, response, body) {
        try {
            var dockers = JSON.parse(body)
            var dockerHtml = getDockerHtml(dockers, url, host, port)
            var input = {}
            input.dockers = dockerHtml
            input.vm_host = host
            input.vm_port = port
            return mainStuff(input).then(stuff => {
                return res.status(200).send(render(stuff))
            })
        } catch(err) {
            var theerror = err + ' for url: '+url
            return res.status(200).send(render({error: theerror, body: body, response: response}))
        }
    })
}


// just for listing recording files - TODO really should figure out how to un-duplicate these 2 methods
var showDockers2 = function(args) {
    var host = args.vm_host
    var port = args.vm_port
    var res = args.res
    var url = 'http://'+host+':'+port+'/dockers' // not https ?!
    request(url, function(error, response, body) {
        try {
            var dockers = JSON.parse(body)
            var selectedDocker = _.find(dockers, {'name': args.docker_name})
            if(selectedDocker)
                selectedDocker.recordings = _.split(args.body, '\n')
            var dockerHtml = getDockerHtml(dockers, url, host, port)
            var input = {}
            input.dockers = dockerHtml
            input.vm_host = host
            input.vm_port = port
            return mainStuff(input).then(stuff => {
                //stuff.response = args.response // this is just [object Object]
                //stuff.body = args.body // this is the json string
                return res.status(200).send(render(stuff))
            })
        } catch(err) {
            return res.status(200).send(render({error: err, body: body, response: response}))
        }
    })
}


var testScenarios = function() {
    var html = ''
    html += '<table border="0">'
    html +=     '<tr><td><b>Test Scenarios</b></td></tr>'
    html +=     '<tr><td style="font-weight:bold">#1 One running docker instance, not currently recording anything</td></tr>'
    html +=     '<tr><td>   &nbsp;&nbsp;&nbsp; GET request causes it to start recording</td></tr>'
    html +=     '<tr><td style="font-weight:bold">#2 Two running docker instances, one of them recording, the other available</td></tr>'
    html +=     '<tr><td>   &nbsp;&nbsp;&nbsp; GET request on the available instance</td></tr>'
    html +=     '<tr><td style="font-weight:bold">#3 Two running docker instances, one of them recording, the other stopped</td></tr>'
    html +=     '<tr><td>   &nbsp;&nbsp;&nbsp; Start the stopped instance, then GET request</td></tr>'
    html +=     '<tr><td style="font-weight:bold">#4 One running docker instance, currently recording</td></tr>'
    html +=     '<tr><td>   &nbsp;&nbsp;&nbsp; Create a new instance, then GET request</td></tr>'
    html +=     '<tr><td></td></tr>'
    html += '</table>'
    return html
}


var render = function(stuff) {
    var html = '<html><head></head><body>'
    if(stuff.error)
        html += '<P/>stuff.error = '+stuff.error
    if(stuff.response)
        html += '<P/>stuff.response = '+stuff.response
    if(stuff.body)
        html += '<P/>stuff.body = '+stuff.body

    // this block never gets rendered because
    if(stuff.vms) {
        html += '<P/>'
        html += '<b>'+stuff.vmsTitle+'</b><br/>'
        html += '<table border="1">'
        _.each(stuff.vms, function(vm) {
            var keys = Object.keys(vm)
            html += '<tr>'
            _.each(keys, function(key) {
                html += '<td>'+vm[key]+'</td>'
            })
            html += '</tr>'
        })
        html += '</table>'
    }
    if(stuff.firebaseHost) {
        html += '<P/>'+stuff.firebaseHost
    }
    if(stuff.vmsInDatabase) {
        html += '<P/>'+stuff.vmsInDatabase
    }
    if(stuff.pings) {
        html += '<P/>'+stuff.pings
    }
    if(stuff.dockers) {
        html += '<P/>'+stuff.dockers
    }
    if(stuff.administration_dockers) {
        html += '<P/>'+stuff.administration_dockers
    }
    if(stuff.steps_to_run_video) {
        html += '<P/>'+stuff.steps_to_run_video
    }
    if(stuff.video_events) {
        html += '<P/>'+stuff.video_events
    }
    html += '</body></html>'
    return html
}






















///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
// older stuff but still good


exports.sendToVirtualMachines = functions.https.onRequest((req, res) => {
    var thisHost = req.body.firebaseHost
    var csvAddresses = req.body.vmList
    var addresses = _.split(csvAddresses, ',')
    // ping all the virtual machines with the address of the firebase functions server so that the virtual
    // machines know who to call back to
    var urls = _.map(addresses, function(address) {
        return {url: 'https://'+address+'/firebase-host/?host='+thisHost, ping_from: address}
    })
    _.each(things, function(thing) {
        var url = thing.url
        request(url, function(error, response, body) {
            var node = {date: date.asCentralTime(), date_ms: date.asMillis(), ping_from: thing.ping_from, error: '', response: '', body: ''}
            if(error) node.error = error
            if(response) node.response = response
            if(body) node.body = body
            db.ref('pings').push().set(node)
        })
    })

    return getPings().then(pings => {
        var pingHtml = getPingHtml(pings)
        return res.status(200).send(render({pings: pingHtml}))
    })
})


var getPings = function() {
    return db.ref('pings').once('value').then(snapshot => {
        var pings = []
        snapshot.forEach(function(child) {
            var ping = child.val()
            ping.key = child.key
            pings.push(ping)
        })
        return pings
    })
}


var getPingHtml = function(pings) {
    if(!pings || pings.length)
        return 'no pings from the virtual machine(s) yet'
    var html = '<b>Pings from Virtual Machines</b>'
    html = '<table border="1">'
    html += '<tr>'
    html +=     '<th>Date</th>'
    html +=     '<th>Ping From</th>'
    html +=     '<th>Error</th>'
    html +=     '<th>Response</th>'
    html +=     '<th>Body</th>'
    html += '</tr>'
    _.each(pings, function(ping) {
        html += '<tr>'
        html +=     '<td>'+ping.date+'</td>'
        html +=     '<td>'+ping.ping_from+'</td>'
        html +=     '<td>'+ping.error+'</td>'
        html +=     '<td>'+ping.response+'</td>'
        html +=     '<td>'+ping.body+'</td>'
        html += '</tr>'
    })
    html += '</table>'
    return html
}


// I DON'T THINK WE NEED THIS  *******************
// WE CAN SEND THE FBASE FUNCTIONS URL TO THE NODE SERVER ON EACH REQUEST
var htmlForFirebaseHost = function(stuff) {
    var firebaseHost = stuff.firebaseHost
    var xxx = _.map(stuff.vmsInDatabase, function(vm) {return vm.host})
    var vmList = _.join(xxx, ',')
    var html = ''
    html += '(I don\'t think we even need this)<br/>'
    html = '<form method="post" action="/sendToVirtualMachines">'
    html += '<b>Send this address:</b> <input type="text" name="firebaseHost" value="'+firebaseHost+'" size="50" /><p/>'
    html += '<b>to these server(s):</b> <input type="text" name="vmList" value="'+vmList+'" size="50" /><p/>'
    html += '<input type="submit" value="send">'
    html += '</form>'
    return html
}


var htmlOfHosts = function(hosts, title) {
    if(!hosts || hosts.length == 0)
        return 'no hosts - is that right?'
    var html = ''
    html += '<b>'+title+'</b><br/>'
    html += '<table border="1">'
    html += '<tr>'
    html +=     '<th>type</th>'
    html +=     '<th>host</th>'
    html +=     '<th>dockers</th>'
    html += '</tr>'
    _.each(hosts, function(host) {
        html += '<tr>'
        html +=     '<td>'+host.type+'</td>'
        html +=     '<td>'+host.host+'</td>'
        html +=     '<td><a href="/dockers?vm_host='+host.host+'&vm_port='+host.port+'">dockers</a></td>'
        html += '</tr>'
    })
    html += '</table>'
    return html
}