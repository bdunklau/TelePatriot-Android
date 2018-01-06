package com.brentdunklau.telepatriot_android.util;

import android.util.Log;

import com.google.android.gms.ads.identifier.AdvertisingIdClient;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.MutableData;
import com.google.firebase.database.Transaction;

/**
 * Created by bdunklau on 10/24/17.
 *
 * In hindsight, should have named this class MissionItem
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
    private Integer group_number;
    private Integer group_number_was;
    private Integer number_of_missions_in_master_mission;


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
        // New as of Dec 2017: When we unassign a mission item, we have to set group_number
        // back to group_number_was.  Otherwise, group_number will stay at 999999 and forever be at
        // the end of the queue
        setGroup_number(getGroup_number_was());
        setState("new", missionItemId);
    }

    public void setState(String state, String missionItemId) {
        setAccomplished(state);
        setActive_and_accomplished(isActive()+"_"+state);
        String team = User.getInstance().getCurrentTeamName();
        FirebaseDatabase.getInstance().getReference("/teams/"+team+"/mission_items/"+missionItemId).setValue(this);
    }

    public void complete(String missionItemId) {
        updateCompletedCount();
        setState("complete", missionItemId);
    }

    // source:  https://stackoverflow.com/a/28915836
    public void updateCompletedCount() {
        DatabaseReference mref = FirebaseDatabase.getInstance().getReference("/teams/"+User.getInstance().getCurrentTeamName()+"/missions/"+mission_id);
        mref.child("total_rows_completed").runTransaction(new Transaction.Handler() {
            @Override
            public Transaction.Result doTransaction(final MutableData currentData) {
                if (currentData.getValue() == null) {
                    currentData.setValue(1);
                } else {
                    currentData.setValue((Long) currentData.getValue() + 1);
                }

                return Transaction.success(currentData);
            }

            @Override
            public void onComplete(DatabaseError firebaseError, boolean committed, DataSnapshot currentData) {
                if (firebaseError != null) {
                    //Log.d("Firebase counter increment failed.");
                } else {
                    //Log.d("Firebase counter increment succeeded.");
                    // update the UI using the value in currentData
                    //  ...actually, may not need to update UI - may not even be possible here
                    // but we can listen for changes on the screen where we DO display the completed count !
                }
            }
        });
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

    public Integer getGroup_number_was() {
        return group_number_was;
    }

    public void setGroup_number_was(Integer group_number_was) {
        this.group_number_was = group_number_was;
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
