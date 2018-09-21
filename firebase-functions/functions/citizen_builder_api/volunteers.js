'use strict';

const admin = require('firebase-admin')
const functions = require('firebase-functions')
const date = require('../dateformat')

// for calling CitizenBuilder API
var request = require('request')

// create reference to root of the database
const db = admin.database()


/***
paste this on the command line...
firebase deploy --only functions:checkLegal,functions:timestampCbApiEvent,functions:onResponseFromLegal
***/

//CREATED TO TEST AND SUPPORT THE /volunteers ENDPOINT