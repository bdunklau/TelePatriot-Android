package com.brentdunklau.telepatriot_android.util;

import android.provider.ContactsContract;

/**
 * Created by bdunklau on 10/18/2017.
 */

// In Xcode, the class is called MissionSummary
public class Mission {

    private String mission_create_date, mission_name, mission_type, name, uid, uid_and_active, description, script;
    private int count_items_imported, count_in_spreadsheet;

    // 1/4/18 new fields from import-sheet.js and mission-activator.js
    private Integer total_rows_in_spreadsheet;
    private Integer total_rows_in_spreadsheet_with_phone;
    private Integer total_rows_activated;
    private Integer total_rows_deactivated;
    private Integer total_rows_completed;
    private Integer percent_complete;

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

    public Integer getTotal_rows_in_spreadsheet() {
        return total_rows_in_spreadsheet;
    }

    public void setTotal_rows_in_spreadsheet(Integer total_rows_in_spreadsheet) {
        this.total_rows_in_spreadsheet = total_rows_in_spreadsheet;
    }

    public Integer getTotal_rows_in_spreadsheet_with_phone() {
        return total_rows_in_spreadsheet_with_phone;
    }

    public void setTotal_rows_in_spreadsheet_with_phone(Integer total_rows_in_spreadsheet_with_phone) {
        this.total_rows_in_spreadsheet_with_phone = total_rows_in_spreadsheet_with_phone;
    }

    public Integer getTotal_rows_activated() {
        return total_rows_activated;
    }

    public void setTotal_rows_activated(Integer total_rows_activated) {
        this.total_rows_activated = total_rows_activated;
    }

    public Integer getTotal_rows_deactivated() {
        return total_rows_deactivated;
    }

    public void setTotal_rows_deactivated(Integer total_rows_deactivated) {
        this.total_rows_deactivated = total_rows_deactivated;
    }

    public Integer getTotal_rows_completed() {
        return total_rows_completed;
    }

    public void setTotal_rows_completed(Integer total_rows_completed) {
        this.total_rows_completed = total_rows_completed;
    }

    public Integer getPercent_complete() {
        return percent_complete;
    }

    public void setPercent_complete(Integer percent_complete) {
        this.percent_complete = percent_complete;
    }
}
