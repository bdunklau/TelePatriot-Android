package com.brentdunklau.telepatriot_android.util;

import com.google.firebase.database.FirebaseDatabase;

/**
 * Created by bdunklau on 8/31/18.
 */

public class CBAPIEvent {
    private String uid;
    private String email;
    private String name;
    private String event_type;

    public CBAPIEvent() {

    }

    public CBAPIEvent(String uid, String email, String name, String event_type) {
        this.uid = uid;
        this.email = email;
        this.name = name;
        this.event_type = event_type;
    }

    public static class CheckLegal extends CBAPIEvent {
        public CheckLegal(User user) {
            super(user.getUid(), user.getEmail(), user.getName(), "check legal");
        }
    }

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEvent_type() {
        return event_type;
    }

    public void setEvent_type(String event_type) {
        this.event_type = event_type;
    }

    public void save() {
        FirebaseDatabase.getInstance().getReference("cb_api_events/all-events").push().setValue(this);
    }
}
