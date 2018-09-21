package com.brentdunklau.telepatriot_android.util;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by bdunklau on 6/21/18.
 */

public class Legislator {

    // This is ugly - these are the fields associated with legislators from the video/list node
    private String leg_id, legislator_chamber, legislator_cos_position, legislator_district;
    private String legislator_email, legislator_facebook, legislator_facebook_id;
    private String legislator_first_name, legislator_full_name, legislator_last_name;
    private String legislator_name, legislator_phone, legislator_state, legislator_state_abbrev;
    private String legislator_twitter;

    //  ...but we have other attributes from states/legislators
    private String chamber;
    private List<Channel> channels = new ArrayList<Channel>();
    private String district;
    private List<String> emails = new ArrayList<String>();
    private String first_name, full_name, id, last_name, middle_name;
    private List<Office> offices = new ArrayList<Office>();
    private String party;
    private List<String> phones = new ArrayList<String>();
    private String photo_url, photoUrl, state/*abbrev*/;
    private List<String> urls = new ArrayList<String>();


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

    public void setLegislator_facebook(String channelId) {
        this.legislator_facebook = channelId;
        updateChannel("facebook", channelId);
    }

    private void updateChannel(String channelType, String channelId) {
        // need to sync this value with the value in Channels...
        boolean hasThisChannel = false;
        for(Channel c : getChannels()) {
            if(c.getType().equalsIgnoreCase(channelType)) {
                hasThisChannel = true;
                c.setId(channelId);
            }
        }
        if(!hasThisChannel) {
            Channel c = new Channel();
            c.setId(channelId);
        }
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
        updateChannel("twitter", legislator_twitter);
    }

    // this is end of all the attributes we see under video/list
    //////////////////////////////////////////////////////////////////

    //////////////////////////////////////////////////////////////////
    // beginning of all the attributes we see under states/legislators

    public String getChamber() {
        return chamber;
    }

    public void setChamber(String chamber) {
        this.chamber = chamber;
        this.legislator_chamber = chamber;
    }

    public List<Channel> getChannels() {
        return channels;
    }

    public void setChannels(List<Channel> channels) {
        this.channels = channels;
        // for the nodes under /video/list, we need to set legislator_facebook,
        // legislator_facebook_id, and legislator_twitter...
        for(Channel c : channels) {
            if(c.getType().equalsIgnoreCase("facebook")) {
                legislator_facebook = c.getId();
                legislator_facebook_id = c.getFacebook_id();
            } else if(c.getType().equalsIgnoreCase("twitter")) {
                legislator_twitter = c.getId();
            }
        }
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
        this.legislator_district = district;
    }

    public List<String> getEmails() {
        return emails;
    }

    public void setEmails(List<String> emails) {
        this.emails = emails;
        if(emails != null && !emails.isEmpty())
            legislator_email = emails.get(0);
    }

    public String getFirst_name() {
        return first_name;
    }

    public void setFirst_name(String first_name) {
        this.first_name = first_name;
        this.legislator_first_name = first_name;
    }

    public String getFull_name() {
        return full_name;
    }

    public void setFull_name(String full_name) {
        this.full_name = full_name;
        this.legislator_full_name = full_name;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getLast_name() {
        return last_name;
    }

    public void setLast_name(String last_name) {
        this.last_name = last_name;
        this.legislator_last_name = last_name;
    }

    public String getMiddle_name() {
        return middle_name;
    }

    public void setMiddle_name(String middle_name) {
        this.middle_name = middle_name;
    }

    public List<Office> getOffices() {
        return offices;
    }

    public void setOffices(List<Office> offices) {
        this.offices = offices;
    }

    public String getParty() {
        return party;
    }

    public void setParty(String party) {
        this.party = party;
    }

    public List<String> getPhones() {
        return phones;
    }

    public void setPhones(List<String> phones) {
        this.phones = phones;
        if(phones != null && !phones.isEmpty()) {
            legislator_phone = phones.get(0);
        }
    }

    public String getPhoto_url() {
        return photo_url;
    }

    public void setPhoto_url(String photo_url) {
        this.photo_url = photo_url;
        this.photoUrl = photo_url;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
        this.photo_url = photoUrl;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
        this.legislator_state = state;

        // google-cloud.js:youtubeVideoDescription() is expecting legislator_state_abbrev
        if(state != null && state.length() == 2) {
            this.setLegislator_state_abbrev(state);
        }
    }

    public List<String> getUrls() {
        return urls;
    }

    public void setUrls(List<String> urls) {
        this.urls = urls;
    }

    public Map<String, Object> getValuesForVideoNode() {
        Map<String, Object> vals = new HashMap<String, Object>();
        vals.put("leg_id", leg_id);
        vals.put("legislator_chamber", legislator_chamber);
        vals.put("legislator_cos_position", legislator_cos_position);
        vals.put("legislator_district", legislator_district);
        vals.put("legislator_email", legislator_email);
        vals.put("legislator_facebook", legislator_facebook);
        vals.put("legislator_facebook_id", legislator_facebook_id);
        vals.put("legislator_first_name", legislator_first_name);
        vals.put("legislator_full_name", legislator_full_name);
        vals.put("legislator_last_name", legislator_last_name);
        vals.put("legislator_name", legislator_name);
        vals.put("legislator_phone", legislator_phone);
        vals.put("legislator_state", legislator_state);
        vals.put("legislator_state_abbrev", legislator_state_abbrev);
        vals.put("legislator_twitter", legislator_twitter);
        return vals;
    }
}
