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


exports.cloud = functions.https.onRequest((req, res) => {
    return mainStuff().then(stuff => {
        return res.status(200).send(render(stuff))
    })
})


var mainStuff = function() {
    return db.ref(`administration/hosts`).once('value').then(snapshot => {
        var hosts = []
        var vms = []
        snapshot.forEach(function(child) {
            var host = child.val()
            host.key = child.key
            hosts.push(host)
        })
        var firebaseHost = _.find(hosts, {type: 'firebase functions'}).host
        var vms = _.filter(hosts, {type: 'virtual machine'})
        return {vmsInDatabase: vms, firebaseHost: firebaseHost}
    })
    .then(stuff => {
        var vmHtml = htmlOfHosts(stuff.vmsInDatabase, 'Virtual Machines Stored in the database under /administration/hosts')
        var firebaseHostHtml = htmlForFirebaseHost(stuff)
        return {vmsInDatabase: vmHtml, firebaseHost: firebaseHostHtml}
    })
    .then(stuff => {
        return db.ref(`administration/dockers`).once('value').then(snapshot => {
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
        return db.ref(`videos/docker_requests`).once('value').then(snapshot => {
            var html = ''
            html += '<table cellspacing="0" border="1" cellpadding="2">'
            html += '<tr>'
            html +=     '<th colspan="5">/videos/docker_requests</th>'
            html += '</tr>'
            html += '<tr>'
            html +=     '<th>key</th>'
            html +=     '<th>uid (user id)</th>'
            html +=     '<th>request_date</th>'
            html +=     '<th>video_node_key</th>'
            html +=     '<th>room_id</th>'
            html += '</tr>'
            snapshot.forEach(function(child) {
                html += '<tr>'
                html +=     '<td>'+child.key+'</td>'
                html +=     '<td>'+child.val().uid+'</td>'
                html +=     '<td>'+child.val().request_date+'</td>'
                html +=     '<td>'+child.val().video_node_key+'</td>'
                html +=     '<td>'+child.val().room_id+'</td>'
                html += '</tr>'
            })
            html += '</table>'
            stuff.docker_requests = html
            return stuff
        })
    })
}


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
            db.ref(`pings`).push().set(node)
        })
    })

    return getPings().then(pings => {
        var pingHtml = getPingHtml(pings)
        return res.status(200).send(render({pings: pingHtml}))
    })
})


