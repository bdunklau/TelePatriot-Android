package com.brentdunklau.telepatriot_android.util;

import android.provider.MediaStore;

import com.brentdunklau.telepatriot_android.MissionObject;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a record from /video/types and also provides convenience methods to get
 * all records under /video/types
 *
 * Created by bdunklau on 6/11/18.
 */

public class VideoType {

    private String type, video_mission_description, youtube_video_description;
    private Integer key;
    private static List<VideoType> types;

    public static void init() {
        query();
    }

    public VideoType(DataSnapshot dataSnapshot) {
        video_mission_description = dataSnapshot.child("video_mission_description").getValue().toString().trim();
        youtube_video_description = dataSnapshot.child("youtube_video_description").getValue().toString().trim();
        type = dataSnapshot.child("type").getValue().toString().trim();
        key = Integer.parseInt(dataSnapshot.getKey());
    }

    public static List<VideoType> getTypes() {
        if(types == null) {
            init();
        }
        return types;
    }

    public static VideoType getType(String type) {
        List<VideoType> ts = getTypes();
        for(VideoType vt : ts) {
            if(vt.getType().equalsIgnoreCase(type))
                return vt;
        }
        return null;
    }

    private static void query() {
        types = new ArrayList<VideoType>();
        DatabaseReference ref = FirebaseDatabase.getInstance().getReference();
        ref.child("video").child("types").addChildEventListener(new ChildEventListener() {
            @Override
            public void onChildAdded(DataSnapshot dataSnapshot, String s) {
                VideoType videoType = new VideoType(dataSnapshot);
                types.add(videoType);
            }

            @Override
            public void onChildChanged(DataSnapshot dataSnapshot, String s) {

            }

            @Override
            public void onChildRemoved(DataSnapshot dataSnapshot) {

            }

            @Override
            public void onChildMoved(DataSnapshot dataSnapshot, String s) {

            }

            @Override
            public void onCancelled(DatabaseError databaseError) {

            }
        });
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getVideo_mission_description() {
        return video_mission_description;
    }

    public void setVideo_mission_description(String video_mission_description) {
        this.video_mission_description = video_mission_description;
    }

    public String getYoutube_video_description() {
        return youtube_video_description;
    }

    public void setYoutube_video_description(String youtube_video_description) {
        this.youtube_video_description = youtube_video_description;
    }

    public Integer getKey() {
        return key;
    }

    public void setKey(Integer key) {
        this.key = key;
    }
}
