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

// dev deploy: 3/29/19,
// prod deploy: 3/29/19
const createModule = require('./userCreated')
exports.userCreated = createModule.userCreated
exports.onCitizenBuilderId = createModule.onCitizenBuilderId


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


// dev deploy: 1/2/19
// prod deploy: 1/3/19
const updateUser = require('./updateUser')
//exports.onUserUpdated = updateUser.onUserUpdated
exports.updateLegal = updateUser.updateLegal
exports.updateUser = updateUser.updateUser

// dev deploy: 11/8/18, 12/1/18
// prod deploy: 11/8/18, 12/1/18
const userList = require('./userList')
exports.downloadUsers = userList.downloadUsers
exports.manageUsers = userList.manageUsers
exports.updateUser = userList.updateUser
exports.temp_not_pop = userList.temp_not_pop
exports.temp_not_pop2 = userList.temp_not_pop2
exports.temp_call_volunteers = userList.temp_call_volunteers

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

const amiready = require('./user-amiready')
exports.amiready = amiready.amiready

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


// prod deploy: 12/12/18
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
// prod deploy: 12/12/18
const videoList = require('./video-list')
exports.videoListMain = videoList.videoListMain
exports.testSelectVideoNode = videoList.testSelectVideoNode
exports.testSaveEmailTemplates = videoList.testSaveEmailTemplates
exports.testReevaluateEmailAttributes = videoList.testReevaluateEmailAttributes

// dev deploy: 1/16/19
// prod deploy: 1/16/19
const checkVolunteerStatus = require('./citizen_builder_api/checkVolunteerStatus')
exports.checkLegal = checkVolunteerStatus.checkLegal
exports.timestampCbApiEvent = checkVolunteerStatus.timestampCbApiEvent
exports.onResponseFromLegal = checkVolunteerStatus.onResponseFromLegal
exports.timestampLegalResponses = checkVolunteerStatus.timestampLegalResponses
exports.timestampLoginResponses = checkVolunteerStatus.timestampLoginResponses

// dev deploy: 1/16/19
// prod deploy: 1/16/19
const volunteers = require('./citizen_builder_api/volunteers')
exports.testVolunteers = volunteers.testVolunteers
exports.onLogin = volunteers.onLogin

// dev deploy: 11/3/18
// prod deploy: 12/12/18
const person_teams = require('./citizen_builder_api/teams-person_teams')
exports.testPersonTeams = person_teams.testPersonTeams

// dev deploy: 11/3/18
// prod deploy: 12/12/18
const cb_missions = require('./citizen_builder_api/missions')
exports.testTeamMissions = cb_missions.testTeamMissions
exports.createMission = cb_missions.createMission


// prod deploy: 9/12/18, 9/20/18
// prod deploy: 12/12/18
const videoOffers = require('./video-offers')
exports.onVideoOffer = videoOffers.onVideoOffer

// prod deploy: 9/12/18, 9/20/18
// prod deploy: 12/12/18
const geocode = require('./geocode')
exports.geocodeMain = geocode.geocodeMain
exports.testLookupLatLong = geocode.testLookupLatLong
exports.testLookupDistrict = geocode.testLookupDistrict

// dev deploy: 12/22/18
// prod deploy: 12/22/18
const configure = require('./configure')
exports.testConfiguration = configure.testConfiguration

// dev deploy:  11/4/18
// prod deploy: 12/12/18
const cb_api_events = require('./citizen_builder_api/cb_api_events')
exports.testViewCBAPIEvents = cb_api_events.testViewCBAPIEvents


// dev deploy: 12/11/18
// prod deploy: 12/12/18
const role_api = require('./telepatriot_api/role_api')
exports.testRoleApiForm = role_api.testRoleApiForm
exports.testRoleApi = role_api.testRoleApi
exports.api_add_role = role_api.api_add_role
exports.api_remove_role = role_api.api_remove_role


