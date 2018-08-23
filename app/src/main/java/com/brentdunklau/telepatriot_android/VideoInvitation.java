package com.brentdunklau.telepatriot_android;

import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.UserBean;
import com.brentdunklau.telepatriot_android.util.Util;
import com.brentdunklau.telepatriot_android.util.VideoNode;
import com.brentdunklau.telepatriot_android.util.VideoParticipant;
import com.google.firebase.database.FirebaseDatabase;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by bdunklau on 6/10/18.
 */

public class VideoInvitation {

    // The attributes have to be named the same as the database attributes under /video/invitations
    private String guest_id;
    private String guest_name;
    private String guest_email;
    private String guest_photo_url;

    private String initiator_id;
    private String initiator_name;
    private String initiator_email;
    private String initiator_photo_url;

    private String invitation_create_date;
    private long invitation_create_date_ms;

    private String room_id;

    private String initiator_enter_room_date;
    private long initiator_enter_room_date_ms;

    private String guest_enter_room_date;
    private long guest_enter_room_date_ms;

    private String video_node_key;

    private String key; // the key/primary key of the video/invitations node


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

    // convenience constructor for delete()
    public VideoInvitation(VideoNode videoNode) {
        this.video_node_key = videoNode.getKey();
        this.key = videoNode.getVideo_invitation_key();
        this.guest_id = this.key.substring(this.key.indexOf("guest")+"guest".length());
        this.initiator_id = this.key.substring(this.key.indexOf("initiator")+"initiator".length(), this.key.indexOf("guest"));
    }

    /**
     *
     * @return the key of the node
     */
    public String save() {
        String key = constructKey(initiator_id, guest_id);
        FirebaseDatabase.getInstance().getReference("video/invitations/"+key).setValue(dictionary());
        return key;
    }

    private String constructKey(String initiator_id, String guest_id) {
        return "initiator"+initiator_id+"guest"+guest_id;
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

    public void delete() {
        if(video_node_key==null || key==null || guest_id==null)
            return; // can't delete - some data is missing
        Map updates = new HashMap();
        updates.put("video/list/"+video_node_key+"/video_invitation_key", null);
        updates.put("video/list/"+video_node_key+"/video_invitation_extended_to", null);
        updates.put("video/list/"+video_node_key+"/video_participants/"+guest_id, null);
        updates.put("video/invitations/"+key, null);
        updates.put("users/"+guest_id+"/current_video_node_key", null);
        FirebaseDatabase.getInstance().getReference().updateChildren(updates);
    }

    public void accept() {
        Map values = new HashMap();
        if(User.getInstance().getCurrent_video_node_key() != null) {
            values.put("video/list/"+User.getInstance().getCurrent_video_node_key()+"/video_participants/"+User.getInstance().getUid()+"/present", false);
        }

        User.getInstance().setCurrent_video_node_key(video_node_key);

        VideoParticipant videoParticipant = new VideoParticipant(User.getInstance());
        for(Object key : videoParticipant.map().keySet()) {
            String absPath = "video/list/"+getVideo_node_key()+"/video_participants/"+User.getInstance().getUid()+"/"+key;
            Object value = videoParticipant.map().get(key);
            values.put(absPath, value);
        }

        // setting 'present' to true here because we are about to go to the Video Chat screen
        // Sure, we also set present=true onResume() and onStart() but ... anyway
        values.put("video/list/"+getVideo_node_key()+"/video_participants/"+User.getInstance().getUid()+"/present", true);
        values.put("video/list/"+getVideo_node_key()+"/video_participants/"+User.getInstance().getUid()+"/vidyo_token_requested", true);
        values.put("video/list/"+getVideo_node_key()+"/room_id", getRoom_id());
        FirebaseDatabase.getInstance().getReference("/").updateChildren(values);
    }

    public void decline() {
        delete();
    }
}
