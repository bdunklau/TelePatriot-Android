'use strict'


// most external dependencies declared in firebase-functions/functions/package.json
const _ = require('lodash')
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();



var debugs = []
var dbg = function(stuff) {
    if(!stuff.value || stuff.value === undefined) {
        stuff.value = 'value is undefined'
    }
    var logEntry = {}
    if(stuff.name)
        logEntry.name = stuff.name
    if(stuff.key && typeof stuff.key != "function")
        logEntry.key = stuff.key
    if(stuff.value && typeof stuff.value != "function" )
        logEntry.value = stuff.value
    debugs.push(logEntry)
    //db.ref('templog2').push().set(logEntry)
    return debugs
}

exports.dbg = dbg

exports.dbgKeys = function(descr, obj) {
    debugs = []
    exports.dbg({'name':'Keys of '+descr})
    var keys = Object.keys(obj)//.keys(obj)
    _.each(keys, function(key) {
        exports.dbg({name:'key of '+descr, key:key})
    })
    return db.ref('templog2').update(debugs)
}

exports.dbgKeyValues = function(what, obj) {
    debugs = []
    exports.dbg({name:what})
    var keys = Object.keys(obj)//.keys(obj)
    _.each(keys, function(key) {
        var value = obj[key]
        var logEntry = {}
        logEntry.name = what
        logEntry.key = key
        if(value)
            logEntry.value = value
        exports.dbg(logEntry)
    })

    return db.ref('templog2').update(debugs)
}

exports.dbgList = function(what, list) {
    debugs = []
    exports.dbg({name:what})
    _.each(list, function(obj) {

        var keys = Object.keys(obj)//.keys(obj)
        _.each(keys, function(key) {
            var value = obj[key]
            var logEntry = {}
            logEntry.name = what
            logEntry.key = key
            if(value)
                logEntry.value = value
            exports.dbg(logEntry)
        })

    })

    return db.ref('templog2').update(debugs)
}