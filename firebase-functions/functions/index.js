const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

const onmessage = require('./onMessage')
const deleteModule = require('./userDeleted')
const notifications = require('./notifications')
const topics = require('./topics')

exports.messagestuff = onmessage.pushMessages
exports.userDeleted = deleteModule.deleteUserAccount
exports.notifyUserCreated = notifications.notifyUserCreated
exports.topicCreated = topics.topicCreated
exports.topicDeleted = topics.topicDeleted

const roles = require('./roles')
exports.roleAssigned = roles.roleAssigned
exports.roleUnassigned = roles.roleUnassigned

const sheetsDemo = require('./sheets/demo-google-sheet-write')
exports.updateSpreadsheet = sheetsDemo.updateSpreadsheet
//exports.updatespreadsheet = sheetsDemo.updatespreadsheet
exports.testsheetwrite = sheetsDemo.testsheetwrite

// dev deploy: 11/3/18
// prod deploy: 11/3/18
const sheetReader = require('./sheets/import-sheet')
exports.testsheetImport = sheetReader.testsheetImport
exports.readSpreadsheet = sheetReader.readSpreadsheet
exports.deleteMissionItems = sheetReader.deleteMissionItems
exports.testReadSpreadsheet = sheetReader.testReadSpreadsheet
exports.testMergeMissions = sheetReader.testMergeMissions
exports.oauthcallback = sheetReader.oauthcallback
exports.authgoogleapi = sheetReader.authgoogleapi

// dev deploy: 12/8/18
const createModule = require('./userCreated')
exports.approveUserAccount = createModule.approveUserAccount
exports.userCreated = createModule.userCreated
exports.onEmailEstablished = createModule.onEmailEstablished
exports.onCitizenBuilderId = createModule.onCitizenBuilderId
exports.onPetition = createModule.onPetition
exports.onConfidentialityAgreement = createModule.onConfidentialityAgreement
exports.onBanned = createModule.onBanned


const missions = require('./sheets/mission-activator')
exports.missionActivation = missions.missionActivation

const missionDeleter = require('./sheets/mission-deleter')
exports.missionDeletion = missionDeleter.missionDeletion

const masterSpreadsheetReader = require('./sheets/import-master-sheet')
exports.readMasterSpreadsheet = masterSpreadsheetReader.readMasterSpreadsheet
exports.testReadMasterSpreadsheet = masterSpreadsheetReader.testReadMasterSpreadsheet

// dev deploy:  11/18/18, 12/10/18
// prod deploy: 11/19/18
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
exports.cullTrainingTeam = teams.cullTrainingTeam
exports.removeFromTrainingTeam = teams.removeFromTrainingTeam
exports.teamlist = teams.teamlist
exports.addToTeamList = teams.addToTeamList
exports.removeTeamFromList = teams.removeTeamFromList


// prod deploy: 9/12/18, 9/20/18
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

// dev deploy: 11/8/18, 12/1/18
// prod deploy: 11/8/18, 12/1/18
const userList = require('./userList')
exports.downloadUsers = userList.downloadUsers
exports.manageUsers = userList.manageUsers
exports.updateUser = userList.updateUser

// prod deploy: 9/12/18, 9/20/18
const email = require('./email')
exports.testEmail = email.testEmail
exports.testEmail2 = email.testEmail2
exports.renderEmail = email.renderEmail
exports.renderEmail2 = email.renderEmail2
exports.saveEmail = email.saveEmail
exports.saveEmail2 = email.saveEmail2
exports.testSendEmail = email.testSendEmail
exports.testSendEmail2 = email.testSendEmail2
exports.chooseEmailType = email.chooseEmailType
exports.chooseEmailType2 = email.chooseEmailType2
exports.onReadyToSendEmails = email.onReadyToSendEmails
exports.testOnReadyToSendEmails = email.testOnReadyToSendEmails


// prod deploy: 9/12/18, 9/20/18
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


// prod deploy: 9/12/18, 9/20/18
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

// prod deploy: 9/12/18, 9/20/18
const districtMapper = require('./map-districts')
exports.districtMapper = districtMapper.districtMapper
exports.mapOpenStatesToGoogleCivic = districtMapper.mapOpenStatesToGoogleCivic
exports.mapGoogleCivicToOpenStates = districtMapper.mapGoogleCivicToOpenStates
exports.checkGoogleCivicDivision = districtMapper.checkGoogleCivicDivision

// prod deploy: 9/12/18, 9/20/18
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

// prod deploy: 99/20/18
const youtube_playlists = require('./youtube-playlists')
exports.youtube_playlists = youtube_playlists.youtube_playlists
exports.testSavePlaylist = youtube_playlists.testSavePlaylist
exports.testDeletePlaylist = youtube_playlists.testDeletePlaylist
exports.testEditPlaylist = youtube_playlists.testEditPlaylist
exports.handlePlaylistRequest = youtube_playlists.handlePlaylistRequest

// prod deploy: 9/12/18, 9/20/18
const youtube_subscribe = require('./youtube-subscribe')
exports.video_processing_callback = youtube_subscribe.video_processing_callback
exports.video_processing_complete = youtube_subscribe.video_processing_complete


