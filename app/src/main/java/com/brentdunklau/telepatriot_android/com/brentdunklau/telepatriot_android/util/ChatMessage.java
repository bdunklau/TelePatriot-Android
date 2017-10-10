package com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util;

/**
 * Created by bdunklau on 10/10/2017.
 */

public class ChatMessage {

    private String name, message;

    public ChatMessage() {

    }

    public ChatMessage(String message, String name) {
        this.message = message;
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
