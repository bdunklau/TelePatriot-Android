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
const sheetReader = require('./sheets/import-sheet')

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

exports.testsheetImport = sheetReader.testsheetImport
exports.readSpreadsheet = sheetReader.readSpreadsheet
exports.deleteMissionItems = sheetReader.deleteMissionItems
exports.testReadSpreadsheet = sheetReader.testReadSpreadsheet
exports.testMergeMissions = sheetReader.testMergeMissions

const missions = require('./sheets/mission-activator')
exports.missionActivation = missions.missionActivation

const missionDeleter = require('./sheets/mission-deleter')
exports.missionDeletion = missionDeleter.missionDeletion

const masterSpreadsheetReader = require('./sheets/import-master-sheet')
exports.readMasterSpreadsheet = masterSpreadsheetReader.readMasterSpreadsheet
exports.testReadMasterSpreadsheet = masterSpreadsheetReader.testReadMasterSpreadsheet

const teams = require('./teams')
exports.manageTeams = teams.manageTeams // contains links to all the other team functions
exports.createTeam = teams.createTeam
exports.deleteTeam = teams.deleteTeam
exports.addPeopleToTeam = teams.addPeopleToTeam
exports.removePeopleFromTeam = teams.removePeopleFromTeam

const dbadmin = require('./dbadmin')
exports.insert = dbadmin.insert
exports.update = dbadmin.update
exports.selectDistinct = dbadmin.selectDistinct
exports.query = dbadmin.query
exports.queryActive = dbadmin.queryActive
exports.queryInactive = dbadmin.queryInactive
exports.copy = dbadmin.copy
exports.deleteNodes = dbadmin.deleteNodes
exports.deleteAttributes = dbadmin.deleteAttributes

/***********/
exports.prepareDevDatabaseToTestMigration = dbadmin.prepareDevDatabaseToTestMigration
exports.migrateMissions = dbadmin.migrateMissions
exports.deleteMissionItems = dbadmin.deleteMissionItems
exports.copyOverMissionItems = dbadmin.copyOverMissionItems
exports.addGroupNumbers = dbadmin.addGroupNumbers
exports.backfillCavalry = teams.backfillCavalry // temp/one-time function for production
/*********/
