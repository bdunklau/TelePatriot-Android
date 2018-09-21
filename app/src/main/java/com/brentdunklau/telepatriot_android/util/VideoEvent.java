package com.brentdunklau.telepatriot_android.util;

import com.google.firebase.database.FirebaseDatabase;

import java.util.HashMap;
import java.util.Map;

public class VideoEvent {

    private String uid;
    private String name;
    private String video_node_key;
    private String room_id;
    private String RoomSid; // use same name as twilio
    private String MediaUri; // use same name as twilio
    private String video_invitation_key;
    private String video_invitation_extended_to;
    private String request_type;

    public VideoEvent(String uid, String name, String video_node_key, String room_id, String request_type, String RoomSid, String MediaUri) {
        this.uid = uid;
        this.name = name;
        this.video_node_key = video_node_key;
        this.room_id = room_id;
        this.request_type = request_type;
        this.RoomSid = RoomSid;
        this.MediaUri = MediaUri;
    }

    public VideoEvent(String uid, String name, String video_node_key, String room_id, String request_type) {
        this(uid, name, video_node_key, room_id, request_type, null, null);
    }

    public void save() {
        FirebaseDatabase.getInstance().getReference("video/video_events/").push().setValue(dictionary());
    }

    private Map dictionary() {
        Map m = new HashMap();
        m.put("uid", uid);
        m.put("name", name);
        m.put("video_node_key", video_node_key);
        m.put("room_id", room_id);
        if(RoomSid != null)
            m.put("RoomSid", RoomSid);
        if(MediaUri != null)
            m.put("MediaUri", MediaUri);
        m.put("video_invitation_key", video_invitation_key);
        m.put("video_invitation_extended_to", video_invitation_extended_to);
        m.put("request_type", request_type);
        return m;
    }

//    public String getRoomSid() {
//        return RoomSid;
//    }
//
//    public void setRoomSid(String roomSid) {
//        this.RoomSid = roomSid;
//    }
}
