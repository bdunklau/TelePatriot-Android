package com.brentdunklau.telepatriot_android.util;

import java.util.Map;

/**
 * Created by bdunklau on 10/4/17.
 */

public class UserBean {

    private String name, email, uid, photoUrl, created, reviewed_by;
    private Map<String, Object> roles;

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
}
