const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

const onmessage = require('./onMessage')
const deleteModule = require('./userDeleted')
const notifications = require('./notifications')
const roles = require('./roles')
const topics = require('./topics')
const sheetsDemo = require('./sheets/demo-google-sheet-write')
const sheetReader = require('./sheets/import-sheet')

exports.messagestuff = onmessage.pushMessages
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

const createModule = require('./userCreated')
// TODO fix index.js  This function should not be exported as userCreated.
// TODO keep the names in index.js identical to what they are here
exports.approveUserAccount = createModule.approveUserAccount
exports.userCreated = createModule.createUserAccount

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
exports.email2 = email.email2
exports.renderEmail = email.renderEmail
exports.renderEmail2 = email.renderEmail2
exports.saveEmail = email.saveEmail
exports.saveEmail2 = email.saveEmail2
exports.sendEmail = email.sendEmail
exports.sendEmail2 = email.sendEmail2
exports.chooseEmailType = email.chooseEmailType
exports.chooseEmailType2 = email.chooseEmailType2
exports.onReadyToSendEmails = email.onReadyToSendEmails
exports.testOnReadyToSendEmails = email.testOnReadyToSendEmails


const legislators = require('./legislators')
exports.downloadFromOpenStates = legislators.downloadFromOpenStates
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

const vidyo = require('./vidyo')
exports.generateVidyoToken = vidyo.generateVidyoToken
exports.askForVidyoToken = vidyo.askForVidyoToken

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
exports.video_processing_complete = youtube_subscribe.video_processing_complete


const twitter = require('./twitter')
exports.twitter = twitter.twitter
exports.testTweet = twitter.testTweet
exports.callback_from_twitter = twitter.callback_from_twitter
exports.handleTweetRequest = twitter.handleTweetRequest
exports.onTwitterPostId = twitter.onTwitterPostId
//exports.deleteTweet = twitter.deleteTweet  // not supported, don't think

const facebook = require('./facebook')
exports.facebook = facebook.facebook
exports.testPostFacebook = facebook.testPostFacebook
exports.handleFacebookRequest = facebook.handleFacebookRequest
exports.triggerComment = facebook.triggerComment
exports.onFacebookPostId = facebook.onFacebookPostId

const videoManager = require('./video')
exports.video = videoManager.video
//exports.newStorageItem = videoManager.newStorageItem
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
exports.testStartRecording2 = googleCloud.testStartRecording2
exports.testStopRecording = googleCloud.testStopRecording
exports.testStopRecording2 = googleCloud.testStopRecording2
exports.testPublish = googleCloud.testPublish
exports.listRecordings = googleCloud.listRecordings
exports.removeRecording = googleCloud.removeRecording
exports.dockerRequest = googleCloud.dockerRequest
exports.testCreateVideoNode = googleCloud.testCreateVideoNode
exports.setRoom_id = googleCloud.setRoom_id
exports.recording_has_started = googleCloud.recording_has_started
exports.monitor_video_processing = googleCloud.monitor_video_processing
exports.whenVideoIdIsCreated = googleCloud.whenVideoIdIsCreated
exports.video_title = googleCloud.video_title
exports.youtubeVideoDescription = googleCloud.youtubeVideoDescription
exports.socialMediaPostsCreated = googleCloud.socialMediaPostsCreated
exports.onLegislatorChosen = googleCloud.onLegislatorChosen
exports.onParticipantAdded = googleCloud.onParticipantAdded
exports.onParticipantRemoved = googleCloud.onParticipantRemoved


const googleAuth = require('./google-auth')
exports.getAuthorizedClient = googleAuth.getAuthorizedClient

const debug = require('./debug')
exports.dbg = debug.dbg
exports.dbgKeys = debug.dbgKeys
exports.dbgKeyValues = debug.dbgKeyValues

const videoTypes = require('./video-types')
exports.listVideoTypes = videoTypes.listVideoTypes
exports.testSaveVideoType = videoTypes.testSaveVideoType
exports.testSendLegislatorEmail = videoTypes.testSendLegislatorEmail
exports.testPreviewLegislatorEmail = videoTypes.testPreviewLegislatorEmail

const switchboard = require('./switchboard')
exports.onConnectRequest = switchboard.onConnectRequest
exports.onDisconnectRequest = switchboard.onDisconnectRequest
exports.testViewVideoEvents = switchboard.testViewVideoEvents
exports.onTwilioEvent = switchboard.onTwilioEvent
exports.onStartRecordingRequest = switchboard.onStartRecordingRequest
exports.onStopRecordingRequest = switchboard.onStopRecordingRequest
exports.onParticipantDisconnected = switchboard.onParticipantDisconnected
exports.onRoomCreated = switchboard.onRoomCreated
exports.onRevokeInvitation = switchboard.onRevokeInvitation
exports.onRoomIdChange = switchboard.onRoomIdChange
exports.onTokenRequested = switchboard.onTokenRequested
exports.onPublishRequested = switchboard.onPublishRequested


const twilio = require('./twilio-telepatriot')
exports.testTwilioToken = twilio.testTwilioToken
exports.twilioCallback = twilio.twilioCallback
exports.testCreateRoom = twilio.testCreateRoom
exports.testListRooms = twilio.testListRooms
exports.testRetrieveRoom = twilio.testRetrieveRoom
exports.testCompleteRoom = twilio.testCompleteRoom
exports.testListParticipants = twilio.testListParticipants
exports.testCompose = twilio.testCompose

const videoList = require('./video-list')
exports.videoListMain = videoList.videoListMain
exports.testSelectVideoNode = videoList.testSelectVideoNode
exports.testSaveEmailTemplates = videoList.testSaveEmailTemplates
exports.testReevaluateEmailAttributes = videoList.testReevaluateEmailAttributes

const checkVolunteerStatus = require('./citizen_builder_api/checkVolunteerStatus')
exports.checkLegal = checkVolunteerStatus.checkLegal
exports.timestampCbApiEvent = checkVolunteerStatus.timestampCbApiEvent
exports.onResponseFromLegal = checkVolunteerStatus.onResponseFromLegal

const videoOffers = require('./video-offers')
exports.onVideoOffer = videoOffers.onVideoOffer

const geocode = require('./geocode')
exports.geocodeMain = geocode.geocodeMain
exports.testLookupLatLong = geocode.testLookupLatLong
exports.testLookupDistrict = geocode.testLookupDistrict

