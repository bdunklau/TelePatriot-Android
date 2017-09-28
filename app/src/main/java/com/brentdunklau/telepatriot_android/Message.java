package com.brentdunklau.telepatriot_android;

/**
 * Created by bdunklau on 9/27/17.
 */


// should be temporary - can't imagine leaving this around after figuring out
// messaging works
// ref:  https://github.com/chizoba/Firebase-Cloud-Functions-Tutorial/blob/master/app/src/main/java/com/github/chizoba/firebasecloudfunctions/MainActivity.java
public class Message {
    String title, message;
    public Message(String title, String message) {
        this.title = title;
        this.message = message;
    }
    public String getTitle() {
        return title;
    }
    public String getMessage() {
        return message;
    }
}