// dev deploy: 12/11/18
// prod deploy: 12/12/18
const account_api = require('./telepatriot_api/account_api')
exports.testAccountDisposition = account_api.testAccountDisposition
exports.api_account_disposition = account_api.api_account_disposition


// dev deploy: 3/8/19
// prod deploy: 3/8/19
const applog = require('./log')
exports.testLog = applog.testLog
exports.logByUser = applog.logByUser
exports.propTaxRally = applog.propTaxRally

const downloadApk = require('./download-apk')
exports.downloadApk = downloadApk.downloadApk

// dev deploy:  3/20/19
// prod deploy: 3/21/19
const call_notes = require('./call_notes')
exports.onCallNotesCreated = call_notes.onCallNotesCreated


// MIGHT KEEP SOME OF THIS...
const googleCloud = require('./google-cloud')
exports.recording_has_started = googleCloud.recording_has_started
exports.whenVideoIdIsCreated = googleCloud.whenVideoIdIsCreated
exports.socialMediaPostsCreated = googleCloud.socialMediaPostsCreated
exports.onLegislatorChosen = googleCloud.onLegislatorChosen
exports.onParticipantAdded = googleCloud.onParticipantAdded
exports.onParticipantRemoved = googleCloud.onParticipantRemoved
//exports.cloud = googleCloud.cloud                                       X   X
//exports.listImages = googleCloud.listImages                             X   X
//exports.sendToVirtualMachines = googleCloud.sendToVirtualMachines       X   X
//exports.dockers = googleCloud.dockers                                   X   X
//exports.testStartDocker = googleCloud.testStartDocker                   X   X
//exports.testStopDocker = googleCloud.testStopDocker                     X   X
//exports.testStopAndRemoveDocker = googleCloud.testStopAndRemoveDocker   X   X
//exports.testCreateAnotherDocker = googleCloud.testCreateAnotherDocker   X   X
//exports.testStartRecording = googleCloud.testStartRecording             X   X
//exports.testStartRecording2 = googleCloud.testStartRecording2           X   X
//exports.testStopRecording = googleCloud.testStopRecording               X   X
//exports.testStopRecording2 = googleCloud.testStopRecording2             X   X
//exports.testPublish = googleCloud.testPublish                           X   X
//exports.listRecordings = googleCloud.listRecordings                     X   X
//exports.removeRecording = googleCloud.removeRecording                   X   X
//exports.dockerRequest = googleCloud.dockerRequest                       X   X
//exports.testCreateVideoNode = googleCloud.testCreateVideoNode           X   X
//exports.setRoom_id = googleCloud.setRoom_id                             X   X
//exports.monitor_video_processing = googleCloud.monitor_video_proces     X   X
//exports.video_title = googleCloud.video_title                           X   X
//exports.youtubeVideoDescription = googleCloud.youtubeVideoDescription   X   X



