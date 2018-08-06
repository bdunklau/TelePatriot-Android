package com.brentdunklau.telepatriot_android;

import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.UserBean;
import com.brentdunklau.telepatriot_android.util.Util;
import com.google.firebase.database.FirebaseDatabase;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by bdunklau on 6/10/18.
 */

public class VideoInvitation {

    // The attributes have to be named the same as the database attributes under /video/invitations
    String guest_id;
    String guest_name;
    String guest_email;
    String guest_photo_url;

    String initiator_id;
    String initiator_name;
    String initiator_email;
    String initiator_photo_url;

    String invitation_create_date;
    long invitation_create_date_ms;

    String room_id;

    String initiator_enter_room_date;
    long initiator_enter_room_date_ms;

    String guest_enter_room_date;
    long guest_enter_room_date_ms;

    String video_node_key;

    String key; // the key/primary key of the video/invitations node


    public VideoInvitation() {}


    public VideoInvitation(User creator, UserBean guest, String video_node_key) {
        initiator_id = creator.getUid();
        initiator_name = creator.getName();
        initiator_email = creator.getEmail();
        initiator_photo_url = creator.getPhotoURL();
        invitation_create_date = Util.getDate_Day_MMM_d_hmmss_am_z_yyyy();
        invitation_create_date_ms = Util.getDate_as_millis();
        room_id = video_node_key;
        guest_id = guest.getUid();
        guest_name = guest.getName();
        guest_email = guest.getEmail();
        guest_photo_url = guest.getPhotoUrl();
        this.video_node_key = video_node_key;
    }

    /**
     *
     * @return the key of the node
     */
    public String save() {
        String key = "initiator"+initiator_id+"guest"+guest_id;
        FirebaseDatabase.getInstance().getReference("video/invitations/"+key).setValue(dictionary());
        return key;
    }

    private Map dictionary() {
        Map m = new HashMap();
        m.put("guest_id", guest_id);
        m.put("guest_name", guest_name);
        m.put("guest_email", guest_email);
        m.put("guest_photo_url", guest_photo_url);
        m.put("initiator_id", initiator_id);
        m.put("initiator_name", initiator_name);
        m.put("initiator_email", initiator_email);
        m.put("initiator_photo_url", initiator_photo_url);
        m.put("invitation_create_date", invitation_create_date);
        m.put("invitation_create_date_ms", invitation_create_date_ms);
        m.put("room_id", room_id);
        m.put("initiator_enter_room_date", initiator_enter_room_date);
        m.put("initiator_enter_room_date_ms", initiator_enter_room_date_ms);
        m.put("guest_enter_room_date", guest_enter_room_date);
        m.put("guest_enter_room_date_ms", guest_enter_room_date_ms);
        m.put("video_node_key", video_node_key);
        return m;
    }

    public String getGuest_id() {
        return guest_id;
    }

    public void setGuest_id(String guest_id) {
        this.guest_id = guest_id;
    }

    public String getGuest_name() {
        return guest_name;
    }

    public void setGuest_name(String guest_name) {
        this.guest_name = guest_name;
    }

    public String getGuest_email() {
        return guest_email;
    }

    public void setGuest_email(String guest_email) {
        this.guest_email = guest_email;
    }

    public String getGuest_photo_url() {
        return guest_photo_url;
    }

    public void setGuest_photo_url(String guest_photo_url) {
        this.guest_photo_url = guest_photo_url;
    }

    public String getInitiator_id() {
        return initiator_id;
    }

    public void setInitiator_id(String initiator_id) {
        this.initiator_id = initiator_id;
    }

    public String getInitiator_name() {
        return initiator_name;
    }

    public void setInitiator_name(String initiator_name) {
        this.initiator_name = initiator_name;
    }

    public String getInitiator_email() {
        return initiator_email;
    }

    public void setInitiator_email(String initiator_email) {
        this.initiator_email = initiator_email;
    }

    public String getInitiator_photo_url() {
        return initiator_photo_url;
    }

    public void setInitiator_photo_url(String initiator_photo_url) {
        this.initiator_photo_url = initiator_photo_url;
    }

    public String getInvitation_create_date() {
        return invitation_create_date;
    }

    public void setInvitation_create_date(String invitation_create_date) {
        this.invitation_create_date = invitation_create_date;
    }

    public long getInvitation_create_date_ms() {
        return invitation_create_date_ms;
    }

    public void setInvitation_create_date_ms(long invitation_create_date_ms) {
        this.invitation_create_date_ms = invitation_create_date_ms;
    }

    public String getRoom_id() {
        return room_id;
    }

    public void setRoom_id(String room_id) {
        this.room_id = room_id;
    }

    public String getInitiator_enter_room_date() {
        return initiator_enter_room_date;
    }

    public void setInitiator_enter_room_date(String initiator_enter_room_date) {
        this.initiator_enter_room_date = initiator_enter_room_date;
    }

    public long getInitiator_enter_room_date_ms() {
        return initiator_enter_room_date_ms;
    }

    public void setInitiator_enter_room_date_ms(long initiator_enter_room_date_ms) {
        this.initiator_enter_room_date_ms = initiator_enter_room_date_ms;
    }

    public String getGuest_enter_room_date() {
        return guest_enter_room_date;
    }

    public void setGuest_enter_room_date(String guest_enter_room_date) {
        this.guest_enter_room_date = guest_enter_room_date;
    }

    public long getGuest_enter_room_date_ms() {
        return guest_enter_room_date_ms;
    }

    public void setGuest_enter_room_date_ms(long guest_enter_room_date_ms) {
        this.guest_enter_room_date_ms = guest_enter_room_date_ms;
    }

    public String getVideo_node_key() {
        return video_node_key;
    }

    public void setVideo_node_key(String video_node_key) {
        this.video_node_key = video_node_key;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }
}
