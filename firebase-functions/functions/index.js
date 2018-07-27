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

exports.updateSpreadsheet = sheetsDemo.updateSpreadsheet
//exports.updatespreadsheet = sheetsDemo.updatespreadsheet
exports.testsheetwrite = sheetsDemo.testsheetwrite

exports.testsheetImport = sheetReader.testsheetImport
exports.readSpreadsheet = sheetReader.readSpreadsheet
exports.deleteMissionItems = sheetReader.deleteMissionItems
exports.testReadSpreadsheet = sheetReader.testReadSpreadsheet
exports.testMergeMissions = sheetReader.testMergeMissions
exports.oauthcallback = sheetReader.oauthcallback
exports.authgoogleapi = sheetReader.authgoogleapi

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
exports.downloadTeamRoster = teams.downloadTeamRoster
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
exports.downloadFromOpenStates = legislators.downloadFromOpenStates
exports.loadStates = legislators.loadStates

const testing = require('./test/testing')
exports.testApi = testing.testApi

const vidyo = require('./vidyo')
exports.generateVidyoToken = vidyo.generateVidyoToken

const amiready = require('./user-amiready')
exports.amiready = amiready.amiready

const youtube_playlists = require('./youtube-playlists')
exports.youtube_playlists = youtube_playlists.youtube_playlists
exports.testSavePlaylist = youtube_playlists.testSavePlaylist
exports.testDeletePlaylist = youtube_playlists.testDeletePlaylist
exports.testEditPlaylist = youtube_playlists.testEditPlaylist
exports.handlePlaylistRequest = youtube_playlists.handlePlaylistRequest

const youtube_subscribe = require('./youtube-subscribe')
exports.video_processing_callback = youtube_subscribe.video_processing_callback

const twitter = require('./twitter')
exports.twitter = twitter.twitter
exports.testTweet = twitter.testTweet
exports.callback_from_twitter = twitter.callback_from_twitter
exports.handleTweetRequest = twitter.handleTweetRequest
//exports.deleteTweet = twitter.deleteTweet  // not supported, don't think

const facebook = require('./facebook')
exports.facebook = facebook.facebook
exports.testPostFacebook = facebook.testPostFacebook
exports.handleFacebookRequest = facebook.handleFacebookRequest
exports.triggerComment = facebook.triggerComment
