package com.brentdunklau.telepatriot_android.util;

import java.util.Map;

/**
 * Created by bdunklau on 10/4/17.
 */

public class UserBean {

    private String name, email, uid, photoUrl, created, reviewed_by, recruiter_id;
    private Boolean has_signed_petition;
    private Boolean has_signed_confidentiality_agreement;
    //private boolean do_not_approve;

    private Boolean is_banned;

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

    /******
    public boolean getDo_not_approve() {
        boolean banned = is_banned != null && is_banned.booleanValue();
        boolean not_signed_ca = has_signed_confidentiality_agreement == null || !has_signed_confidentiality_agreement.booleanValue();
        return banned || not_signed_ca;
    }

    public boolean canApprove() {
        return !getDo_not_approve();
    }
    *******/

}
