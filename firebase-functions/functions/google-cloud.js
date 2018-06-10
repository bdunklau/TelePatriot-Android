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
            var node = {date: date.asCentralTiime(), date_ms: date.asMillis(), ping_from: thing.ping_from, error: '', response: '', body: ''}
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
    html += '</tr>'
    _.each(hosts, function(host) {
        html += '<tr>'
        html +=     '<td>'+host.type+'</td>'
        html +=     '<td>'+host.host+'</td>'
        html +=     '<td><a href="/dockers?host='+host.host+'&port='+host.port+'">dockers</a></td>'
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
            return res.status(200).send(render({error: err, body: body, response: response}))
        }
    })
}


var getDockerHtml = function(dockers, url, vmHost, vmPort) {
    var html = ''
    html += '<b>Docker Instances returned by this url:</b><br/>'
    html += '<a href="'+url+'">'+url+'</a> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
    html += '<a href="/createAnotherDocker?vmHost='+vmHost+'&vmPort='+vmPort+'">Create Another Docker</a><br/>'
    html += '<table border="1">'
    html += '<tr>'
    html +=     '<th>Start</th>'
    html +=     '<th>Stop</th>'
    html +=     '<th>Stop & Remove</th>'
    html +=     '<th>Name</th>'
    html +=     '<th>Status</th>'
    html +=     '<th>Port Mapping</th>'
    html +=     '<th>Port</th>'
    html += '</tr>'
    _.each(dockers, function(docker) {
        html += '<tr>'
        html +=     '<td><a href="/startDocker?vmHost='+vmHost+'&vmPort='+vmPort+'&dockerName='+docker.name+'">start</a></td>'
        html +=     '<td><a href="/stopDocker?vmHost='+vmHost+'&vmPort='+vmPort+'&dockerName='+docker.name+'">stop</a></td>'
        html +=     '<td><a href="/stopAndRemoveDocker?vmHost='+vmHost+'&vmPort='+vmPort+'&dockerName='+docker.name+'">stop & remove</a></td>'
        html +=     '<td>'+docker.name+'</td>'
        html +=     '<td>'+docker.status+'</td>'
        html +=     '<td>'+docker.port_mapping+'</td>'
        if(docker.port)
            html += '<td>'+docker.port+'</td>'
        else
            html += '<td> </td>'
        html += '</tr>'
    })
    html += '</table>'
    return html
}


exports.startDocker = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vmHost+':'+req.query.vmPort+'/start-docker?dockerName='+req.query.dockerName
    return request(url, function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...
        return showDockers(req.query.vmHost, req.query.vmPort, res)
    })
})


exports.stopDocker = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vmHost+':'+req.query.vmPort+'/stop-docker?dockerName='+req.query.dockerName
    return request(url, function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...
        return showDockers(req.query.vmHost, req.query.vmPort, res)
    })
})


exports.stopAndRemoveDocker = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vmHost+':'+req.query.vmPort+'/stop-and-remove-docker?dockerName='+req.query.dockerName
    return request(url, function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...
        return showDockers(req.query.vmHost, req.query.vmPort, res)
    })
})


exports.createAnotherDocker = functions.https.onRequest((req, res) => {
    var url = 'http://'+req.query.vmHost+':'+req.query.vmPort+'/create-another-docker'
    return request(url, function(error, response, body) {
        // body/response doesn't matter because we will get the Up/Exited status by
        // calling mainStuff()...
        return showDockers(req.query.vmHost, req.query.vmPort, res)
    })
})


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
    html += '</body></html>'
    return html
}