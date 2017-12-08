package com.brentdunklau.telepatriot_android.util;

import com.google.firebase.database.FirebaseDatabase;

/**
 * Created by bdunklau on 10/24/17.
 */

public class MissionDetail {

    private String description;
    private String email;
    private String mission_create_date;
    private String mission_complete_date;
    private String mission_id;
    private String mission_name;
    private String mission_type;
    private String name;
    private String phone;
    private String script;
    private String uid;
    private String uid_and_active;
    private String url;
    private String accomplished;
    private String active_and_accomplished;
    private String name2, phone2; // when the spreadsheet has these columns, means 3 way call
    private boolean active;
    private Integer  group_number, number_of_missions_in_master_mission;

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

    public boolean _isAccomplished() {
        return "complete".equalsIgnoreCase(getAccomplished());
    }

    public String getActive_and_accomplished() {
        return active_and_accomplished;
    }

    public void setActive_and_accomplished(String active_and_accomplished) {
        this.active_and_accomplished = active_and_accomplished;
    }

    public void unassign(String missionItemId) {
        setState("new", missionItemId);
    }

    public void setState(String state, String missionItemId) {
        setAccomplished(state);
        setActive_and_accomplished(isActive()+"_"+state);
        FirebaseDatabase.getInstance().getReference("mission_items/"+missionItemId).setValue(this);

    }

    public void complete(String missionItemId) {
        setState("complete", missionItemId);
    }

    // when the spreadsheet has these columns, means 3 way call
    public String getName2() {
        return name2;
    }

    // when the spreadsheet has these columns, means 3 way call
    public void setName2(String name2) {
        this.name2 = name2;
    }

    // when the spreadsheet has these columns, means 3 way call
    public String getPhone2() {
        return phone2;
    }

    // when the spreadsheet has these columns, means 3 way call
    public void setPhone2(String phone2) {
        this.phone2 = phone2;
    }

    public Integer getGroup_number() {
        return group_number;
    }

    public void setGroup_number(Integer group_number) {
        this.group_number = group_number;
    }

    public Integer getNumber_of_missions_in_master_mission() {
        return number_of_missions_in_master_mission;
    }

    public void setNumber_of_missions_in_master_mission(Integer number_of_missions_in_master_mission) {
        this.number_of_missions_in_master_mission = number_of_missions_in_master_mission;
    }

    public String getMission_complete_date() {
        return mission_complete_date;
    }

    public void setMission_complete_date(String mission_complete_date) {
        this.mission_complete_date = mission_complete_date;
    }
}
