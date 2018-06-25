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

    String leg_id, legislator_chamber, legislator_cos_position, legislator_district, legislator_email,
            legislator_facebook, legislator_facebook_id, legislator_first_name, legislator_full_name,
            legislator_last_name, legislator_name, legislator_phone, legislator_state, legislator_state_abbrev,
            legislator_twitter;

    // MUST have a no-arg constructor for firebase deserialization
    public VideoNode() {
    }

    public VideoNode(User user, VideoType t) {

        node_create_date = Util.getDate_Day_MMM_d_hmmss_am_z_yyyy();
        node_create_date_ms = Util.getDate_as_millis();
        video_participants.add(new VideoParticipant(user));
        video_mission_description = t.getVideo_mission_description();
        youtube_video_description = t.getYoutube_video_description();
        youtube_video_description_unevaluated = t.getYoutube_video_description();
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

        m.put("legislator_name", getLegislator_full_name());
        //m.put("legislator_title", legislator_details);  legislator_title ????
        m.put("leg_id", getLeg_id());
        m.put("legislator_state", getLegislator_state());
        m.put("legislator_state_abbrev", legislator_state_abbrev);
        m.put("legislator_district", legislator_district);
        m.put("legislator_chamber", legislator_chamber);
        m.put("legislator_cos_position", legislator_cos_position);
        m.put("legislator_facebook", legislator_facebook);
        m.put("legislator_facebook_id", legislator_facebook_id);
        m.put("legislator_twitter", legislator_twitter);
        m.put("legislator_email", legislator_email);
        m.put("legislator_phone", legislator_phone);

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

    public String getLeg_id() {
        return leg_id;
    }

    public void setLeg_id(String leg_id) {
        this.leg_id = leg_id;
    }

    public String getLegislator_chamber() {
        return legislator_chamber;
    }

    public void setLegislator_chamber(String legislator_chamber) {
        this.legislator_chamber = legislator_chamber;
    }

    public String getLegislator_cos_position() {
        return legislator_cos_position;
    }

    public void setLegislator_cos_position(String legislator_cos_position) {
        this.legislator_cos_position = legislator_cos_position;
    }

    public String getLegislator_district() {
        return legislator_district;
    }

    public void setLegislator_district(String legislator_district) {
        this.legislator_district = legislator_district;
    }

    public String getLegislator_email() {
        return legislator_email;
    }

    public void setLegislator_email(String legislator_email) {
        this.legislator_email = legislator_email;
    }

    public String getLegislator_facebook() {
        return legislator_facebook;
    }

    public void setLegislator_facebook(String legislator_facebook) {
        this.legislator_facebook = legislator_facebook;
    }

    public String getLegislator_facebook_id() {
        return legislator_facebook_id;
    }

    public void setLegislator_facebook_id(String legislator_facebook_id) {
        this.legislator_facebook_id = legislator_facebook_id;
    }

    public String getLegislator_first_name() {
        return legislator_first_name;
    }

    public void setLegislator_first_name(String legislator_first_name) {
        this.legislator_first_name = legislator_first_name;
    }

    public String getLegislator_full_name() {
        return legislator_full_name;
    }

    public void setLegislator_full_name(String legislator_full_name) {
        this.legislator_full_name = legislator_full_name;
    }

    public String getLegislator_last_name() {
        return legislator_last_name;
    }

    public void setLegislator_last_name(String legislator_last_name) {
        this.legislator_last_name = legislator_last_name;
    }

    public String getLegislator_name() {
        return legislator_name;
    }

    public void setLegislator_name(String legislator_name) {
        this.legislator_name = legislator_name;
    }

    public String getLegislator_phone() {
        return legislator_phone;
    }

    public void setLegislator_phone(String legislator_phone) {
        this.legislator_phone = legislator_phone;
    }

    public String getLegislator_state() {
        return legislator_state;
    }

    public void setLegislator_state(String legislator_state) {
        this.legislator_state = legislator_state;
    }

    public String getLegislator_state_abbrev() {
        return legislator_state_abbrev;
    }

    public void setGetLegislator_state_abbrev(String legislator_state_abbrev) {
        this.legislator_state_abbrev = legislator_state_abbrev;
    }

    public String getLegislator_twitter() {
        return legislator_twitter;
    }

    public void setLegislator_twitter(String legislator_twitter) {
        this.legislator_twitter = legislator_twitter;
    }
}
