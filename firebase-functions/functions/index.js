const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)

const onmessage = require('./onMessage')
const createModule = require('./userCreated')
const notifications = require('./notifications')
const roles = require('./roles')
const topics = require('./topics')

exports.messagestuff = onmessage.pushMessages
exports.userCreated = functions.auth.user().onCreate(createModule.createUserAccount)
exports.notifyUserCreated = notifications.notifyUserCreated
exports.roleAssigned = roles.roleAssigned
exports.roleUnassigned = roles.roleUnassigned
exports.topicCreated = topics.topicCreated