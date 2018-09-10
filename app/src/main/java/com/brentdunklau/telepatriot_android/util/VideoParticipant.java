package com.brentdunklau.telepatriot_android.util;

import java.util.HashMap;
import java.util.Map;

/**
 * Add participants by calling VideoInvitation.accept()
 */

public class VideoParticipant {

    private String uid;
    private String name;
    private String email;
    private String phone;
    private String start_date;
    private long start_date_ms;
    private String connect_date;
    private long connect_date_ms;
    private String disconnect_date;
    private long disconnect_date_ms;
    private String end_date;
    private long end_date_ms;
    private String role;
    private boolean present = true; // because basically a participant has to be present for this object to be instantiated
    //String vidyo_token;  // don't use this anymore 8/10/18
    private String twilio_token;        // for non-recordable rooms
    private String twilio_token_record; // for recordable rooms


    // MUST have a no-arg constructor for firebase deserialization
    public VideoParticipant() {}

    public VideoParticipant(User user) {

        uid = user.getUid();
        name = user.getName();
        email = user.getEmail();
        // not init-ing with phone
        start_date = Util.getDate_Day_MMM_d_hmmss_am_z_yyyy();
        start_date_ms = Util.getDate_as_millis();
        // not init-ing with role
    }

    public Map map() {
        Map m = new HashMap();
        m.put("uid", uid);
        m.put("name", name);
        m.put("email", email);
        m.put("phone", phone);
        m.put("start_date", start_date);
        m.put("start_date_ms", start_date_ms);
        m.put("connect_date", connect_date);
        m.put("connect_date_ms", connect_date_ms);
        m.put("disconnect_date", disconnect_date);
        m.put("disconnect_date_ms", disconnect_date_ms);
        m.put("end_date", end_date);
        m.put("end_date_ms", end_date_ms);
        m.put("role", role);
        m.put("present", present);
        m.put("twilio_token", twilio_token);
        m.put("twilio_token_record", twilio_token_record);
        return m;
    }

    public boolean isPresent() {
        return present;
    }

    public void setPresent(boolean present) {
        this.present = present;
    }

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getStart_date() {
        return start_date;
    }

    public void setStart_date(String start_date) {
        this.start_date = start_date;
    }

    public long getStart_date_ms() {
        return start_date_ms;
    }

    public void setStart_date_ms(long start_date_ms) {
        this.start_date_ms = start_date_ms;
    }


    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getConnect_date() {
        return connect_date;
    }

    public void setConnect_date(String connect_date) {
        this.connect_date = connect_date;
    }

    public long getConnect_date_ms() {
        return connect_date_ms;
    }

    public void setConnect_date_ms(long connect_date_ms) {
        this.connect_date_ms = connect_date_ms;
    }

    public String getDisconnect_date() {
        return disconnect_date;
    }

    public void setDisconnect_date(String disconnect_date) {
        this.disconnect_date = disconnect_date;
    }

    public long getDisconnect_date_ms() {
        return disconnect_date_ms;
    }

    public void setDisconnect_date_ms(long disconnect_date_ms) {
        this.disconnect_date_ms = disconnect_date_ms;
    }

    public String getEnd_date() {
        return end_date;
    }

    public void setEnd_date(String end_date) {
        this.end_date = end_date;
    }

    public long getEnd_date_ms() {
        return end_date_ms;
    }

    public void setEnd_date_ms(long end_date_ms) {
        this.end_date_ms = end_date_ms;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getTwilio_token() {
        return twilio_token;
    }

    public void setTwilio_token(String twilio_token) {
        this.twilio_token = twilio_token;
    }

    public String getTwilio_token_record() {
        return twilio_token_record;
    }

    public void setTwilio_token_record(String twilio_token_record) {
        this.twilio_token_record = twilio_token_record;
    }

    public boolean isConnected() {
        return connect_date != null && (twilio_token != null || twilio_token_record != null) && disconnect_date == null;
    }
}
