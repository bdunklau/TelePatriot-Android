'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('./dateformat')

var style = "font-family:Arial;font-size:12px"
var tableheading = style + ';background-color:#ededed'


// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();


/***
firebase deploy --only functions:updateLegal,functions:updateUser
***/


exports.updateUser = functions.https.onRequest((req, res) => {
    var stuff = '<html><head></head><body>'
    stuff += form()
    stuff += '</body></html>'

    return res.status(200).send(stuff)
})


var form = function() {
    var stuff = '<h2>Update User</h2>'
    stuff += '<b>Update the status of the a user\'s petition signature, confidentiality agreement signature, and whether they are banned or not</b>'
    stuff += '<form method="post" action="/updateLegal">'
    stuff += '<input type="text" name="email" placeholder="Email">'
    stuff += '<P/>'
    stuff += '<P/><span style="'+style+'">'
    stuff += 'Signed Petition <br/><input type="radio" name="has_signed_petition" value="Yes"> Yes'
    stuff += '&nbsp;&nbsp;<input type="radio" name="has_signed_petition" value="No"> No'
    stuff += '&nbsp;&nbsp;<input type="radio" name="has_signed_petition" value="Unknown" checked> Unknown'
    stuff += '</span><P/>'
    stuff += '<P/><span style="'+style+'">'
    stuff += 'Signed Confidentiality Agreement <br/><input type="radio" name="has_signed_confidentiality_agreement" value="Yes"> Yes'
    stuff += '&nbsp;&nbsp;<input type="radio" name="has_signed_confidentiality_agreement" value="No"> No'
    stuff += '&nbsp;&nbsp;<input type="radio" name="has_signed_confidentiality_agreement" value="Unknown" checked> Unknown'
    stuff += '</span><P/>'
    stuff += '<P/><span style="'+style+'">'
    stuff += 'Banned <br/><input type="radio" name="is_banned" value="Yes"> Yes'
    stuff += '&nbsp;&nbsp;<input type="radio" name="is_banned" value="No"> No'
    stuff += '&nbsp;&nbsp;<input type="radio" name="is_banned" value="Unknown" checked> Unknown'
    stuff += '</span><P/>'
    stuff += '<input type="submit" value="OK" size="20"/>'
    stuff += '</form>'
    return stuff
}


// sets has_signed_confidentiality_agreement: true
exports.updateLegal = functions.https.onRequest((req, res) => {

    var email = req.body.email
    var has_signed_petition = req.body.has_signed_petition
    var has_signed_confidentiality_agreement = req.body.has_signed_confidentiality_agreement
    var is_banned = req.body.is_banned

    if(!email || !has_signed_petition || !has_signed_confidentiality_agreement || !is_banned) {
        res.status(200).send("attribute mission: email = "+email+",  has_signed_petition = "+has_signed_petition+",  has_signed_confidentiality_agreement = "+has_signed_confidentiality_agreement+',  is_banned = '+is_banned)
    }
    else {

        var pet = null
        if(has_signed_petition) {
            pet = has_signed_petition=='Yes' ? true : (has_signed_petition=='No' ? false : null)
        }

        var conf = null
        if(has_signed_confidentiality_agreement) {
            conf = has_signed_confidentiality_agreement=='Yes' ? true : (has_signed_confidentiality_agreement=='No' ? false : null)
        }

        var ban = null
        if(is_banned) {
            ban = is_banned=='Yes' ? true : (is_banned=='No' ? false : null)
        }


        //query by email
        var ref = db.ref('/users')
        return ref.orderByChild('email').equalTo(email).limitToFirst(1).once('value').then(snapshot => {
            var updates = {}
            snapshot.forEach(function(child) {
                var uid = child.key

                // when we update this attribute, we cause a trigger to be fired that also
                // updates has_signed_confidentiality_agreement in the /no_roles node IF
                // that user exists there also.  The trigger is below.
                updates[uid+'/has_signed_petition'] = pet
                updates[uid+'/has_signed_confidentiality_agreement'] = conf
                updates[uid+'/is_banned'] = ban
            })
            ref.update(updates)
        })
        .then(() => {

            return ref.orderByChild('email').equalTo(email).limitToFirst(1).once('value').then(snapshot => {
                var user = {}
                snapshot.forEach(function(child) {
                    user['uid'] = child.key
                    user['created'] = child.val().created
                    user['email'] = child.val().email
                    user['name'] = child.val().name
                    if(child.val().has_signed_petition === undefined) {
                        user['has_signed_petition'] = ''
                    } else {
                        user['has_signed_petition'] = child.val().has_signed_petition// ? child.val().has_signed_petition : ''
                    }

                    if(child.val().has_signed_confidentiality_agreement === undefined) {
                        user['has_signed_confidentiality_agreement'] = ''
                    } else {
                        user['has_signed_confidentiality_agreement'] = child.val().has_signed_confidentiality_agreement
                    }

                    if(child.val().is_banned === undefined) {
                        user['is_banned'] = ''
                    } else {
                        user['is_banned'] = child.val().is_banned
                    }

                    user['photoUrl'] = child.val().photoUrl
                })
                return user
            })

        })
        .then(user => {
            var stuff = '<html><head></head><body>'
            stuff += form()
            var keys = Object.keys(user)
            stuff += '<table border="1" cellspacing="0"><tr><th colspan="2" style="'+tableheading+'"><b>User</b></th></tr>'
            for(var i=0; i < keys.length; i++) {
                stuff += '<tr><td style="'+style+'">'+keys[i]+'</td><td style="'+style+'">'+user[keys[i]]+'</td></tr>'
            }
            stuff += '</table>'
            stuff += '</body></html>'
            return res.status(200).send(stuff)
        })

    }

})