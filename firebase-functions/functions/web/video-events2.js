'use strict';

// lodash dependency declared in firebase-functions/functions/package.json
const _ = require('lodash');
const functions = require('firebase-functions')
const admin = require('firebase-admin')
const date = require('../dateformat')

// can only call this once globally and we already do that in index.js
//admin.initializeApp(functions.config().firebase);
const db = admin.database();

/****
deploy everything in this file...
firebase deploy --only functions:videoEvents
****/

exports.videoEvents = functions.https.onRequest((req, res) => {
    var html = ''

    return db.ref('api_tokens').once('value').then(snapshot => {

        html += '<html>'
html += '<head>'
html += '</head>'
html += '<body>'

html += '<style>'
html += '.rTable {'
html += '  	display: block;'
html += '  	width: 100%;'
html += '}'
html += '.rTableHeading, .rTableBody, .rTableFoot, .rTableRow{'
html += '  	clear: both;'
html += '}'
html += '.rTableHead, .rTableFoot{'
html += '  	background-color: #DDD;'
html += '  	font-weight: bold;'
html += '}'
html += '.rTableCell, .rTableHead {'
html += '  	border: 1px solid #999999;'
html += '  	float: left;'
html += '  	height: 17px;'
html += '  	overflow: hidden;'
html += '  	padding: 3px 1.8%;'
html += '  	width: 28%;'
html += '}'
html += '.rTable:after {'
html += '  	visibility: hidden;'
html += '  	display: block;'
html += '  	font-size: 0;'
html += '  	content: " ";'
html += '  	clear: both;'
html += '  	height: 0;'
html += '}'
html += '</style>'

html += '    <!-- Firebase App is always required and must be first -->'
html += '<script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-app.js"></script>'

html += '<!-- Add additional services that you want to use -->'
html += '<script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-auth.js"></script>'
html += '<script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-database.js"></script>'
html += '<!-- <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-firestore.js"></script> -->'
html += '<script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-messaging.js"></script>'
html += '<script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-functions.js"></script>'

html += '<!-- Comment out (or dont include) services that you dont want to use -->'
html += '<!-- <script src="https://www.gstatic.com/firebasejs/5.3.0/firebase-storage.js"></script> -->'

html += '<script src="https://www.gstatic.com/firebasejs/5.3.1/firebase.js"></script>'
html += '<script>'
html += '      var config = {'
html += '        apiKey: "'+snapshot.val().firebase_api_key+'",'
html += '        authDomain: "'+snapshot.val().firebase_auth_domain+'",'
html += '        databaseURL: "'+snapshot.val().firebase_database_url+'",'
html += '        projectId: "'+snapshot.val().firebase_project_id+'",'
html += '        storageBucket: "'+snapshot.val().firebase_storage_bucket+'",'
html += '        messagingSenderId: "'+snapshot.val().firebase_messaging_sender_id+'"  };'
html += '      firebase.initializeApp(config);'
html += '    </script>'


html += '<div class="rTable">'
html += '   <div class="rTableRow">'
html += '       <div class="rTableHead">date</div>'
html +=         '<div class="rTableHead">name</div>'
html += '       <div class="rTableHead">request_type</div>'
html += '   </div>'

        db.ref('video/video_events').on('value')

//
html += '   <div class="rTableRow">'
html += '       <div class="rTableCell">John</div>'
html += '       <div class="rTableCell"><a href="tel:0123456785">0123 456 785</a></div>'
html += '       <div class="rTableCell"><img src="images/check.gif" alt="checked" /></div>'
html += '   </div>'
html += '</div>'







//html += '    <form id="message-form" action="#">'
//html += '                    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">'
//html += '                      <input class="mdl-textfield__input" type="text" id="new-post-title">'
//html += '                      <label class="mdl-textfield__label" for="new-post-title">Post title...</label>'
//html += '                    </div>'
//html += '                    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">'
//html += '                      <textarea class="mdl-textfield__input" rows="3" id="new-post-message"></textarea>'
//html += '                      <label class="mdl-textfield__label" for="new-post-message">Post message...</label>'
//html += '                    </div>'
//html += '                    <button type="submit" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect">'
//html += '                      Add post'
//html += '                    </button>'
//html += '                  </form>'



html += '<script> '
html += 'window.addEventListener("load", function() { '

html += '  // Saves message on form submit. '
html += '  messageForm.onsubmit = function(e) { '
html += '    e.preventDefault(); '
html += '    window.alert(\'ok then\') '
html += '  }; '
html += '  // Bind menu buttons. '
html += '  recentMenuButton.onclick = function() { '
html += '    showSection(recentPostsSection, recentMenuButton); '
html += '  }; '
html += '  myPostsMenuButton.onclick = function() { '
html += '    showSection(userPostsSection, myPostsMenuButton); '
html += '  }; '
html += '  myTopPostsMenuButton.onclick = function() { '
html += '    showSection(topUserPostsSection, myTopPostsMenuButton); '
html += '  }; '
html += '  addButton.onclick = function() { '
html += '    showSection(addPost); '
html += '    messageInput.value = ''; '
html += '    titleInput.value = ''; '
html += '  }; '
html += '  recentMenuButton.onclick(); '
html += '}, false); '
html += '</script>
html += '</body>'
html += '</html>'

        return res.status(200).send(html)
    })

})