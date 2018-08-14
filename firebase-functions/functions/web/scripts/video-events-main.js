
'use strict';


// ref:  https://github.com/firebase/quickstart-js/blob/master/database/scripts/main.js
// Bindings on load.
window.addEventListener('load', function() {

  // Saves message on form submit.
  messageForm.onsubmit = function(e) {
    e.preventDefault();
    window.alert('ok then')
//    var text = messageInput.value;
//    var title = titleInput.value;
//    if (text && title) {
//      newPostForCurrentUser(title, text).then(function() {
//        myPostsMenuButton.click();
//      });
//      messageInput.value = '';
//      titleInput.value = '';
//    }
  };

  // Bind menu buttons.
  recentMenuButton.onclick = function() {
    showSection(recentPostsSection, recentMenuButton);
  };
  myPostsMenuButton.onclick = function() {
    showSection(userPostsSection, myPostsMenuButton);
  };
  myTopPostsMenuButton.onclick = function() {
    showSection(topUserPostsSection, myTopPostsMenuButton);
  };
  addButton.onclick = function() {
    showSection(addPost);
    messageInput.value = '';
    titleInput.value = '';
  };
  recentMenuButton.onclick();
}, false);