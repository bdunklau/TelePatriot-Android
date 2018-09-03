package com.brentdunklau.telepatriot_android.util;

import android.widget.EditText;
import android.widget.Spinner;

import com.google.firebase.database.FirebaseDatabase;

import java.util.HashMap;
import java.util.Map;

/**
 * Represents an offer from someone to go on camera and participate in a video chat
 *
 * Created by bdunklau on 8/30/18.
 */

public class VideoOffer {
    private String uid;
    private String date;
    private Long date_ms;
    private String email;
    private String name;
    private String phone;
    private String photoUrl;
    private String residential_address_line1;
    private String residential_address_line2;
    private String residential_address_city;
    private String residential_address_state_abbrev;
    private String residential_address_zip;
    private String state_upper_district;
    private String state_lower_district;

    public VideoOffer() { }

    public VideoOffer(User user) {
        this(user.getUid(),
                Util.getDate_Day_MMM_d_hmmss_am_z_yyyy(),
                System.currentTimeMillis(),
                User.getInstance().getEmail(),
                User.getInstance().getName(),
                User.getInstance().getPhone(),
                User.getInstance().getPhotoURL(),
                User.getInstance().getResidential_address_line1(),
                User.getInstance().getResidential_address_line2(),
                User.getInstance().getResidential_address_city(),
                User.getInstance().getResidential_address_state_abbrev(),
                User.getInstance().getState_upper_district(),
                User.getInstance().getState_lower_district());
    }

    public VideoOffer(String uid, String date, Long date_ms, String email, String name, String phone, String photoUrl,
                      String residential_address_line1, String residential_address_line2, String residential_address_city,
                      String residential_address_state_abbrev, String state_upper_district,
                      String state_lower_district) {
        this.uid = uid;
        this.date = date;
        this.date_ms = date_ms;
        this.email = email;
        this.name = name;
        this.phone = phone;
        this.photoUrl = photoUrl;
        this.residential_address_line1 = residential_address_line1;
        this.residential_address_line2 = residential_address_line2;
        this.residential_address_city = residential_address_city;
        this.residential_address_state_abbrev = residential_address_state_abbrev;
        this.state_upper_district = state_upper_district;
        this.state_lower_district = state_lower_district;
    }

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public Long getDate_ms() {
        return date_ms;
    }

    public void setDate_ms(Long date_ms) {
        this.date_ms = date_ms;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getResidential_address_line1() {
        return residential_address_line1;
    }

    public void setResidential_address_line1(String residential_address_line1) {
        this.residential_address_line1 = residential_address_line1;
    }

    public String getResidential_address_line2() {
        return residential_address_line2;
    }

    public void setResidential_address_line2(String residential_address_line2) {
        this.residential_address_line2 = residential_address_line2;
    }

    public String getResidential_address_city() {
        return residential_address_city;
    }

    public void setResidential_address_city(String residential_address_city) {
        this.residential_address_city = residential_address_city;
    }

    public String getResidential_address_state_abbrev() {
        return residential_address_state_abbrev;
    }

    public void setResidential_address_state_abbrev(String residential_address_state_abbrev) {
        this.residential_address_state_abbrev = residential_address_state_abbrev;
    }

    public String getResidential_address_zip() {
        return residential_address_zip;
    }

    public void setResidential_address_zip(String residential_address_zip) {
        this.residential_address_zip = residential_address_zip;
    }

    public String getState_upper_district() {
        return state_upper_district;
    }

    public void setState_upper_district(String state_upper_district) {
        this.state_upper_district = state_upper_district;
    }

    public String getState_lower_district() {
        return state_lower_district;
    }

    public void setState_lower_district(String state_lower_district) {
        this.state_lower_district = state_lower_district;
    }

    public void delete() {
        FirebaseDatabase.getInstance().getReference("video/offers/"+uid).removeValue();
    }
}
