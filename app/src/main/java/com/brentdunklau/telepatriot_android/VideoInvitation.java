package com.brentdunklau.telepatriot_android;

import com.brentdunklau.telepatriot_android.util.User;

/**
 * Created by bdunklau on 6/10/18.
 */

public class VideoInvitation {

    // The attributes have to be named the same as the database attributes under /video/invitations
    String guest_email, guest_id, guest_name, guest_photo_url, initiator_email, initiator_id, initiator_name, initiator_photo_url;
    String invitation_create_date;
    Long invitation_create_date_ms;
    String room_id, video_node_id;

    public VideoInvitation() {

    }


    public String getInvitation_create_date() {
        return invitation_create_date;
    }

    public void setInvitation_create_date(String invitation_create_date) {
        this.invitation_create_date = invitation_create_date;
    }

    public String getGuest_email() {
        return guest_email;
    }

    public void setGuest_email(String guest_email) {
        this.guest_email = guest_email;
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

    public String getGuest_photo_url() {
        return guest_photo_url;
    }

    public void setGuest_photo_url(String guest_photo_url) {
        this.guest_photo_url = guest_photo_url;
    }

    public String getInitiator_email() {
        return initiator_email;
    }

    public void setInitiator_email(String initiator_email) {
        this.initiator_email = initiator_email;
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

    public String getInitiator_photo_url() {
        return initiator_photo_url;
    }

    public void setInitiator_photo_url(String initiator_photo_url) {
        this.initiator_photo_url = initiator_photo_url;
    }

    public Long getInvitation_create_date_ms() {
        return invitation_create_date_ms;
    }

    public void setInvitation_create_date_ms(Long invitation_create_date_ms) {
        this.invitation_create_date_ms = invitation_create_date_ms;
    }

    public String getRoom_id() {
        return room_id;
    }

    public void setRoom_id(String room_id) {
        this.room_id = room_id;
    }

    public String getVideo_node_id() {
        return video_node_id;
    }

    public void setVideo_node_id(String video_node_id) {
        this.video_node_id = video_node_id;
    }
}
