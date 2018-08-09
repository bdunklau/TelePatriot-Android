package com.brentdunklau.telepatriot_android.util;

import com.google.firebase.database.FirebaseDatabase;

import java.util.HashMap;
import java.util.Map;

public class VideoEvent {

    User user;
    String video_node_key;
    String room_id;
    String request_type;

    public VideoEvent(User user, String video_node_key, String room_id, String request_type) {
        this.user = user;
        this.video_node_key = video_node_key;
        this.room_id = room_id;
        this.request_type = request_type;
    }

    public void save() {
        FirebaseDatabase.getInstance().getReference("video/video_events/").push().setValue(dictionary());
    }

    private Map dictionary() {
        Map m = new HashMap();
        m.put("uid", user.getUid());
        m.put("name", user.getName());
        m.put("video_node_key", video_node_key);
        m.put("room_id", room_id);
        m.put("request_type", request_type);
        return m;
    }
}