var getPings = function() {
    return db.ref(`pings`).once('value').then(snapshot => {
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
    html +=     '<th>find a docker</th>'
    html += '</tr>'
    _.each(hosts, function(host) {
        html += '<tr>'
        html +=     '<td>'+host.type+'</td>'
        html +=     '<td>'+host.host+'</td>'
        html +=     '<td><a href="/dockers?host='+host.host+'&port='+host.port+'">dockers</a></td>'
        html +=     '<td><a href="/testRequestDocker?host='+host.host+'&port='+host.port+'">find a docker</a></td>'
        html += '</tr>'
    })
    html += '</table>'
    return html
}


exports.dockers = functions.https.onRequest((req, res) => {
    return showDockers(req.query.host, req.query.port, res)
})


var showDockers = function(host, port, res) {
    var url = 'http://'+host+':'+port+'/dockers' // not https ?!
    request(url, function(error, response, body) {
        try {
            var dockers = JSON.parse(body)
            var dockerHtml = getDockerHtml(dockers, url, host, port)
            return mainStuff().then(stuff => {
                stuff.dockers = dockerHtml
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
    var host = args.host
    var port = args.port
    var res = args.res
    var url = 'http://'+host+':'+port+'/dockers' // not https ?!
    request(url, function(error, response, body) {
        try {
            var dockers = JSON.parse(body)
            var selectedDocker = _.find(dockers, {'name': args.dockerName})
            if(selectedDocker)
                selectedDocker.recordings = _.split(args.body, '\n')
            var dockerHtml = getDockerHtml(dockers, url, host, port)
            return mainStuff().then(stuff => {
                stuff.dockers = dockerHtml
                //stuff.response = args.response // this is just [object Object]
                //stuff.body = args.body // this is the json string
                return res.status(200).send(render(stuff))
            })
        } catch(err) {
            return res.status(200).send(render({error: err, body: body, response: response}))
        }
    })
}


var getDockerHtml = function(dockers, url, vmHost, vmPort) {
    var html = ''
    html += '<b>Docker Instances returned by this url:</b><br/>'
    html += '<a href="'+url+'">'+url+'</a> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
    html += '<a href="/testCreateAnotherDocker?vmHost='+vmHost+'&vmPort='+vmPort+'">Create Another Docker</a> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
    html += '<br/>'
    html += '<table border="1">'
    _.each(dockers, function(docker) {
        var isUp = false
        if(docker.status && docker.status.toLowerCase().startsWith('up')) isUp = true
        var startDocker = '<a href="/testStartDocker?vmHost='+vmHost+'&vmPort='+vmPort+'&dockerName='+docker.name+'">start</a>'
        var stopDocker = '<a href="/stopDocker?vmHost='+vmHost+'&vmPort='+vmPort+'&dockerName='+docker.name+'">stop</a>'
        var stopAndRemove = '<a href="/stopAndRemoveDocker?vmHost='+vmHost+'&vmPort='+vmPort+'&dockerName='+docker.name+'">stop & remove</a>'
        var portStr = ''
        if(docker.port) portStr = docker.port
        var stopRecording = '<a href="/stopRecording?vmHost='+vmHost+'&vmPort='+vmPort+'&dockerName='+docker.name+'">stop</a>'

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
        html +=                     '<form method="post" action="/startRecording">'
        html +=                         '<tr>'
        html +=                             '<td>&nbsp;<P/><b>Recording</b></td>'
        html +=                             '<td>&nbsp;<P/>'+stopRecording+'</td>'
        html +=                         '</tr>'
        html +=                         '<tr>'
        html +=                             '<td>Room</td>'
        html +=                             '<td><input type="text" name="room_id" value="'+date.asMillis()+'" />'
        html +=                                 '<input type="hidden" name="vmHost" value="'+vmHost+'"/>'
        html +=                                 '<input type="hidden" name="vmPort" value="'+vmPort+'"/></td>'
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
        html +=                             '<td><a href="/listRecordings?vmHost='+vmHost+'&vmPort='+vmPort+'&dockerName='+docker.name+'" title="'+tooltip+'">List Recordings</a></td>'
        html +=                         '</tr>'
                                    _.each(docker.recordings, function(fileStuff) {
                                        var idx = fileStuff.indexOf('/opt/vidyo')
                                        if(idx == -1) return
                                        var filename = fileStuff.substring(idx)
                                        var rmFile = '[<a href="/removeRecording?vmHost='+vmHost+'&vmPort='+vmPort+'&dockerName='+docker.name+'&filename='+filename+'">delete</a>]'
                                        html += '<tr><td>'+rmFile+' '+fileStuff+'</td></tr>'
                                    })
        html +=                     '</table>'
        html +=                 '</td>'
        html +=             '</tr>'

    })
    html += '</table>'
    return html
}


exports.removeRecording = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vmHost+':'+req.query.vmPort+'/remove-recording?dockerName='+req.query.dockerName+'&filename='+req.query.filename
    return request(url, function(error, response, body) {
        var stuff = {}
        stuff.response = response
        stuff.body = body
        stuff.host = req.query.vmHost
        stuff.port = req.query.vmPort
        stuff.res = res
        stuff.dockerName = req.query.dockerName
        return showDockers2(stuff)
    })
})


exports.listRecordings = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vmHost+':'+req.query.vmPort+'/list-recordings?dockerName='+req.query.dockerName
    return request(url, function(error, response, body) {
        var stuff = {}
        stuff.response = response
        stuff.body = body
        stuff.host = req.query.vmHost
        stuff.port = req.query.vmPort
        stuff.res = res
        stuff.dockerName = req.query.dockerName
        return showDockers2(stuff)
    })
})


exports.testStartDocker = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vmHost+':'+req.query.vmPort+'/start-docker?dockerName='+req.query.dockerName
    return request(url, function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...

        // write to the container's node under /administration/dockers...
        var searchValue = req.query.vmHost+'_'+req.query.vmPort+'_'+req.query.dockerName
        return db.ref(`administration/dockers`).orderByChild('vm_host_port_name').equalTo(searchValue).once('value').then(snapshot => {
            // should only be one child
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
            })
            return showDockers(req.query.vmHost, req.query.vmPort, res)
        })
    })
})


