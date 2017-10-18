package com.brentdunklau.telepatriot_android.util;

/**
 * Created by bdunklau on 10/17/17.
 */

public class PhoneCampaignCreated {
    private String uid, name, url, mission_name, mission_type = "Phone Campaign", create_date, uid_date_status;

    public PhoneCampaignCreated() {

    }

    public PhoneCampaignCreated(User user, String mission_name, String url) {
        this.uid = user.getUid();
        this.name = user.getName();
        this.url = url;
        this.mission_name = mission_name;
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

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
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
        this.mission_type = mission_name;
    }

    public String getCreate_date() {
        return create_date;
    }

    public void setCreate_date(String create_date) {
        this.create_date = create_date;
    }

    public String getUid_date_status() {
        return uid_date_status;
    }

    // a compound key that we can query on/order by
    public void setUid_date_status(String uid_date_status) {
        this.uid_date_status = uid_date_status;
    }
}
