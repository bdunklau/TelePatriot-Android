// moment-timezone dependency is declared in firebase-functions/functions/package.json
const moment = require('moment-timezone');

exports.asCentralTime = function() {
    // case MATTERS in the format string below !
    var now = moment().tz('America/Chicago').format('MMM D, YYYY h:mm a z')
    console.log("now: ", now)
    return now
}

exports.as_yyyyMMdd = function() {
    // case MATTERS in the format string below !
    var now = moment().tz('America/Chicago').format('YYYYMMDD')
    return now
}

exports.asMillis = function() {
    return moment().valueOf()
}