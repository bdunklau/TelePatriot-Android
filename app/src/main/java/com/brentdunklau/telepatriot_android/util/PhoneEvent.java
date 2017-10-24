package com.brentdunklau.telepatriot_android.util;

import android.provider.ContactsContract;

/**
 * Created by bdunklau on 10/24/17.
 */

public class PhoneEvent {

    String event_date, event_type, volunteer_uid, volunteer_name;


    public PhoneEvent() {

    }

    public PhoneEvent(String event_date, String event_type, String volunteer_uid, String volunteer_name) {
        this.event_date = event_date;
        this.event_type = event_type;
        this.volunteer_uid = volunteer_uid;
        this.volunteer_name = volunteer_name;
    }

    public String getEvent_date() {
        return event_date;
    }

    public void setEvent_date(String event_date) {
        this.event_date = event_date;
    }

    public String getEvent_type() {
        return event_type;
    }

    public void setEvent_type(String event_type) {
        this.event_type = event_type;
    }

    public String getVolunteer_uid() {
        return volunteer_uid;
    }

    public void setVolunteer_uid(String volunteer_uid) {
        this.volunteer_uid = volunteer_uid;
    }

    public String getVolunteer_name() {
        return volunteer_name;
    }

    public void setVolunteer_name(String volunteer_name) {
        this.volunteer_name = volunteer_name;
    }


}
