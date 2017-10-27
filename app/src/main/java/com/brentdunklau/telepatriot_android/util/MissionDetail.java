package com.brentdunklau.telepatriot_android.util;

/**
 * Created by bdunklau on 10/24/17.
 */

public class MissionDetail {

    private String description, email, mission_create_date, mission_id, mission_name, mission_type, name, phone, script, uid, uid_and_active, url, accomplished, active_and_accomplished;
    private boolean active;

    public MissionDetail() {

    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name!=null ? name : "(no name)";
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone!=null ? phone : "(no phone)";
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMission_create_date() {
        return mission_create_date;
    }

    public void setMission_create_date(String mission_create_date) {
        this.mission_create_date = mission_create_date;
    }

    public String getMission_id() {
        return mission_id;
    }

    public void setMission_id(String mission_id) {
        this.mission_id = mission_id;
    }

    public String getMission_name() {
        return mission_name;
    }

    public void setMission_name(String mission_name) {
        this.mission_name = mission_name;
    }

    public String getMission_type() {
        return mission_type;
    }

    public void setMission_type(String mission_type) {
        this.mission_type = mission_type;
    }

    public String getScript() {
        return script;
    }

    public void setScript(String script) {
        this.script = script;
    }

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public String getUid_and_active() {
        return uid_and_active;
    }

    public void setUid_and_active(String uid_and_active) {
        this.uid_and_active = uid_and_active;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getAccomplished() {
        return accomplished;
    }

    public void setAccomplished(String accomplished) {
        this.accomplished = accomplished;
    }

    public String getActive_and_accomplished() {
        return active_and_accomplished;
    }

    public void setActive_and_accomplished(String active_and_accomplished) {
        this.active_and_accomplished = active_and_accomplished;
    }
}