exports.startRecording = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.body.vmHost+':'+req.body.dockerPort+'/record/'+req.body.room_id+'/'+req.body.uniqueIdentifier
    return request(url, function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...

        // write to the container's node under /administration/dockers...
        var dockerName = 'recorder'+req.body.dockerPort
        var searchValue = req.body.vmHost+'_'+req.body.vmPort+'_'+dockerName
        return db.ref(`administration/dockers`).orderByChild('vm_host_port_name').equalTo(searchValue).once('value').then(snapshot => {
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
            return showDockers(req.body.vmHost, req.body.vmPort, res)
        })
    })
})


exports.stopRecording = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vmHost+':'+req.query.vmPort+'/stop-recording?dockerName='+req.query.dockerName
    return request(url, function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...

        // write to the container's node under /administration/dockers...
        var searchValue = req.query.vmHost+'_'+req.query.vmPort+'_'+req.query.dockerName
        return db.ref(`administration/dockers`).orderByChild('vm_host_port_name').equalTo(searchValue).once('value').then(snapshot => {
            // should only be one child
            snapshot.forEach(function(child) {
                var updates = {}
                updates['running'] = true
                updates['recording'] = false
                updates['recording_stopped'] = date.asCentralTime()
                updates['recording_stopped_ms'] = date.asMillis()
                child.ref.update(updates)
            })
            return showDockers(req.query.vmHost, req.query.vmPort, res)
        })
    })
})


exports.stopDocker = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vmHost+':'+req.query.vmPort+'/stop-docker?dockerName='+req.query.dockerName
    return request(url, function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...

        // write to the container's node under /administration/dockers...
        var searchValue = req.query.vmHost+'_'+req.query.vmPort+'_'+req.query.dockerName
        return db.ref(`administration/dockers`).orderByChild('vm_host_port_name').equalTo(searchValue).once('value').then(snapshot => {
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
            return showDockers(req.query.vmHost, req.query.vmPort, res)
        })
    })
})


exports.stopAndRemoveDocker = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vmHost+':'+req.query.vmPort+'/stop-and-remove-docker?dockerName='+req.query.dockerName
    return request(url, function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...

        // delete the container's node under /administration/dockers...
        var searchValue = req.query.vmHost+'_'+req.query.vmPort+'_'+req.query.dockerName
        return db.ref(`administration/dockers`).orderByChild('vm_host_port_name').equalTo(searchValue).once('value').then(snapshot => {
            // should only be one child
            snapshot.forEach(function(child) {
                child.ref.remove()
            })
            return showDockers(req.query.vmHost, req.query.vmPort, res)
        })
    })
})


exports.testCreateAnotherDocker = functions.https.onRequest((req, res) => {
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
            db.ref(`administration/dockers`).push().set(docker)
        }
        return showDockers(host, port, res)
    }
    return createDocker(req.query.vmHost, req.query.vmPort, callback)
})


