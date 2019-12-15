package com.brentdunklau.telepatriot_android.util;

import com.google.firebase.database.FirebaseDatabase;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Created by bdunklau on 6/21/18.
 */

public class VideoNode {

    private String key;
    private String node_create_date;
    private long node_create_date_ms;

    // keyed by the user's id so that we can update a participant's node easily later on
    // like when their "present" status changes between true and false (when they enter and leave
    // the VidyoChatFragment)
    private Map<String, VideoParticipant> video_participants = new HashMap<String, VideoParticipant>();

    // these are the evaluated values corresponding to the fields in VideoType
    // In VideoType, these fields have values containing placeholders like (constituent name)
    // and (legislator)
    private String email_to_legislator_body;
    private String email_to_legislator_body_unevaluated;
    private String email_to_legislator_subject;
    private String email_to_legislator_subject_unevaluated;
    private String email_to_legislator_send_date;
    private Long email_to_legislator_send_date_ms;
    private String email_to_participant_body;
    private String email_to_participant_body_unevaluated;
    private String email_to_participant_subject;
    private String email_to_participant_subject_unevaluated;
    private String email_to_participant_send_date;
    private Long email_to_participant_send_date_ms;
    private String facebook_post_id;
    private String room_id;
    private String room_sid;        // the twilio RoomSid
    private String room_sid_record; // the twilio RoomSid of the recorded room

    private Boolean recording_requested; // See google-cloud:dockerRequest - for the spinner while the recorder is starting up
    private String recording_started;
    private long recording_started_ms;
    private String recording_stopped;
    private long recording_stopped_ms;
    private boolean recording_completed = false;

    // The "What do you want to do with your video" fields...
    // all true by default and the user can set them to false in the VidyoChatFragment if he doesn't like them
    private boolean email_to_legislator = true;
    private boolean post_to_facebook = true;
    private boolean post_to_twitter = true;
    private String twitter_post_id;
    private String video_type;
    private String video_id;
    private String video_title;
    private String youtube_video_description;
    private String youtube_video_description_unevaluated; // need this so you can re-evaluate when legislator or constituent changes
    private String video_mission_description;

    // These attributes are sent back to us from twilio.  Twilio calls twilioCallback() in twilio-telepatriot.js
    // see video/video_events and /testViewVideoEvents
    private Integer composition_PercentageDone;
    private Integer composition_SecondsRemaining;
    private String CompositionSid;
    private String CompositionUri;
    private Long composition_Size;
    private String composition_MediaUri;


    String leg_id, legislator_chamber, legislator_cos_position, legislator_district, legislator_email,
            legislator_facebook, legislator_facebook_id, legislator_first_name, legislator_full_name,
            legislator_last_name, legislator_name, legislator_phone, legislator_state, legislator_state_abbrev,
            legislator_twitter;

    String video_invitation_key, video_invitation_extended_to;

    // MUST have a no-arg constructor for firebase deserialization
    public VideoNode() {
    }

    public VideoNode(User user, VideoType t) {

        email_to_legislator_body = t.getEmail_to_legislator_body();
        email_to_legislator_body_unevaluated = t.getEmail_to_legislator_body();
        email_to_legislator_subject = t.getEmail_to_legislator_subject();
        email_to_legislator_subject_unevaluated = t.getEmail_to_legislator_subject();
        email_to_participant_body = t.getEmail_to_participant_body();
        email_to_participant_body_unevaluated = t.getEmail_to_participant_body();
        email_to_participant_subject = t.getEmail_to_participant_subject();
        email_to_participant_subject_unevaluated = t.getEmail_to_participant_subject();
        node_create_date = Util.getDate_Day_MMM_d_hmmss_am_z_yyyy();
        node_create_date_ms = Util.getDate_as_millis();
        video_participants.put(user.getUid(), new VideoParticipant(user));
        video_type = t.getType();
        video_mission_description = t.getVideo_mission_description();
        youtube_video_description = t.getYoutube_video_description();
        youtube_video_description_unevaluated = t.getYoutube_video_description();
    }

