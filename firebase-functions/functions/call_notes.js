'use strict';

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const request = require('request')
// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');

// create reference to root of the database
const db = admin.database().ref()

/**
firebase deploy --only functions:callNotes,functions:onCallNotesCreated,functions:missions,functions:updateMissionsOnCallNotesCreated
**/

exports.callNotes = functions.https.onRequest((req, res) => {
    if(!req.query.mission_id) {
        return res.status(200).send('Need ?mission_id=[number]');
    }

//    var limit = req.query.limit ? parseInt(req.query.limit) : 50;
    return db.child('call_notes').orderByChild('mission_id').equalTo(parseInt(req.query.mission_id))/*.limitToFirst(limit)*/.once('value').then(snapshot => {
        var html = '<html><head>';
        html += '<style>';
        html += 'td { border-bottom: 1pt solid #cccccc; font-family:Tahoma }'
        html += 'th, h3 { font-family:Tahoma }'
        html += '.small {color:#aaaaaa;font-size:11px;border: 0 solid #ffffff}'
        html += '</style>';
        html += '</head>';
        html += '<body>';

        // google charts :)
        html += '<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>';
        html += '<script type="text/javascript">google.charts.load(\'current\', {\'packages\':[\'corechart\']});</script>';

        html += '<h3><a href="/missions">All Missions</a> > '+req.query.mission_name+'</h3>'
        html += '<table cellspacing="0" cellpadding="5">';
        snapshot.forEach(function(child) {
            html += '<tr>';
            html +=     '<td colspan="3" class="small">'+child.val().call_date+'</td>';
            html += '</tr>';
            html += '<tr>';
            html +=     '<td valign="top" nowrap>'
            html +=         '<a href="https://dashboard.conventionofstates.com/admin/people/'+child.val().author_id+'" target="cos" title="see '+child.val().author_name+' in CitizenBuilder">'+child.val().author_name+'</a>';
            html +=         '<br/><span  class="small"> (ID: '+child.val().author_id+')</span>'
            html +=     '</td>';
            html +=     '<td valign="top" nowrap>'+child.val().outcome+'</td>';
            html +=     '<td valign="top" nowrap>';
            html +=         '<a href="https://dashboard.conventionofstates.com/admin/people/'+child.val().person_id+'" target="cos" title="see '+child.val().first_name+' '+child.val().last_name+' in CitizenBuilder">'+child.val().first_name+' '+child.val().last_name+'</a>';
            html +=         '<br/><span  class="small"> (ID: '+child.val().person_id+')</span>';
            html +=     '</td>';
            html +=     '<td valign="top" nowrap><a href="tel://'+child.val().phone_number+'" target="call">'+child.val().phone_number+'</a></td>';
            html +=     '<td valign="top">'+child.val().notes+'</td>';
            html += '</tr>';
        })
        html += '</table></body></html>';

        return res.status(200).send(html);
    })
})


exports.missions = functions.https.onRequest((req, res) => {
    var forUnfurling = '<meta property="og:title" content="TelePatriot Missions"/>'
              +'<meta property="og:description" content="See all TelePatriot missions and drill in to any of them to see specific call notes."/>'
              +'<meta property="og:image" content="https://i.imgur.com/ZHGQZwe.png" />';

//    var limit = req.query.limit ? req.query.limit : 50;
    return db.child('missions').orderByChild('mission_name')/*.limitToFirst(limit)*/.once('value').then(snapshot => {
        var html = '<html><head>';
        html += '<style>';
        html += 'td { border-bottom: 1pt solid #cccccc; font-family:Tahoma }'
        html += 'th, h3 { font-family:Tahoma }'
        html += '</style>';
        html += forUnfurling;
        html += '</head>';
        html += '<body>';
        html += '<h3>All Missions</h3>'


//        html +=         '<div id="piechart"></div>';

//html +=
//'<script type="text/javascript">'
//+'google.charts.load(\'current\', {\'packages\':[\'corechart\']});'
//+'google.charts.setOnLoadCallback(drawChart);'
//+'function drawChart() {'
//+'  var data = google.visualization.arrayToDataTable(['
//+'  [\'Task\', \'Hours per Day\'],'
//+'  [\'Work\', 8],'
//+'  [\'Eat\', 2],'
//+'  [\'TV\', 4],'
//+'  [\'Gym\', 2],'
//+'  [\'Sleep\', 8]'
//+']);'
//+'  var options = {\'title\':\'My Average Day\', \'width\':550, \'height\':400};'
//+'  var chart = new google.visualization.PieChart(document.getElementById(\'piechart\'));'
//+'  chart.draw(data, options);'
//+'}'
//+'</script>'


        html += '<table cellspacing="0" cellpadding="5">';
        html += '<tr><th>Mission</th><th>Calls made</th><th>Most recent call</th></tr>'
        snapshot.forEach(function(child) {
            var remain = child.val().total - child.val().calls_made;
            html += '<tr>';
            html +=     '<td><a href="/callNotes?mission_id='+child.val().mission_id+'&mission_name='+child.val().mission_name+'">'+child.val().mission_name+'</a></td>';
//            html +=     '<td>';
//            html +=         '<div id="piechart'+child.val().mission_id+'"></div>';
//            html +=
//'<script type="text/javascript">'
//+ 'google.charts.load(\'current\', {\'packages\':[\'corechart\']});'
//+ 'google.charts.setOnLoadCallback(drawChart'+child.val().mission_id+');'
//
//+ 'function drawChart'+child.val().mission_id+'() {'
//+ '  var data = google.visualization.arrayToDataTable(['
//+ '  [\'Made\', '+child.val().calls_made+'],'
//+ '  [\'Remaining\', '+remain+']'
//+ ']);'
//
//+ '  var options = {\'title\':\'\', \'width\':25, \'height\':25};'
//
//+ '  var chart = new google.visualization.PieChart(document.getElementById("piechart'+child.val().mission_id+'"));'
//+ '  chart.draw(data, options);'
//+ '}'
//+ '</script>';
//
//
//            html +=     '</td>';
            html +=     '<td>'+child.val().calls_made+' of '+child.val().total+' ('+child.val().percent_complete+'%)</td>';
            html +=     '<td>'+child.val().date+'</td>';
            html += '</tr>';
        })
        html += '</table></body></html>';

        return res.status(200).send(html);
    })
})


