package com.brentdunklau.telepatriot_android.util;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by bdunklau on 10/4/17.
 */

public class UserBean {

    private String name, email, uid, photoUrl, created, reviewed_by, recruiter_id;
    private Boolean has_signed_petition;
    private Boolean has_signed_confidentiality_agreement;

    private Boolean is_banned;
    //private Boolean enabled = true;
    private boolean isAdmin, isDirector, isVolunteer, isVideoCreator;

    private String account_disposition;
    private String account_dispositioned_by;
    private String account_dispositioned_by_uid;
    private String account_dispositioned_on;
    private Long account_dispositioned_on_ms;

    private String residential_address_line1;
    private String residential_address_line2;
    private String residential_address_city;
    private String residential_address_state_abbrev;
    private String residential_address_zip;
    private String state_lower_district;
    private String state_upper_district;
    private String video_invitation_from; // uid of someone that invited this person to a video chat
    private String video_invitation_from_name; // name of someone that invited this person to a video chat
    private String phone;
    private Double current_latitude;
    private Double current_longitude;

    private String current_video_node_key;

    private List<Team> teams;

    private Map<String, Object> roles;

    public UserBean() {

    }

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getUid() {
        return uid;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public String getCreated() {
        return created;
    }

    public void setCreated(String created) {
        this.created = created;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPhone() {
        return phone;
    }

    public void setReviewed_by(String reviewed_by) {
        this.reviewed_by = reviewed_by;
    }

    public String getReviewed_by() {
        return reviewed_by;
    }

    public void setRoles(Map<String, Object> roles) {
        this.roles = roles;
    }

    public Map<String, Object> getRoles() {
        return roles;
    }

    public boolean isRole(String role) {
        return roles != null && roles.containsKey(role);
    }

    public String getRecruiter_id() {
        return recruiter_id;
    }

    public void setRecruiter_id(String recruiter_id) {
        this.recruiter_id = recruiter_id;
    }

    public Boolean getHas_signed_petition() {
        return has_signed_petition;
    }

    public void setHas_signed_petition(Boolean has_signed_petition) {
        this.has_signed_petition = has_signed_petition;
    }

    public Boolean getHas_signed_confidentiality_agreement() {
        return has_signed_confidentiality_agreement;
    }

    public void setHas_signed_confidentiality_agreement(Boolean has_signed_confidentiality_agreement) {
        this.has_signed_confidentiality_agreement = has_signed_confidentiality_agreement;
    }

    public Boolean getIs_banned() {
        return is_banned;
    }

    public void setIs_banned(Boolean is_banned) {
        this.is_banned = is_banned;
    }

    public boolean isEnabled() {
        return account_disposition == null || account_disposition.equalsIgnoreCase("enabled");
    }

    public void setEnabled(boolean enabled) {
        //this.enabled = enabled;
        account_disposition = enabled ? "enabled" : "disabled";
        account_dispositioned_by = User.getInstance().getName();
        account_dispositioned_by_uid = User.getInstance().getUid();
        account_dispositioned_on = new SimpleDateFormat("MMM d, yyyy h:mm a z").format(new Date());
        account_dispositioned_on_ms = System.currentTimeMillis();
    }

    public String getAccount_disposition() {
        return account_disposition;
    }

    public void setAccount_disposition(String account_disposition) {
        this.account_disposition = account_disposition;
    }

    public String getAccount_dispositioned_by() {
        return account_dispositioned_by;
    }

    public void setAccount_dispositioned_by(String account_dispositioned_by) {
        this.account_dispositioned_by = account_dispositioned_by;
    }

    public String getAccount_dispositioned_by_uid() {
        return account_dispositioned_by_uid;
    }

    public void setAccount_dispositioned_by_uid(String account_dispositioned_by_uid) {
        this.account_dispositioned_by_uid = account_dispositioned_by_uid;
    }

    public String getAccount_dispositioned_on() {
        return account_dispositioned_on;
    }

    public void setAccount_dispositioned_on(String account_dispositioned_on) {
        this.account_dispositioned_on = account_dispositioned_on;
    }

    public Long getAccount_dispositioned_on_ms() {
        return account_dispositioned_on_ms;
    }

    public void setAccount_dispositioned_on_ms(Long account_dispositioned_on_ms) {
        this.account_dispositioned_on_ms = account_dispositioned_on_ms;
    }

    public boolean isAdmin() {
        return isAdmin;
    }

    public void setAdmin(boolean admin) {
        isAdmin = admin;
    }

    public boolean isDirector() {
        return isDirector;
    }

    public void setDirector(boolean director) {
        isDirector = director;
    }

    public boolean isVolunteer() {
        return isVolunteer;
    }

    public void setVolunteer(boolean volunteer) {
        isVolunteer = volunteer;
    }

    public boolean isVideoCreator() {
        return isVideoCreator;
    }

    public void setVideoCreator(boolean videoCreator) {
        isVideoCreator = videoCreator;
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

    public String getState_lower_district() {
        return state_lower_district;
    }

    public void setState_lower_district(String state_lower_district) {
        this.state_lower_district = state_lower_district;
    }

    public String getState_upper_district() {
        return state_upper_district;
    }

    public void setState_upper_district(String state_upper_district) {
        this.state_upper_district = state_upper_district;
    }

    public String getVideo_invitation_from() {
        return video_invitation_from;
    }

    public void setVideo_invitation_from(String video_invitation_from) {
        this.video_invitation_from = video_invitation_from;
    }

    public String getVideo_invitation_from_name() {
        return video_invitation_from_name;
    }

    public void setVideo_invitation_from_name(String video_invitation_from_name) {
        this.video_invitation_from_name = video_invitation_from_name;
    }

    public Double getCurrent_latitude() {
        return current_latitude;
    }

    public void setCurrent_latitude(Double current_latitude) {
        this.current_latitude = current_latitude;
    }

    public Double getCurrent_longitude() {
        return current_longitude;
    }

    public void setCurrent_longitude(Double current_longitude) {
        this.current_longitude = current_longitude;
    }

    public String getCurrent_video_node_key() {
        return current_video_node_key;
    }

    public void setCurrent_video_node_key(String current_video_node_key) {
        this.current_video_node_key = current_video_node_key;
    }

    // modeled after TPUser.update() in Swift
    public void update() {
        // ref:  https://firebase.googleblog.com/2015/09/introducing-multi-location-updates-and_86.html
        // multi-path updates...

        // multi-path update example
        Map m = new HashMap();
        m.put("account_disposition", account_disposition);
        m.put("account_dispositioned_by", account_dispositioned_by);
        m.put("account_dispositioned_by_uid", account_dispositioned_by_uid);
        m.put("account_dispositioned_on", account_dispositioned_on);
        m.put("account_dispositioned_on_ms", account_dispositioned_on_ms);
        m.put("residential_address_line1", residential_address_line1);
        m.put("residential_address_line2", residential_address_line2);
        m.put("residential_address_city", residential_address_city);
        m.put("residential_address_state_abbrev", residential_address_state_abbrev);
        m.put("residential_address_zip", residential_address_zip);
        m.put("state_lower_district", state_lower_district);
        m.put("state_upper_district", state_upper_district);
        m.put("video_invitation_from", video_invitation_from);
        m.put("video_invitation_from_name", video_invitation_from_name);
        m.put("current_latitude", current_latitude);
        m.put("current_longitude", current_longitude);
        m.put("has_signed_confidentiality_agreement", has_signed_confidentiality_agreement);
        m.put("has_signed_petition", has_signed_petition);
        m.put("is_banned", is_banned);
        m.put("current_video_node_key", current_video_node_key);

        Map roleMap = new HashMap();
        roleMap.put("Admin", isAdmin ? "true" : null); // will forever regret making these strings instead of booleans
        roleMap.put("Director", isDirector ? "true" : null); // will forever regret making these strings instead of booleans
        roleMap.put("Volunteer", isVolunteer ? "true" : null); // will forever regret making these strings instead of booleans
        roleMap.put("Video Creator", isVideoCreator ? "true" : null); // will forever regret making these strings instead of booleans

        m.put("roles", roleMap);

        // multi-path update example
        // what about teams ?
        FirebaseDatabase database = FirebaseDatabase.getInstance();
        DatabaseReference userRef = database.getReference("users").child(uid);
        userRef.updateChildren(m);
    }
}