    public String getKey() {
        if(key == null) {
            // get/create key by inserting a node under video/list
            key = FirebaseDatabase.getInstance().getReference("video/list").push().getKey();
            room_id = key;
            save();
        }
        return key;
    }

    public void save() {
        if(key == null) return;
        FirebaseDatabase.getInstance().getReference("video/list/"+key).setValue(map());
    }

    // VideoInvitation.accept() is how you add a participant

    private Map map() {
        Map m = new HashMap();
        m.put("node_create_date", node_create_date);
        m.put("node_create_date_ms", node_create_date_ms);
        m.put("video_participants", video_participants);
        m.put("video_type", video_type);
        m.put("video_id", video_id);
        m.put("video_title", video_title);
        m.put("youtube_video_description", youtube_video_description);
        m.put("youtube_video_description_unevaluated", youtube_video_description_unevaluated);
        m.put("video_mission_description", video_mission_description);

        m.put("email_to_legislator_body", email_to_legislator_body);
        m.put("email_to_legislator_body_unevaluated", email_to_legislator_body_unevaluated);
        m.put("email_to_legislator_subject", email_to_legislator_subject);
        m.put("email_to_legislator_subject_unevaluated", email_to_legislator_subject_unevaluated);
        m.put("email_to_participant_body", email_to_participant_body);
        m.put("email_to_participant_body_unevaluated", email_to_participant_body_unevaluated);
        m.put("email_to_participant_subject", email_to_participant_subject);
        m.put("email_to_participant_subject_unevaluated", email_to_participant_subject_unevaluated);
        m.put("email_to_legislator_send_date", email_to_legislator_send_date);
        m.put("email_to_legislator_send_date_ms", email_to_legislator_send_date_ms);
        m.put("email_to_participant_send_date", email_to_participant_send_date);
        m.put("email_to_participant_send_date_ms", email_to_participant_send_date_ms);
        m.put("facebook_post_id", facebook_post_id);
        m.put("twitter_post_id", twitter_post_id);

        m.put("recording_started", recording_started);
        m.put("recording_started_ms", recording_started_ms);
        m.put("recording_stopped", recording_stopped);
        m.put("recording_stopped_ms", recording_stopped_ms);
        m.put("recording_completed", recording_completed);
        m.put("room_id", room_id);
        m.put("RoomSid", room_sid);

        m.put("leg_id", getLeg_id());
        m.put("legislator_name", getLegislator_full_name());
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

        m.put("email_to_legislator", email_to_legislator);
        m.put("post_to_facebook", post_to_facebook);
        m.put("post_to_twitter", post_to_twitter);

        m.put("composition_PercentageDone", composition_PercentageDone);
        m.put("composition_SecondsRemaining", composition_SecondsRemaining);
        m.put("composition_MediaUri", composition_MediaUri);
        m.put("CompositionSid", CompositionSid);
        m.put("CompositionUri", CompositionUri);
        m.put("composition_Size", composition_Size);

        m.put("video_invitation_key", video_invitation_key);
        m.put("video_invitation_extended_to", video_invitation_extended_to);
        return m;
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

    public Map<String, VideoParticipant> getVideo_participants() {
        return video_participants;
    }

//    Not sure if we need the setter - we "set" by writing to the db
//    public void setVideo_participants(List<VideoParticipant> video_participants) {
//        this.video_participants = video_participants;
//    }

    public String getVideo_title() {
        return video_title;
    }

    public void setVideo_title(String video_title) {
        this.video_title = video_title;
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

    public String getEmail_to_legislator_body() {
        return email_to_legislator_body;
    }

    public void setEmail_to_legislator_body(String email_to_legislator_body) {
        this.email_to_legislator_body = email_to_legislator_body;
    }

    public String getEmail_to_legislator_subject() {
        return email_to_legislator_subject;
    }

    public void setEmail_to_legislator_subject(String email_to_legislator_subject) {
        this.email_to_legislator_subject = email_to_legislator_subject;
    }

    public String getEmail_to_participant_body() {
        return email_to_participant_body;
    }

    public void setEmail_to_participant_body(String email_to_participant_body) {
        this.email_to_participant_body = email_to_participant_body;
    }

    public String getEmail_to_participant_subject() {
        return email_to_participant_subject;
    }

    public void setEmail_to_participant_subject(String email_to_participant_subject) {
        this.email_to_participant_subject = email_to_participant_subject;
    }

    public String getEmail_to_legislator_body_unevaluated() {
        return email_to_legislator_body_unevaluated;
    }

    public void setEmail_to_legislator_body_unevaluated(String email_to_legislator_body_unevaluated) {
        this.email_to_legislator_body_unevaluated = email_to_legislator_body_unevaluated;
    }

    public String getEmail_to_legislator_subject_unevaluated() {
        return email_to_legislator_subject_unevaluated;
    }

    public void setEmail_to_legislator_subject_unevaluated(String email_to_legislator_subject_unevaluated) {
        this.email_to_legislator_subject_unevaluated = email_to_legislator_subject_unevaluated;
    }

    public String getEmail_to_participant_body_unevaluated() {
        return email_to_participant_body_unevaluated;
    }

    public void setEmail_to_participant_body_unevaluated(String email_to_participant_body_unevaluated) {
        this.email_to_participant_body_unevaluated = email_to_participant_body_unevaluated;
    }

    public String getEmail_to_participant_subject_unevaluated() {
        return email_to_participant_subject_unevaluated;
    }

    public void setEmail_to_participant_subject_unevaluated(String email_to_participant_subject_unevaluated) {
        this.email_to_participant_subject_unevaluated = email_to_participant_subject_unevaluated;
    }

    public String getEmail_to_legislator_send_date() {
        return email_to_legislator_send_date;
    }

    public void setEmail_to_legislator_send_date(String email_to_legislator_send_date) {
        this.email_to_legislator_send_date = email_to_legislator_send_date;
    }

    public Long getEmail_to_legislator_send_date_ms() {
        return email_to_legislator_send_date_ms;
    }

    public void setEmail_to_legislator_send_date_ms(Long email_to_legislator_send_date_ms) {
        this.email_to_legislator_send_date_ms = email_to_legislator_send_date_ms;
    }

    public String getEmail_to_participant_send_date() {
        return email_to_participant_send_date;
    }

    public void setEmail_to_participant_send_date(String email_to_participant_send_date) {
        this.email_to_participant_send_date = email_to_participant_send_date;
    }

    public Long getEmail_to_participant_send_date_ms() {
        return email_to_participant_send_date_ms;
    }

    public void setEmail_to_participant_send_date_ms(Long email_to_participant_send_date_ms) {
        this.email_to_participant_send_date_ms = email_to_participant_send_date_ms;
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

    public boolean isEmail_to_legislator() {
        return email_to_legislator;
    }

    public void setEmail_to_legislator(boolean email_to_legislator) {
        this.email_to_legislator = email_to_legislator;
    }

    public boolean isPost_to_facebook() {
        return post_to_facebook;
    }

    public void setPost_to_facebook(boolean post_to_facebook) {
        this.post_to_facebook = post_to_facebook;
    }

    public boolean isPost_to_twitter() {
        return post_to_twitter;
    }

    public void setPost_to_twitter(boolean post_to_twitter) {
        this.post_to_twitter = post_to_twitter;
    }

    public String getRecording_started() {
        return recording_started;
    }

    public void setRecording_started(String recording_started) {
        this.recording_started = recording_started;
    }

    public long getRecording_started_ms() {
        return recording_started_ms;
    }

    public void setRecording_started_ms(long recording_started_ms) {
        this.recording_started_ms = recording_started_ms;
    }

    public String getRecording_stopped() {
        return recording_stopped;
    }

    public void setRecording_stopped(String recording_stopped) {
        this.recording_stopped = recording_stopped;
    }

    public long getRecording_stopped_ms() {
        return recording_stopped_ms;
    }

    public void setRecording_stopped_ms(long recording_stopped_ms) {
        this.recording_stopped_ms = recording_stopped_ms;
    }

    public boolean isRecording_completed() {
        return recording_completed;
    }

    public void setRecording_completed(boolean recording_completed) {
        this.recording_completed = recording_completed;
    }

    public String getFacebook_post_id() {
        return facebook_post_id;
    }

    public void setFacebook_post_id(String facebook_post_id) {
        this.facebook_post_id = facebook_post_id;
    }

    public String getTwitter_post_id() {
        return twitter_post_id;
    }

    public void setTwitter_post_id(String twitter_post_id) {
        this.twitter_post_id = twitter_post_id;
    }

    public String getVideo_invitation_key() {
        return video_invitation_key;
    }

    public void setVideo_invitation_key(String video_invitation_key) {
        this.video_invitation_key = video_invitation_key;
    }

    public String getVideo_invitation_extended_to() {
        return video_invitation_extended_to;
    }

    public void setVideo_invitation_extended_to(String video_invitation_extended_to) {
        this.video_invitation_extended_to = video_invitation_extended_to;
    }

    public Boolean getRecording_requested() {
        return recording_requested;
    }

    public void setRecording_requested(Boolean recording_requested) {
        this.recording_requested = recording_requested;
    }

    public String getRoom_id() {
        return room_id;
    }

    public void setRoom_id(String room_id) {
        this.room_id = room_id;
    }

    public String getRoom_sid() {
        return room_sid;
    }

    public void setRoom_sid(String room_sid) {
        this.room_sid = room_sid;
    }

    public String getRoom_sid_record() {
        return room_sid_record;
    }

    public void setRoom_sid_record(String room_sid_record) {
        this.room_sid_record = room_sid_record;
    }

    public Integer getComposition_PercentageDone() {
        return composition_PercentageDone;
    }

    public void setComposition_PercentageDone(Integer composition_PercentageDone) {
        this.composition_PercentageDone = composition_PercentageDone;
    }

    public Integer getComposition_SecondsRemaining() {
        return composition_SecondsRemaining;
    }

    public void setComposition_SecondsRemaining(Integer composition_SecondsRemaining) {
        this.composition_SecondsRemaining = composition_SecondsRemaining;
    }

    public String getComposition_MediaUri() {
        return composition_MediaUri;
    }

    public void setComposition_MediaUri(String composition_MediaUri) {
        this.composition_MediaUri = composition_MediaUri;
    }

    public String getCompositionSid() {
        return CompositionSid;
    }

    public void setCompositionSid(String compositionSid) {
        CompositionSid = compositionSid;
    }

    public String getCompositionUri() {
        return CompositionUri;
    }

    public void setCompositionUri(String compositionUri) {
        CompositionUri = compositionUri;
    }

    public Long getComposition_Size() {
        return composition_Size;
    }

    public void setComposition_Size(Long composition_Size) {
        this.composition_Size = composition_Size;
    }

    public String getVideo_id() {
        return video_id;
    }

    public void setVideo_id(String video_id) {
        this.video_id = video_id;
    }

    public boolean recordingHasNotStarted() {
        return recording_started == null;
    }

    public boolean recordingHasStarted() {
        return recording_started != null && recording_stopped == null;
    }

    public boolean recordingHasStopped() {
        boolean hasStopped = recording_started != null && recording_stopped != null;
        return hasStopped;
    }

    public boolean bothParticipantsPresent() {
        int count = 0;
        for(VideoParticipant vp : video_participants.values()) {
            if(vp.isPresent()) ++count;
        }
        return count == 2;
    }

    public VideoParticipant getParticipant(String uid) {
        return video_participants.get(uid);
    }

    // all that's known is "my" id, so use it to get the other/remote participant
    public VideoParticipant getRemoteParticipant(String myId) {
        String remoteId = getRemoteParticipantUid(myId);
        if(remoteId == null) return null;
        return video_participants.get(remoteId);
    }

    private String getRemoteParticipantUid(String myId) {
        for(String id : video_participants.keySet()) {
            if(id.equals(myId)) continue;
            else return id;
        }
        return null;
    }
}