exports.onCallNotesCreated = functions.database.ref('call_notes/{key}').onCreate((snapshot2, context) => {
    var call_notes = snapshot2.val()
    var msg = '=============================\n'
        +'Mission ID '+call_notes.mission_id+': '+call_notes.mission_name+' is '+call_notes.percent_complete+'% Complete, '+call_notes.calls_made+' of '+call_notes.total+' calls made\n'
        +call_notes.outcome+': '+call_notes.author_name+' CB ID: '+call_notes.author_id+' just called '
        +call_notes.first_name+' '+call_notes.last_name+' CB ID: '+call_notes.person_id+' at '+call_notes.phone_number+'\n'

    if(call_notes.outcome == '3-way call' && call_notes.name2 && call_notes.phone2) {
        msg += 'included 3-way call with '+call_notes.name2+' at '+call_notes.phone2+'\n'
    }
    if(call_notes.notes) msg += 'Notes: '+call_notes.notes

    // Get rid of all ( and ) in the message because those get encoded on Slack as %28 and %29
    msg = msg.replace(/\(|\)/g, '')

    return db.child('administration/configuration').once('value').then(snapshot => {
        if(snapshot.val().on_call_notes == 'do_nothing')
            return false
        var url = snapshot.val().call_notes_webhook

        var formData = {"text": msg, "mrkdwn": true}

        request.post(
            {
                url: url,
                form: JSON.stringify(formData)
                ,headers: {'Content-type': 'application/json'}
            },
            function (err, httpResponse, body) {
                //log something here, see userCreated.js
            }
        );
    })
})


/**
THIS IS A ONE-TIME FUNCTION that reads all the call_notes entries and creates /missions entries
Why?
So that we can display the list of missions to people
Why do we want to do that?
So that we can click a mission and be taken to the call_notes for that mission.
**/
exports.tempNotes = functions.https.onRequest((req, res) => {
    return db.child('call_notes').once('value').then(snapshot => {
        var html = '<html><head>';
        html += '<style>';
        html += 'td { border-bottom: 1pt solid #cccccc; font-family:Tahoma }'
        html += '</style>';
        html += '</head>';
        html += '<body>';
        html += 'call_notes records: '+snapshot.numChildren()+'<P/>';
        html += '<table cellspacing="0" cellpadding="5">'
        var missions = {};
        snapshot.forEach(function(child) {
            var mission_id = child.val().mission_id+'';
            missions[mission_id] = {'mission_name': child.val().mission_name,
                                    'mission_id': child.val().mission_id,
                                    'date': child.val().call_date,
                                    'calls_made': child.val().calls_made,
                                    'total': child.val().total,
                                    'percent_complete': child.val().percent_complete};
        });

        var xxx = {}
        _.each(Object.keys(missions), function(mission_id) {
            var mission = missions[mission_id];
            xxx['missions/'+mission_id+'/mission_id'] = parseInt(mission_id);
            xxx['missions/'+mission_id+'/mission_name'] = mission['mission_name'];
            xxx['missions/'+mission_id+'/date'] = mission['date'];
            xxx['missions/'+mission_id+'/calls_made'] = mission['calls_made'];
            xxx['missions/'+mission_id+'/total'] = mission['total'];
            xxx['missions/'+mission_id+'/percent_complete'] = mission['percent_complete'];
            html += '<tr>';
            html +=     '<td>missions['+mission_id+'] = '+missions[mission_id]['mission_name']+'</td>';
            html += '</tr>';
        })
        db.child('/').update(xxx);
        html += '</table></body></html>';

        return res.status(200).send(html);
    })
})


// When a call_notes record is written, update that mission's node under /missions.
// Does two things:
// 1) makes sure every mission represented in /missions so later we can click it and see the call_notes
//and
// 2) updates the mission stats on /missions so we can all see progresss at a glance
exports.updateMissionsOnCallNotesCreated = functions.database.ref('call_notes/{key}').onCreate((snapshot2, context) => {
    return db.child('missions/'+snapshot2.val().mission_id)
                .update({
                    calls_made: snapshot2.val().calls_made,
                    date: snapshot2.val().call_date,
                    mission_id: snapshot2.val().mission_id,
                    mission_name: snapshot2.val().mission_name,
                    percent_complete: snapshot2.val().percent_complete,
                    total: snapshot2.val().total
                });
})