package com.brentdunklau.telepatriot_android.util;

import android.provider.ContactsContract;

import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Created by bdunklau on 10/24/17.
 */

public class MissionItemEvent {

    String event_date, event_type, volunteer_uid, volunteer_name, mission_name;
//    String volunteer_phone;
    String supporter_name, phone; /*supporter phone*/


    public MissionItemEvent() {

    }

//    public String getVolunteer_phone() {
//        return volunteer_phone;
//    }
//
//    public void setVolunteer_phone(String volunteer_phone) {
//        this.volunteer_phone = volunteer_phone;
//    }

    public String getSupporter_name() {
        return supporter_name;
    }

    public void setSupporter_name(String supporter_name) {
        this.supporter_name = supporter_name;
    }

    public MissionItemEvent(String event_type, String volunteer_uid, String volunteer_name, String mission_name, String phone, /*String volunteer_phone,*/ String supporter_name) {
        this(new SimpleDateFormat("EEE MMM d, h:mm:ss a z yyyy").format(new Date()),event_type, volunteer_uid, volunteer_name, mission_name, phone, /*volunteer_phone,*/ supporter_name);
    }

    public MissionItemEvent(String event_date, String event_type, String volunteer_uid, String volunteer_name, String mission_name, String phone, /*String volunteer_phone, */String supporter_name) {
        this.event_date = event_date;
        this.event_type = event_type;
        this.volunteer_uid = volunteer_uid;
        this.volunteer_name = volunteer_name;
        this.mission_name = mission_name;
        this.phone  = phone;
//        this.volunteer_phone = volunteer_phone;
        this.supporter_name = supporter_name;
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


    public String getMission_name() {
        return mission_name;
    }

    public void setMission_name(String mission_name) {
        this.mission_name = mission_name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