/**************************************************************
// This function tests the database trigger that listens on videos/docker_requests
// Mobile clients will write to videos/docker_requests when they want to start recording
// and stop recording.  This http test function allows us to write to the same place that
// the mobile clients will write to.
//
// The trigger exports.dockerRequest is responsible for determining what docker instance is
// available for recording.  See the comment header above that trigger for the explanation of
// how it makes this determination
*******************************************************************/
exports.testRequestDocker = functions.https.onRequest((req, res) => {
    // create a docker_request...
    var docker_request = {}  // simulated user id...
    docker_request['uid'] = 'dztOse5lKoNht9bPpOl3QeE33y22'
    docker_request['request_type'] = 'start recording' // can also be 'stop recording'
    docker_request['request_date'] = date.asCentralTime()
    docker_request['request_date_ms'] = date.asMills()
    docker_request['video_node_key'] = date.asMillis() //simulated key
    docker_request['room_id'] = date.asMillis() //simulated room_id
    return db.ref(`videos/docker_requests`).push().set(docker_request).then(() => {
        return mainStuff().then(stuff => {
            return res.status(200).send(render(stuff))
        })
    })

    /********* maybe...
    return db.ref(`administration/dockers`).once('value').then(snapshot => {
        if(snapshot.numChildren() == 0) {
            var callback = function(error, response, body) {
                // set /administration/dockers/{key}/video_node_key = video node key
                // so that we can tell this docker is being used at the moment
            }
            return createDocker(req.query.host, req.query.port, callback)
        }
        else {
            var dockers = []
            snapshot.forEach(function(child) {
                dockers.push(child.val())
            })
            var runningDockers = _.filter(dockers, {'running':true})
        }
    })
    ***********/
})


/*************************************************************
A docker request can either be a 'start recording' request or a 'stop recording' request
Start recording requests (event.data.val().request_type = 'start recording') cause this function
to query /administration/dockers looking for an instance that is running:true and recording:false
If no instance like that can be found, we next look for running:false and then start that instance
If no stopped instance can be found, this function will create a new instance, start it, then
start the recording

WHAT DO WE EXPECT TO HAPPEN HERE?...
*************************************************************/
exports.dockerRequest = functions.database.ref('videos/docker_requests').onWrite(event => {
    // ignore deletes...
    if(!event.data.val()) return false
    // ignore malformed...
    if(!event.data.val().request_type) return false
    var type = event.data.val().request_type
    // we don't 'request a room' - we are requesting a 'recording secretary'.  The room is just a
    // name/string that we already know
    if(type == 'start recording') {
        //find the first 'virtual machine' node from /administration/hosts
        return db.ref(`administration/hosts`).orderByChild('type').equalTo('virtual machine').limitToFirst(1).once('value').then(snapshot => {
            // TODO error handling if no vm's found?  This should never be the case because we hand jam the vm into the database
            var vm = snapshot.val()[0]

            // then find all /administration/dockers nodes that match the vm's 'host' value (an IP address)
            return event.data.adminRef.root.child(`administration/dockers`).orderByChild('vm_host').equalTo(vm.host).once('value').then(snapshot => {
                var dockers = []
                snapshot.forEach(function(child) {
                    dockers.push(child.val())
                })
                var availableDockers = _.filter(dockers, {'running': true, 'recording': false})
                if(!availableDockers || availableDockers.length == 0) {
                    var stoppedDockers = _.filter(dockers, {'running': false})
                    if(!stoppedDockers || stoppedDockers.length == 0) {
                        // TODO we have to create a new docker instance.  It will be created running by default
                    }
                    else {
                        var selectedDocker = stoppedDockers[0]
                        // TODO need to start this docker first...
                    }
                }
                else {
                    var selectedDocker = availableDockers[0]
                    // TODO write this docker to where?...
                }
            })
        })
    }
    else if(type == 'stop recording') {
    }
    // ignore all others...
    else return false
})


var createDocker = function(host, port, callback) {
    var url = 'http://'+host+':'+port+'/create-another-docker'
    return request(url, callback)
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


exports.listImages = functions.https.onRequest((req, res) => {

    // getting rid of templog2 is just ad hoc housecleaning
    return db.ref('templog2').remove().then(() => {

        return getVms(function(stuff) {
            return res.status(200).send(render(stuff))
        })
    })

})

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
    if(stuff.docker_requests) {
        html += '<P/>'+stuff.docker_requests
    }
    html += '</body></html>'
    return html
}