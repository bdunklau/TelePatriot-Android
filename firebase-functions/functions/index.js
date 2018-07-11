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
exports.approveUserAccount = createModule.approveUserAccount
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
exports.copyTeam = teams.copyTeam
exports.copyMembers = teams.copyMembers
exports.createTeam = teams.createTeam
exports.deleteMissionItem = teams.deleteMissionItem
exports.deleteTeam = teams.deleteTeam
// Not part of the /manageTeams page at the moment (12/27/17)
//exports.createTeam = teams.createTeam
// DANGEROUS - because missions and activity are under a team's node
//exports.deleteTeam = teams.deleteTeam
exports.addPeopleToTeam = teams.addPeopleToTeam
exports.downloadMissionReport = teams.downloadMissionReport
exports.removePeopleFromTeam = teams.removePeopleFromTeam
exports.viewMembers = teams.viewMembers
exports.viewMissions = teams.viewMissions
exports.viewQueue = teams.viewQueue
exports.setCurrentTeam = teams.setCurrentTeam
exports.resetCurrentTeam = teams.resetCurrentTeam
exports.updateMemberListUnderTeams = teams.updateMemberListUnderTeams
exports.updateTeamListUnderUsers = teams.updateTeamListUnderUsers
exports.viewMissionReport = teams.viewMissionReport


const dbadmin = require('./dbadmin')
exports.addAttributeToChildren = dbadmin.addAttributeToChildren
exports.archive = dbadmin.archive
exports.checkUsers = dbadmin.checkUsers
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
// To tidy things up, we could either get rid of these functions, or move them to fixstuff.js
exports.prepareDevDatabaseToTestMigration = dbadmin.prepareDevDatabaseToTestMigration
exports.migrateMissions = dbadmin.migrateMissions
exports.deleteMissionItems = dbadmin.deleteMissionItems
exports.copyOverMissionItems = dbadmin.copyOverMissionItems
/*********/


const missionStats = require('./sheets/mission-stats')
exports.percentComplete = missionStats.percentComplete

const updateUser = require('./updateUser')
exports.onUserAttributeDeleted = updateUser.onUserAttributeDeleted
exports.onUserUpdated = updateUser.onUserUpdated
exports.updateLegal = updateUser.updateLegal
exports.updateUser = updateUser.updateUser

const fixstuff = require('./fixstuff')
exports.correctPhoneCallOutcomes = fixstuff.correctPhoneCallOutcomes
exports.fixBadMissionItemRecords = fixstuff.fixBadMissionItemRecords

const userList = require('./userList')
exports.downloadUsers = userList.downloadUsers
exports.manageUsers = userList.manageUsers
exports.updateUser = userList.updateUser

const email = require('./email')
exports.email = email.email
exports.renderEmail = email.renderEmail
exports.saveEmail = email.saveEmail
exports.sendEmail = email.sendEmail
exports.chooseEmailType = email.chooseEmailType

const legislators = require('./legislators')
exports.loadStates = legislators.loadStates
exports.loadOpenStatesDistricts = legislators.loadOpenStatesDistricts
exports.loadOpenStatesLegislators = legislators.loadOpenStatesLegislators
exports.getSocialMediaUrls = legislators.getSocialMediaUrls
exports.showStates = legislators.showStates
exports.viewLegislators = legislators.viewLegislators
exports.findCivicDataMatch = legislators.findCivicDataMatch
exports.lookupFacebookId = legislators.lookupFacebookId
exports.saveDivision = legislators.saveDivision
exports.loadLegislators = legislators.loadLegislators
exports.loadCivicData = legislators.loadCivicData
exports.peopleWithoutCivicData = legislators.peopleWithoutCivicData
exports.facebookIdUpdated = legislators.facebookIdUpdated
exports.youtubeVideoDescription = legislators.youtubeVideoDescription
exports.updateLegislatorSocialMedia = legislators.updateLegislatorSocialMedia
exports.updateVideoNodeSocialMedia = legislators.updateVideoNodeSocialMedia
exports.testUpdateSocialMedia = legislators.testUpdateSocialMedia
exports.overwriteBadWithGoodData = legislators.overwriteBadWithGoodData


const civic = require('./google-civic')
exports.civic = civic.civic
exports.loadDivisions = civic.loadDivisions
exports.loadDivisionsTrigger = civic.loadDivisionsTrigger
exports.loadDivisionsAllStates = civic.loadDivisionsAllStates
exports.listDivisions = civic.listDivisions
exports.listOfficials = civic.listOfficials
exports.loadOfficials = civic.loadOfficials
exports.unloadOfficials = civic.unloadOfficials
exports.unloadDivisions = civic.unloadDivisions
exports.onOfficialUrl = civic.onOfficialUrl

const districtMapper = require('./map-districts')
exports.districtMapper = districtMapper.districtMapper
exports.mapOpenStatesToGoogleCivic = districtMapper.mapOpenStatesToGoogleCivic
exports.mapGoogleCivicToOpenStates = districtMapper.mapGoogleCivicToOpenStates
exports.checkGoogleCivicDivision = districtMapper.checkGoogleCivicDivision

const officialMapper = require('./map-officials')
exports.officialMapper = officialMapper.officialMapper
exports.osToCivicOfficials = officialMapper.osToCivicOfficials
exports.tryLoadingOfficialsAgain = officialMapper.tryLoadingOfficialsAgain


const testing = require('./test/testing')
exports.testApi = testing.testApi
exports.testPing = testing.testPing

const vidyo = require('./vidyo')
exports.generateVidyoToken = vidyo.generateVidyoToken

const videoManager = require('./video')
exports.video = videoManager.video
exports.newStorageItem = videoManager.newStorageItem
exports.uploadToYouTube4 = videoManager.uploadToYouTube4
exports.setFirebaseStorageRecord = videoManager.setFirebaseStorageRecord
exports.unsetFirebaseStorageRecord = videoManager.unsetFirebaseStorageRecord
exports.markForPublishVideo = videoManager.markForPublishVideo
exports.publishVideo = videoManager.publishVideo
exports.youtubewebhook1 = videoManager.youtubewebhook1
exports.getAdditionalYouTubeInfo = videoManager.getAdditionalYouTubeInfo

const googleCloud = require('./google-cloud')
exports.cloud = googleCloud.cloud
exports.listImages = googleCloud.listImages
exports.sendToVirtualMachines = googleCloud.sendToVirtualMachines
exports.dockers = googleCloud.dockers
exports.testStartDocker = googleCloud.testStartDocker
exports.testStopDocker = googleCloud.testStopDocker
exports.testStopAndRemoveDocker = googleCloud.testStopAndRemoveDocker
exports.testCreateAnotherDocker = googleCloud.testCreateAnotherDocker
exports.testStartRecording = googleCloud.testStartRecording
exports.testStopRecording = googleCloud.testStopRecording
exports.listRecordings = googleCloud.listRecordings
exports.removeRecording = googleCloud.removeRecording
exports.testRequestDocker = googleCloud.testRequestDocker
exports.dockerRequest = googleCloud.dockerRequest
exports.testCreateVideoNode = googleCloud.testCreateVideoNode


const googleAuth = require('./google-auth')
exports.getAuthorizedClient = googleAuth.getAuthorizedClient

const debug = require('./debug')
exports.dbg = debug.dbg
exports.dbgKeys = debug.dbgKeys
exports.dbgKeyValues = debug.dbgKeyValues


