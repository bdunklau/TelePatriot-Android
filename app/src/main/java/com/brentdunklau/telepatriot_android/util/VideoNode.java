package com.brentdunklau.telepatriot_android.util;

import com.google.firebase.database.FirebaseDatabase;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by bdunklau on 6/21/18.
 */

public class VideoNode {

    String key;
    String node_create_date;
    long node_create_date_ms;
    List<VideoParticipant> video_participants = new ArrayList<VideoParticipant>();
    String video_mission_description;
    String youtube_video_description;
    String youtube_video_description_unevaluated;
    String youtube_url;
    String video_recording_begin_date;
    long video_recording_begin_date_ms;
    String video_recording_end_date;
    long video_recording_end_date_ms;
    Legislator legislator;

    // MUST have a no-arg constructor for firebase deserialization
    public VideoNode() {}

    public VideoNode(User user, VideoType t) {

        node_create_date = Util.getDate_Day_MMM_d_hmmss_am_z_yyyy();
        node_create_date_ms = Util.getDate_as_millis();
        video_participants.add(new VideoParticipant(user));
        video_mission_description = t.getVideo_mission_description();
        youtube_video_description = t.getYoutube_video_description();
        youtube_video_description_unevaluated = t.getYoutube_video_description();
        legislator = new Legislator();
    }

    public String getKey() {
        if(key == null) {
            // get/create key by inserting a node under video/list
            key = FirebaseDatabase.getInstance().getReference("video/list").push().getKey();
            save();
        }
        return key;
    }

    public void save() {
        if(key == null) return;
        FirebaseDatabase.getInstance().getReference("video/list/"+key).setValue(map());
    }

    private Map map() {
        Map m = new HashMap();
        m.put("node_create_date", node_create_date);
        m.put("node_create_date_ms", node_create_date_ms);
        m.put("video_participants", list(video_participants));
        m.put("youtube_url", youtube_url);
        m.put("youtube_video_description", youtube_video_description);
        m.put("youtube_video_description_unevaluated", youtube_video_description_unevaluated);
        m.put("video_mission_description", video_mission_description);
        m.put("video_recording_begin_date", video_recording_begin_date);
        m.put("video_recording_begin_date_ms", video_recording_begin_date_ms);
        m.put("video_recording_end_date", video_recording_end_date);
        m.put("video_recording_end_date_ms", video_recording_end_date_ms);
        if(legislator != null) {
            m.put("legislator_name", legislator.getLegislator_full_name());
            //m.put("legislator_title", legislator);  legislator_title ????
            m.put("leg_id", legislator.getLeg_id());
            m.put("legislator_state", legislator.getLegislator_state());
            m.put("legislator_state_abbrev", legislator.getLegislator_state_abbrev());
            m.put("legislator_district", legislator.getLegislator_district());
            m.put("legislator_chamber", legislator.getLegislator_chamber());
            m.put("legislator_cos_position", legislator.getLegislator_cos_position());
            m.put("legislator_facebook", legislator.getLegislator_facebook());
            m.put("legislator_facebook_id", legislator.getLegislator_facebook_id());
            m.put("legislator_twitter", legislator.getLegislator_twitter());
            m.put("legislator_email", legislator.getLegislator_email());
            m.put("legislator_phone", legislator.getLegislator_phone());
        }

        return m;
    }

    private List list(List list) {
        List ret = new ArrayList();
        if(list == null || list.isEmpty())
            return ret;
        if(!(list.get(0) instanceof VideoParticipant))
            return ret;
        for(Object o : list) {
            ret.add(((VideoParticipant)o).map());
        }
        return ret;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getNode_create_date() {
        return node_create_date;
    }

    public void setNode_create_date(String node_create_date) {
        this.node_create_date = node_create_date;
    }

    public long getNode_create_date_ms() {
        return node_create_date_ms;
    }

    public void setNode_create_date_ms(long node_create_date_ms) {
        this.node_create_date_ms = node_create_date_ms;
    }

    public List<VideoParticipant> getVideo_participants() {
        return video_participants;
    }

    public void setVideo_participants(List<VideoParticipant> video_participants) {
        this.video_participants = video_participants;
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

    public String getYoutube_video_description_unevaluated() {
        return youtube_video_description_unevaluated;
    }

    public void setYoutube_video_description_unevaluated(String youtube_video_description_unevaluated) {
        this.youtube_video_description_unevaluated = youtube_video_description_unevaluated;
    }

    public Legislator getLegislator() {
        return legislator;
    }

    public void setLegislator(Legislator legislator) {
        this.legislator = legislator;
    }
}
