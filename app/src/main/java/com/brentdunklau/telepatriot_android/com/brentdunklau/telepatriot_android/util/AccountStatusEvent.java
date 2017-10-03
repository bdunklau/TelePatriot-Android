package com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util;

/**
 * Created by bdunklau on 10/2/2017.
 */

public class AccountStatusEvent {

    String date; // might want this to be a Date
    String event;

    public AccountStatusEvent() {
        // needed for firebase
        // see:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
    }

    public AccountStatusEvent(String date, String event) {
        this.date = date;
        this.event = event;
    }

    public String getDate() {
        return date;
    }

    public String getEvent() {
        return event;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public void setEvent(String event) {
        this.event = event;
    }


}
