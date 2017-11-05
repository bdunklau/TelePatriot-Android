
// example:   https://docs.google.com/spreadsheets/d/178GnEv36vJ_2Odke_JvRHwNI3nS48bfV23jWak4F1Dc/edit#gid=0
// sheet id:  178GnEv36vJ_2Odke_JvRHwNI3nS48bfV23jWak4F1Dc
//
// Call this function from another file like this:
// var something = require('./get-sheet-id')  // assuming the calling script is in the same dir
// something.sheetId('https://docs.google.com/spreadsheets/d/178GnEv36vJ_2Odke_JvRHwNI3nS48bfV23jWak4F1Dc/edit#gid=0')
//
exports.sheetId = ( url => {
    //var url = "https://docs.google.com/spreadsheets/d/178GnEv36vJ_2Odke_JvRHwNI3nS48bfV23jWak4F1Dc/edit#gid=0"
    //var expId = "178GnEv36vJ_2Odke_JvRHwNI3nS48bfV23jWak4F1Dc"

    var begin = "/d/"
    var end = "/edit"
    var i1 = url.indexOf("/d/")+3
    var i2 = url.indexOf("/edit")
    if(i2 == -1) {
        // on iPhone, the url will not contain "/edit"
        return url.substring(i1)
    }
    else {
        return url.substring(i1, i2)
    }
})
