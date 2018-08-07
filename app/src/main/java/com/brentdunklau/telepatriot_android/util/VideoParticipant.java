package com.brentdunklau.telepatriot_android.util;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by bdunklau on 6/21/18.
 */

public class VideoParticipant {

    String uid;
    String name;
    String email;
    String start_date;
    long start_date_ms;
    String phone;
    String connect_date;
    long connect_date_ms;
    String disconnect_date;
    long disconnect_date_ms;
    String end_date;
    long end_date_ms;
    String role;
    boolean present = true; // because basically a participant has to be present for this object to be instantiated
    String vidyo_token;

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
        m.put("vidyo_token", vidyo_token);
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

    public String getVidyo_token() {
        return vidyo_token;
    }

    public void setVidyo_token(String vidyo_token) {
        this.vidyo_token = vidyo_token;
    }

    public boolean isConnected() {
        return connect_date != null && disconnect_date == null;
    }
}