// prod deploy: 9/12/18, 9/20/18
const twitter = require('./twitter')
exports.twitter = twitter.twitter
exports.testTweet = twitter.testTweet
exports.callback_from_twitter = twitter.callback_from_twitter
exports.handleTweetRequest = twitter.handleTweetRequest
exports.onTwitterPostId = twitter.onTwitterPostId
//exports.deleteTweet = twitter.deleteTweet  // not supported, don't think

// prod deploy: 9/12/18, 9/20/18
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

// prod deploy: 9/12/18, 9/20/18
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


// prod deploy: 9/20/18
const googleAuth = require('./google-auth')
exports.getAuthorizedClient = googleAuth.getAuthorizedClient

const debug = require('./debug')
exports.dbg = debug.dbg
exports.dbgKeys = debug.dbgKeys
exports.dbgKeyValues = debug.dbgKeyValues

// prod deploy: 9/12/18, 9/20/18
const videoTypes = require('./video-types')
exports.listVideoTypes = videoTypes.listVideoTypes
exports.testSaveVideoType = videoTypes.testSaveVideoType
exports.testSendLegislatorEmail = videoTypes.testSendLegislatorEmail
exports.testPreviewLegislatorEmail = videoTypes.testPreviewLegislatorEmail

// prod deploy: 9/12/18, 9/20/18, 10/29/18
const switchboard = require('./switchboard')
exports.onConnectRequest = switchboard.onConnectRequest
exports.onDisconnectRequest = switchboard.onDisconnectRequest
exports.testViewVideoEvents = switchboard.testViewVideoEvents
exports.onTwilioEvent = switchboard.onTwilioEvent
exports.onStartRecordingRequest = switchboard.onStartRecordingRequest
exports.onStopRecordingRequest = switchboard.onStopRecordingRequest
exports.onRoomCreated = switchboard.onRoomCreated
exports.onRevokeInvitation = switchboard.onRevokeInvitation
exports.onRoomIdChange = switchboard.onRoomIdChange
exports.onTokenRequested = switchboard.onTokenRequested
exports.onPublishRequested = switchboard.onPublishRequested


// prod deploy: 9/12/18, 9/20/18
const twilio = require('./twilio-telepatriot')
exports.testTwilioToken = twilio.testTwilioToken
exports.twilioCallback = twilio.twilioCallback
exports.testCreateRoom = twilio.testCreateRoom
exports.testListRooms = twilio.testListRooms
exports.testRetrieveRoom = twilio.testRetrieveRoom
exports.testCompleteRoom = twilio.testCompleteRoom
exports.testListParticipants = twilio.testListParticipants
exports.testCompose = twilio.testCompose

// prod deploy: 9/12/18, 9/20/18
const videoList = require('./video-list')
exports.videoListMain = videoList.videoListMain
exports.testSelectVideoNode = videoList.testSelectVideoNode
exports.testSaveEmailTemplates = videoList.testSaveEmailTemplates
exports.testReevaluateEmailAttributes = videoList.testReevaluateEmailAttributes

// dev deploy: 10/31/18, 11/3/18, 11/4/18, 11/16/18, 11/17/18
// prod deploy: 9/12/18, 9/20/18
const checkVolunteerStatus = require('./citizen_builder_api/checkVolunteerStatus')
exports.checkLegal = checkVolunteerStatus.checkLegal
exports.timestampCbApiEvent = checkVolunteerStatus.timestampCbApiEvent
exports.onResponseFromLegal = checkVolunteerStatus.onResponseFromLegal
exports.timestampLegalResponses = checkVolunteerStatus.timestampLegalResponses
exports.timestampLoginResponses = checkVolunteerStatus.timestampLoginResponses

// dev deploy: 12/8/18
const volunteers = require('./citizen_builder_api/volunteers')
exports.testVolunteers = volunteers.testVolunteers
exports.onLogin = volunteers.onLogin

// dev deploy: 11/3/18
const person_teams = require('./citizen_builder_api/teams-person_teams')
exports.testPersonTeams = person_teams.testPersonTeams

// dev deploy: 11/3/18
const cb_missions = require('./citizen_builder_api/missions')
exports.testTeamMissions = cb_missions.testTeamMissions
exports.createMission = cb_missions.createMission


// prod deploy: 9/12/18, 9/20/18
const videoOffers = require('./video-offers')
exports.onVideoOffer = videoOffers.onVideoOffer

// prod deploy: 9/12/18, 9/20/18
const geocode = require('./geocode')
exports.geocodeMain = geocode.geocodeMain
exports.testLookupLatLong = geocode.testLookupLatLong
exports.testLookupDistrict = geocode.testLookupDistrict

// dev deploy: 11/21/18
// prod deploy: 11/21/18
const simulate = require('./simulate')
exports.testViewSimulatorParameters = simulate.testViewSimulatorParameters

// dev deploy:  11/4/18
const cb_api_events = require('./citizen_builder_api/cb_api_events')
exports.testViewCBAPIEvents = cb_api_events.testViewCBAPIEvents


// dev deploy: 11/17/18
const role_api = require('./telepatriot_api/role_api')
exports.testRoleApiForm = role_api.testRoleApiForm
exports.testRoleApi = role_api.testRoleApi
exports.api_add_role = role_api.api_add_role
exports.api_remove_role = role_api.api_remove_role

