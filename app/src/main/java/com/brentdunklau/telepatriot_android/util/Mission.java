package com.brentdunklau.telepatriot_android.util;

import android.provider.ContactsContract;

/**
 * Created by bdunklau on 10/18/2017.
 */

public class Mission {

    private String mission_create_date, mission_name, mission_type, name, uid, uid_and_active, description, script;
    private int count_items_imported, count_in_spreadsheet;

    public int getCount_items_imported() {
        return count_items_imported;
    }

    public void setCount_items_imported(int count_items_imported) {
        this.count_items_imported = count_items_imported;
    }

    public int getCount_in_spreadsheet() {
        return count_in_spreadsheet;
    }

    public void setCount_in_spreadsheet(int count_in_spreadsheet) {
        this.count_in_spreadsheet = count_in_spreadsheet;
    }

    private boolean active;

    public Mission() {

    }

    public String getMission_create_date() {
        return mission_create_date;
    }

    public void setMission_create_date(String mission_create_date) {
        this.mission_create_date = mission_create_date;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public boolean getActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getUid_and_active() {
        return uid_and_active;
    }

    public void setUid_and_active(String uid_and_active) {
        this.uid_and_active = uid_and_active;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getScript() {
        return script;
    }

    public void setScript(String script) {
        this.script = script;
    }
}