// PRUNING ALL THIS STUFF...
// DELETE FROM TelePatriot-Dev first then TelePatriot
//
//const sheetsDemo = require('./sheets/demo-google-sheet-write')
//exports.updateSpreadsheet = sheetsDemo.updateSpreadsheet          X       X
//exports.testsheetwrite = sheetsDemo.testsheetwrite                X       X
//
//
//const sheetReader = require('./sheets/import-sheet')
//exports.testsheetImport = sheetReader.testsheetImport               X       X
//exports.readSpreadsheet = sheetReader.readSpreadsheet               X       X
//exports.deleteMissionItems = sheetReader.deleteMissionItems         X       X
//exports.testReadSpreadsheet = sheetReader.testReadSpreadsheet       X       X
//exports.testMergeMissions = sheetReader.testMergeMissions           X       X
//exports.oauthcallback = sheetReader.oauthcallback                   X       X
//exports.authgoogleapi = sheetReader.authgoogleapi                   X       X
//
//
//const masterSpreadsheetReader = require('./sheets/import-master-sheet')
//exports.readMasterSpreadsheet = masterSpreadsheetReader.readMasterSpreadsheet           X   X
//exports.testReadMasterSpreadsheet = masterSpreadsheetReader.testReadMasterSpreadsheet   X   X
//
//
//const missions = require('./sheets/mission-activator')
//exports.missionActivation = missions.missionActivation          X   X
//
//const missionDeleter = require('./sheets/mission-deleter')
//exports.missionDeletion = missionDeleter.missionDeletion        X   X
//
//const missionStats = require('./sheets/mission-stats')
//exports.percentComplete = missionStats.percentComplete          X   X
//
//const roles = require('./roles')
//exports.roleAssigned = roles.roleAssigned                       X   X
//exports.roleUnassigned = roles.roleUnassigned                   X   X
//
//
//const teams = require('./teams')
//exports.manageTeams = teams.manageTeams                 X   X
//exports.copyTeam = teams.copyTeam                       X   X
//exports.copyMembers = teams.copyMembers                 X   X
//exports.createTeam = teams.createTeam                   X   X
//exports.deleteMissionItem = teams.deleteMissionItem     X   X
//exports.deleteTeam = teams.deleteTeam                   X   X
//exports.addPeopleToTeam = teams.addPeopleToTeam         X   X
//exports.addToTeamList = teams.addToTeamList             X   X
//exports.cullTrainingTeam = teams.cullTrainingTeam       X   X
//exports.downloadMissionReport = teams.downloadMiss      X   X
//exports.downloadTeamRoster = teams.downloadTeamRoster   X   X
//exports.removeFromTrainingTeam = teams.removeFromT      X   X
//exports.removePeopleFromTeam = teams.removePeopleF      X   X
//exports.removeTeamFromList = teams.removeTeamFromList   X   X
//exports.resetCurrentTeam = teams.resetCurrentTeam       X   X
//exports.setCurrentTeam = teams.setCurrentTeam           X   X
//exports.teamlist = teams.teamlist                       X   X
//exports.updateMemberListUnderTeams = teams.update       X   X
//exports.updateTeamListUnderUsers = teams.updateTe       X   X
//exports.viewMembers = teams.viewMembers                 X   X
//exports.viewMissions = teams.viewMissions               X   X
//exports.viewQueue = teams.viewQueue                     X   X
//exports.viewMissionReport = teams.viewMissionReport     X   X
//
//
//const videoManager = require('./video')
//exports.video = videoManager.video                                              X   X
//exports.newStorageItem = videoManager.newStorageItem                            X   X
//exports.uploadToYouTube4 = videoManager.uploadToYouTube4                        X   X
//exports.setFirebaseStorageRecord = videoManager.setFirebaseStorageRecord        X   X
//exports.unsetFirebaseStorageRecord = videoManager.unsetFirebaseStorageRecord    X   X
//exports.markForPublishVideo = videoManager.markForPublishVideo                  X   X
//exports.publishVideo = videoManager.publishVideo                                X   X
//
//
//const vidyo = require('./vidyo')
//exports.generateVidyoToken = vidyo.generateVidyoToken       X   X
//exports.askForVidyoToken = vidyo.askForVidyoToken           X   X
//
//
//const youtube_playlists = require('./youtube-playlists')
//exports.youtube_playlists = youtube_playlists.youtube_playlists         X   X
//exports.testSavePlaylist = youtube_playlists.testSavePlaylist           X   X
//exports.testDeletePlaylist = youtube_playlists.testDeletePlaylist       X   X
//exports.testEditPlaylist = youtube_playlists.testEditPlaylist           X   X
//exports.handlePlaylistRequest = youtube_playlists.handlePlaylistRequest X   X
//
//
//const fixstuff = require('./fixstuff')
//exports.correctPhoneCallOutcomes = fixstuff.correctPhoneCallOutcomes    X   X
//exports.fixBadMissionItemRecords = fixstuff.fixBadMissionItemRecords    X   X