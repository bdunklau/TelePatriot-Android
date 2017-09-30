const functions = require('firebase-functions')
const onmessage = require('./onMessage')
const createModule = require('./userCreated')

exports.messagestuff = onmessage.pushMessages
exports.userCreated = functions.auth.user().onCreate(createModule.createUserAccount)