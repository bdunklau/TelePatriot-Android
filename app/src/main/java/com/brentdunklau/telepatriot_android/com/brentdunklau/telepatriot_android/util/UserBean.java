package com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util;

import java.util.List;
import java.util.Map;
import java.util.SimpleTimeZone;

/**
 * Created by bdunklau on 10/4/17.
 */

public class UserBean {

    private String name, email, uid, photoUrl;
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
