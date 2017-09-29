package com.brentdunklau.telepatriot_android;

/**
 * Created by bdunklau on 9/28/17.
 */

public class Message {
    private String title, text;
    public Message(String title, String text) {
        this.text = text;
        this.title = title;
    }
    public String getTitle() {
        return title;
    }
    public String getText() {
        return text;
    }
}
