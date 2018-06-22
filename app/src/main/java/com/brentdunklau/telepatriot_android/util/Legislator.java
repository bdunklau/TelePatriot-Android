package com.brentdunklau.telepatriot_android.util;

/**
 * Created by bdunklau on 6/21/18.
 */

public class Legislator {

    private String leg_id, legislator_chamber, legislator_cos_position, legislator_district;
    private String legislator_email, legislator_facebook, legislator_facebook_id;
    private String legislator_first_name, legislator_full_name, legislator_last_name;
    private String legislator_name, legislator_phone, legislator_state, legislator_state_abbrev;
    private String legislator_twitter;

    // MUST have a no-arg constructor for firebase deserialization
    public Legislator() {}

    public String getLeg_id() {
        return leg_id;
    }

    public void setLeg_id(String leg_id) {
        this.leg_id = leg_id;
    }

    public String getLegislator_chamber() {
        return legislator_chamber;
    }

    public void setLegislator_chamber(String legislator_chamber) {
        this.legislator_chamber = legislator_chamber;
    }

    public String getLegislator_cos_position() {
        return legislator_cos_position;
    }

    public void setLegislator_cos_position(String legislator_cos_position) {
        this.legislator_cos_position = legislator_cos_position;
    }

    public String getLegislator_district() {
        return legislator_district;
    }

    public void setLegislator_district(String legislator_district) {
        this.legislator_district = legislator_district;
    }

    public String getLegislator_email() {
        return legislator_email;
    }

    public void setLegislator_email(String legislator_email) {
        this.legislator_email = legislator_email;
    }

    public String getLegislator_facebook() {
        return legislator_facebook;
    }

    public void setLegislator_facebook(String legislator_facebook) {
        this.legislator_facebook = legislator_facebook;
    }

    public String getLegislator_facebook_id() {
        return legislator_facebook_id;
    }

    public void setLegislator_facebook_id(String legislator_facebook_id) {
        this.legislator_facebook_id = legislator_facebook_id;
    }

    public String getLegislator_first_name() {
        return legislator_first_name;
    }

    public void setLegislator_first_name(String legislator_first_name) {
        this.legislator_first_name = legislator_first_name;
    }

    public String getLegislator_full_name() {
        return legislator_full_name;
    }

    public void setLegislator_full_name(String legislator_full_name) {
        this.legislator_full_name = legislator_full_name;
    }

    public String getLegislator_last_name() {
        return legislator_last_name;
    }

    public void setLegislator_last_name(String legislator_last_name) {
        this.legislator_last_name = legislator_last_name;
    }

    public String getLegislator_name() {
        return legislator_name;
    }

    public void setLegislator_name(String legislator_name) {
        this.legislator_name = legislator_name;
    }

    public String getLegislator_phone() {
        return legislator_phone;
    }

    public void setLegislator_phone(String legislator_phone) {
        this.legislator_phone = legislator_phone;
    }

    public String getLegislator_state() {
        return legislator_state;
    }

    public void setLegislator_state(String legislator_state) {
        this.legislator_state = legislator_state;
    }

    public String getLegislator_state_abbrev() {
        return legislator_state_abbrev;
    }

    public void setLegislator_state_abbrev(String legislator_state_abbrev) {
        this.legislator_state_abbrev = legislator_state_abbrev;
    }

    public String getLegislator_twitter() {
        return legislator_twitter;
    }

    public void setLegislator_twitter(String legislator_twitter) {
        this.legislator_twitter = legislator_twitter;
    }
}
