
exports.format = function(dateUTC) {
    var millisUTC = dateUTC.getTime()
    var timezoneOffset = dateUTC.getTimezoneOffset()
    var millisLocal = millisUTC - timezoneOffset * 60 * 1000
    var date = new Date(millisLocal) // kind of a hack
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()
    var ampm = "AM"
    var hours = date.getHours();
    if(hours > 12) {
        hours = hours % 12
        ampm = "PM"
    }
    var minutes = date.getMinutes()
    var finalString = month+"/"+day+"/"+year+" "+hours+":"+minutes+" "+ampm;
    console.log("dateformat.js:  finalString ", finalString)
    return finalString
}