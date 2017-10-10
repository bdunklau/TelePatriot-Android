const moment = require('moment-timezone');

exports.asCentralTime = function() {
    // case MATTERS in the format string below !
    var now = moment().tz('America/Chicago').format('MMM D, YYYY h:mm a z')
    console.log("now: ", now)
    return now
}