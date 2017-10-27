const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

const onmessage = require('./onMessage')
const createModule = require('./userCreated')
const deleteModule = require('./userDeleted')
const notifications = require('./notifications')
const roles = require('./roles')
const topics = require('./topics')
const sheetsDemo = require('./sheets/demo-google-sheet-write')
const importDemo = require('./sheets/demo-import-sheet')

exports.messagestuff = onmessage.pushMessages
exports.userCreated = createModule.createUserAccount
exports.userDeleted = deleteModule.deleteUserAccount
exports.notifyUserCreated = notifications.notifyUserCreated
exports.roleAssigned = roles.roleAssigned
exports.roleUnassigned = roles.roleUnassigned
exports.topicCreated = topics.topicCreated
exports.topicDeleted = topics.topicDeleted

exports.authgoogleapi = sheetsDemo.authgoogleapi
exports.oauthcallback = sheetsDemo.oauthcallback
exports.updateSpreadsheet = sheetsDemo.updateSpreadsheet
//exports.updatespreadsheet = sheetsDemo.updatespreadsheet
exports.testsheetwrite = sheetsDemo.testsheetwrite

exports.testsheetImport = importDemo.testsheetImport
exports.readSpreadsheet = importDemo.readSpreadsheet

const missions = require('./sheets/mission-activator')
exports.missionActivation = missions.missionActivation
