'use strict';

/********************************************
This is where we put adhoc scripts that we need to fix something in the database.
Maybe there was a design change that requires us to go do some cleanup in the database.
Whatever it is, it will be in this script.

So these scripts aren't meant to be used more than once or twice
********************************************/

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


// created 1/17/18 to correct the 'outcome' values that iPhone users have been using
// The list of outcomes that an iPhone user could choose from were slightly different than
// the list that Android users could choose from.  So I standardized around the Android list.
// This function "corrects" all the outcome values chosen by iPhone users
exports.correctPhoneCallOutcomes = functions.https.onRequest((req, res) => {

    var ref = db.ref(`/teams`)
    return ref.once('value').then(snapshot => {
        var items = []
        //var updates = {}
        snapshot.forEach(function(child) {
            // loop through each team
            // /teams/{team_name}/missions/{mission_id}/mission_items/{mission_item_id}/outcome
            var team_name = child.key
            var team = child.val() // i.e. all the nodes under  /teams/AAA Test database

            var keys = Object.keys(team)
            if(keys) {
                for(var j=0; j < keys.length; j++) {
                     var json = JSON.stringify(keys[j])
                     if(keys[j] == "missions") {
                        var mm = JSON.stringify(team[keys[j]])
                        var missionIds = Object.keys(team[keys[j]])
                        if(missionIds) {
                            for(var k=0; k < missionIds.length; k++) {
                                var missionId = missionIds[k]
                                var mission = team[keys[j]][missionIds[k]]
                                var mission_items = team["missions"][missionId]["mission_items"]
                                if(mission_items) {

                                    var mission_item_ids = Object.keys(mission_items)
                                    for(var mi=0; mi < mission_item_ids.length; mi++) {
                                        var mission_item_id = mission_item_ids[mi]
                                        var mission_item = team["missions"][missionId]["mission_items"][mission_item_id]

                                        var needsCorrecting = false
                                        var outcome = ''
                                        if(mission_item.outcome == "voice mail") {
                                            outcome = "Voicemail"
                                            needsCorrecting = true
                                        }

                                        else if(mission_item.outcome == "spoke on the phone") {
                                            outcome = "Talked on the phone"
                                            needsCorrecting = true
                                        }

                                        else if(mission_item.outcome == "number disconnected") {
                                            outcome = "Number disconnected"
                                            needsCorrecting = true
                                        }

                                        else if(mission_item.outcome == "wrong number") {
                                            outcome = "Wrong number"
                                            needsCorrecting = true
                                        }

                                        if(needsCorrecting) {
                                            var path = 'teams/'+team_name+'/missions/'+missionId+'/missions_items/'+mission_item_id+'/outcome'
                                            var was = path+' = '+mission_item.outcome
                                            var is = path+' = '+outcome

                                            items.push({team_name: team_name, state:'changed this', attribute: was })
                                            items.push({team_name: team_name, state:'to this', attribute: is })

                                            //updates[path] = outcome
                                            ref.child(team_name+'/missions/'+missionId+'/mission_items/'+mission_item_id+'/outcome').set(outcome)
                                        }

                                    }

                                }


                            }
                        }
                     }
                }
            }


        }) // snapshot.forEach(function(child)

        //db.ref('/').root.update(updates)

        return items
    })
    .then(items => {
        var stuff = ''
        stuff += '<html><head></head><body>'
        stuff += '<h2>Correcting these "Outcome" values...</h2>'
        stuff += '<P/>If this table is empty, then all is well'
        stuff += '<table border="1" cellspacing="0">'
        stuff += '<tr><th style="'+tableheading+'">Team</th><th style="'+tableheading+'">state</th><th style="'+tableheading+'">Attribute</th></tr>'
        for(var i=0; i < items.length; i++) {
            stuff += '<tr><td style="'+style+'">'+items[i].team_name+'</td><td style="'+style+'">'+items[i].state+'</td><td style="'+style+'">'+items[i].attribute+'</td></tr>'
        }

        stuff += '</table>'
        stuff += "</body></html>"

        res.status(200).send(stuff)
    })

})