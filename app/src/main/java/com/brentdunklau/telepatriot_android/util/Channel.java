package com.brentdunklau.telepatriot_android.util;

/**
 * Created by bdunklau on 6/22/18.
 */

// represents a channel at states/legislators/{leg_id}/channel
// basically a social media contact point
public class Channel {

    String id, type, facebook_id;

    public Channel() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getFacebook_id() {
        return facebook_id;
    }

    public void setFacebook_id(String facebook_id) {
        this.facebook_id = facebook_id;
    }
}
