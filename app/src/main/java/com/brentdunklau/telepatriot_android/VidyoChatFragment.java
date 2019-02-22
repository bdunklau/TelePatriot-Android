package com.brentdunklau.telepatriot_android;

import android.Manifest;
import android.app.Activity;
import android.app.Fragment;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.FragmentActivity;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.support.v7.widget.SwitchCompat;
import android.util.DisplayMetrics;
import android.util.Log;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ToggleButton;

import com.brentdunklau.telepatriot_android.util.AccountStatusEvent;
import com.brentdunklau.telepatriot_android.util.CameraCapturerCompat;
import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.Util;
import com.brentdunklau.telepatriot_android.util.VideoEvent;
import com.brentdunklau.telepatriot_android.util.VideoNode;
import com.brentdunklau.telepatriot_android.util.VideoParticipant;
import com.brentdunklau.telepatriot_android.util.VideoType;
import com.firebase.ui.auth.AuthUI;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.twilio.video.AudioCodec;
import com.twilio.video.AudioOptions;
import com.twilio.video.CameraCapturer;
import com.twilio.video.ConnectOptions;
import com.twilio.video.EncodingParameters;
import com.twilio.video.G722Codec;
import com.twilio.video.H264Codec;
import com.twilio.video.IsacCodec;
import com.twilio.video.LocalAudioTrack;
import com.twilio.video.LocalParticipant;
import com.twilio.video.LocalVideoTrack;
import com.twilio.video.OpusCodec;
import com.twilio.video.PcmaCodec;
import com.twilio.video.PcmuCodec;
import com.twilio.video.RemoteAudioTrack;
import com.twilio.video.RemoteAudioTrackPublication;
import com.twilio.video.RemoteDataTrack;
import com.twilio.video.RemoteDataTrackPublication;
import com.twilio.video.RemoteParticipant;
import com.twilio.video.RemoteVideoTrack;
import com.twilio.video.RemoteVideoTrackPublication;
import com.twilio.video.Room;
import com.twilio.video.RoomState;
import com.twilio.video.TwilioException;
import com.twilio.video.Video;
import com.twilio.video.VideoCapturer;
import com.twilio.video.VideoCodec;
import com.twilio.video.VideoRenderer;
import com.twilio.video.VideoTrack;
import com.twilio.video.VideoView;
import com.twilio.video.Vp8Codec;
import com.twilio.video.Vp9Codec;


public class VidyoChatFragment extends BaseFragment
{

    private static String TAG = "VidyoChatFragment";
    // ref  https://stackoverflow.com/a/19162753/2570305
    public final static String FRAGMENT_TAG = BuildConfig.APPLICATION_ID+"."+TAG;

//     Helps check whether app has permission to access what is declared in its manifest.
//     - Permissions from app's manifest that have a "protection level" of "dangerous".
//    private static final String[] mPermissions = new String[] {
//            Manifest.permission.CAMERA,
//            Manifest.permission.RECORD_AUDIO,
//            Manifest.permission.WRITE_EXTERNAL_STORAGE
//    };
//    // - This arbitrary, app-internal constant represents a group of requested permissions.
//    // - For simplicity, this app treats all desired permissions as part of a single group.
//    private final int PERMISSIONS_REQUEST_ALL = 1988;

    private TextView record_label;
    private VideoView local_camera_view;

    private VideoView remote_camera_view;
    private boolean remoteCameraVisible;
    private TextView invite_someone_button, guest_name, revoke_invitation_button;

    private boolean mCameraPrivacy = false;
    private boolean mMicrophonePrivacy = false;
    private View myView;
    private String uid;
    private Integer videoTypeKey;
    //private String room_id; // the video_node_key
    private TextView video_mission_description;
    private TextView choose_legislator;
    private TextView edit_video_title_button;
    private TextView video_title;
    private TextView edit_video_mission_description_button;
    private TextView edit_youtube_video_description_button;
    private TextView youtube_video_description;
    private VideoNode currentVideoNode;

    private TextView recording_indicator; // the red "Recording..." label
    private ToggleButton connect_button;
    private ToggleButton microphone_button;
    private ToggleButton record_button;
    private ToggleButton publish_button;
    private ProgressBar progressBar5;

    private TextView legislator_first_name, legislator_last_name, legislator_state_abbrev, legislator_chamber, legislator_district;
    // put the Choose TextView "link" here
    private TextView legislator_facebook;
    private ImageView edit_facebook;
    private TextView legislator_twitter;
    private ImageView edit_twitter;

    private SwitchCompat email_to_legislator;
    private SwitchCompat post_to_facebook;
    private SwitchCompat post_to_twitter;

    private ImageView youtube_status;
    private ImageView facebook_status;
    private ImageView twitter_status;
    private ImageView emailed_to_legislator_status;
    private ImageView emailed_to_participant_status;

    private ProgressBar video_chat_spinner;


    /*
     *  Operating System Events
     */

    @Nullable
    @Override
    public View onCreateView (LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState){
        myView = inflater.inflate(R.layout.vidyo_chat_fragment,container,false);

        this.getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);

        /*
         * Get shared preferences to read settings
         */
        preferences = PreferenceManager.getDefaultSharedPreferences(getActivity());

        /*
         * Enable changing the volume using the up/down keys during a conversation
         */
        getActivity().setVolumeControlStream(AudioManager.STREAM_VOICE_CALL);

        /*
         * Needed for setting/abandoning audio focus during call
         */
        audioManager = (AudioManager)(getActivity().getSystemService(Context.AUDIO_SERVICE));
        audioManager.setSpeakerphoneOn(true);

        record_label = myView.findViewById(R.id.record_label);
        record_label.setText("");
        local_camera_view = myView.findViewById(R.id.local_camera_view);
        remote_camera_view = myView.findViewById(R.id.remote_camera_view);

        TypedValue tv = new TypedValue();
        float actionBarHeight = 0.0f;
        if(getActivity().getTheme().resolveAttribute(android.R.attr.actionBarSize, tv, true)) {
            actionBarHeight = TypedValue.complexToDimension(tv.data, getResources().getDisplayMetrics());
        }
        DisplayMetrics dm = new DisplayMetrics();
        getActivity().getWindowManager().getDefaultDisplay().getMetrics(dm);
        float availableHeight = dm.heightPixels - actionBarHeight;
        local_camera_view.getLayoutParams().height = (int)(availableHeight / 2);
        local_camera_view.getLayoutParams().width = local_camera_view.getLayoutParams().height * 16 / 9;
        remote_camera_view.getLayoutParams().height = (int)(availableHeight / 2);
        remote_camera_view.getLayoutParams().width = remote_camera_view.getLayoutParams().height * 16 / 9;


        /*
         * Check camera and microphone permissions. Needed in Android M.
         */
        if (!checkPermissionForCameraAndMicrophone()) {
            requestPermissionForCameraAndMicrophone();
        } else {
            createAudioAndVideoTracks();
        }

        List<VideoType> videoTypes = VideoType.getTypes();

        invite_someone_button = myView.findViewById(R.id.invite_someone_button);
        invite_someone_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                inviteSomeone();
            }
        });

        guest_name = myView.findViewById(R.id.guest_name);
        revoke_invitation_button = myView.findViewById(R.id.revoke_invitation_button);
        revoke_invitation_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                revokeInvitation();
            }
        });

        ////////////////////////////////////////////////////////////////////////////
        // Legislator section
        // reference the Legislator Choose button here
        legislator_first_name = myView.findViewById(R.id.legislator_first_name);
        legislator_last_name = myView.findViewById(R.id.legislator_last_name);
        legislator_state_abbrev = myView.findViewById(R.id.legislator_state_abbrev);
        legislator_chamber = myView.findViewById(R.id.legislator_chamber);
        legislator_district = myView.findViewById(R.id.legislator_district);
        legislator_facebook = myView.findViewById(R.id.legislator_facebook);
        legislator_facebook.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent facebookIntent = new Intent(Intent.ACTION_VIEW);
                String facebookUrl = getFacebookPageURL(myView.getContext(), legislator_facebook.getText()+"");
                facebookIntent.setData(Uri.parse(facebookUrl));
                startActivity(facebookIntent);
            }
        });

        edit_facebook = myView.findViewById(R.id.edit_facebook);
        legislator_twitter = myView.findViewById(R.id.legislator_twitter);
        legislator_twitter.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String tw = legislator_twitter.getText()+"";
                if(tw.startsWith("TW: @"))
                    tw = tw.substring("TW: @".length()).trim();
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("twitter://user?screen_name=" + tw)));
                }catch (Exception e) {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://twitter.com/" + tw)));
                }
            }
        });

        edit_twitter = myView.findViewById(R.id.edit_twitter);
        edit_facebook.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // pop up a dialog with a field allowing you to set facebook handle
                dlg(currentVideoNode, "legislator_facebook",
                        currentVideoNode.getLegislator_facebook(), legislator_facebook,
                        "Facebook Handle");
            }
        });
        edit_twitter.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // pop up a dialog with a field allowing you to set twitter handle
                dlg(currentVideoNode, "legislator_twitter",
                        currentVideoNode.getLegislator_twitter(), legislator_twitter,
                        "Twitter Handle");
            }
        });




        //TODO make dynamic mission keys
        VideoType videoType = videoTypes.get(0); // TODO how are we going to choose different video types?
        videoTypeKey = videoType.getKey();
        uid =  User.getInstance().getUid();

        video_mission_description = myView.findViewById(R.id.videoChatDescriptionText);
        video_mission_description.setText(videoType.getVideo_mission_description());
        //repNameEdit = myView.findViewById(R.id.repNameEdit);
        choose_legislator = myView.findViewById(R.id.choose_legislator);
        choose_legislator.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                chooseLegislator();
            }
        });

//        mFBButton = myView.findViewById(R.id.fbEdit);
//        //mFBEdit = myView.findViewById(R.id.fbRepEdit);
//        mFBButton.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View v) {
//                setFBInfo();
//            }
//        });
//        //mTwitterEdit = myView.findViewById(R.id.twitterInfoEdit);
//        //mTwitterButton = myView.findViewById(R.id.twitterEdit);
//        mTwitterButton.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View v) {
//                setTwitterInfo();
//            }
//        });

        video_title = myView.findViewById(R.id.video_title);
        edit_video_title_button = myView.findViewById(R.id.edit_video_title_button);
        edit_video_title_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                editYoutubeVideoTitle();
            }
        });

        edit_video_mission_description_button = myView.findViewById(R.id.edit_video_mission_description_button);
        edit_video_mission_description_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                editVideoMissionDescription();
            }
        });

        youtube_video_description = myView.findViewById(R.id.youtube_video_description);
        //mYouTubeEditText = myView.findViewById(R.id.editYoutubeVideoDescription);
        edit_youtube_video_description_button = myView.findViewById(R.id.edit_youtube_video_description_button);
        edit_youtube_video_description_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                editYoutubeVideoDescription();
            }
        });


        // Set the onClick listeners for the buttons
        connect_button = myView.findViewById(R.id.connect_button);
        connect_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                connectionClicked();
            }
        });
        microphone_button = myView.findViewById(R.id.microphone_button);
        microphone_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mMicrophonePrivacy = microphone_button.isChecked();
                if(localAudioTrack != null)
                    localAudioTrack.enable(!localAudioTrack.isEnabled());
            }
        });

        microphone_button.setVisibility(View.GONE); // visibility is controlled in doConnect() and doDisconnect()
//        camera_button = myView.findViewById(R.id.camera_button);
//        camera_button.setOnClickListener(this);

        video_chat_spinner = myView.findViewById(R.id.video_chat_spinner);

        queryCurrentVideoNode();

        record_button = myView.findViewById(R.id.record_button);
        record_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                recordClicked();
            }
        });

        publish_button = myView.findViewById(R.id.publish_button);
        publish_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                publishClicked();
            }
        });


        email_to_legislator = myView.findViewById(R.id.email_to_legislator);
        email_to_legislator.setSwitchPadding(50);
        email_to_legislator.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean b) {
                setVideoNodeAttribute("email_to_legislator", b);
            }
        });

        post_to_facebook = myView.findViewById(R.id.post_to_facebook);
        post_to_facebook.setSwitchPadding(50);
        post_to_facebook.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean b) {
                setVideoNodeAttribute("post_to_facebook", b);
            }
        });

        post_to_twitter = myView.findViewById(R.id.post_to_twitter);
        post_to_twitter.setSwitchPadding(50);
        post_to_twitter.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean b) {
                setVideoNodeAttribute("post_to_twitter", b);
            }
        });

        youtube_status = myView.findViewById(R.id.youtube_status);
        facebook_status = myView.findViewById(R.id.facebook_status);
        twitter_status = myView.findViewById(R.id.twitter_status);
        emailed_to_legislator_status = myView.findViewById(R.id.emailed_to_legislator_status);
        emailed_to_participant_status = myView.findViewById(R.id.emailed_to_participant_status);

        /*
         * Set the initial state of the UI
         */
        //initializeUI();

        return myView;
    }


    /*
     * Audio and video tracks can be created with names. This feature is useful for categorizing
     * tracks of participants. For example, if one participant publishes a video track with
     * ScreenCapturer and CameraCapturer with the names "screen" and "camera" respectively then
     * other participants can use RemoteVideoTrack#getName to determine which video track is
     * produced from the other participant's screen or camera.
     */
    private static final String LOCAL_AUDIO_TRACK_NAME = "mic";
    private static final String LOCAL_VIDEO_TRACK_NAME = "camera";

    private CameraCapturerCompat cameraCapturerCompat;
    private LocalAudioTrack localAudioTrack;
    private LocalVideoTrack localVideoTrack;
    //private VideoRenderer localVideoView;
    private boolean previousMicrophoneMute;
    private boolean disconnectedFromOnDestroy;
    private LocalParticipant localParticipant;
    private String remoteParticipantIdentity;
    private AudioManager audioManager;

    /*
     * Android shared preferences used for settings
     */
    private SharedPreferences preferences;

    private static final String PREF_AUDIO_CODEC = "audio_codec";
    private static final String PREF_AUDIO_CODEC_DEFAULT = OpusCodec.NAME;
    private static final String PREF_VIDEO_CODEC = "video_codec";
    private static final String PREF_VIDEO_CODEC_DEFAULT = Vp8Codec.NAME;
    private static final String PREF_SENDER_MAX_AUDIO_BITRATE = "sender_max_audio_bitrate";
    private static final String PREF_SENDER_MAX_AUDIO_BITRATE_DEFAULT = "0";
    private static final String PREF_SENDER_MAX_VIDEO_BITRATE = "sender_max_video_bitrate";
    private static final String PREF_SENDER_MAX_VIDEO_BITRATE_DEFAULT = "0";
    private static final String PREF_VP8_SIMULCAST = "vp8_simulcast";
    private static final boolean PREF_VP8_SIMULCAST_DEFAULT = false;
    private static final int CAMERA_MIC_PERMISSION_REQUEST_CODE = 1;

    /*
     * A Room represents communication between a local participant and one or more participants.
     */
    private Room room;

    /*
     * AudioCodec and VideoCodec represent the preferred codec for encoding and decoding audio and
     * video.
     */
    private AudioCodec audioCodec;
    private VideoCodec videoCodec;

    /*
     * Encoding parameters represent the sender side bandwidth constraints.
     */
    private EncodingParameters encodingParameters;
    private int previousAudioMode;


    private boolean checkPermissionForCameraAndMicrophone(){
        int resultCamera = ContextCompat.checkSelfPermission(getActivity(), Manifest.permission.CAMERA);
        int resultMic = ContextCompat.checkSelfPermission(getActivity(), Manifest.permission.RECORD_AUDIO);
        return resultCamera == PackageManager.PERMISSION_GRANTED &&
                resultMic == PackageManager.PERMISSION_GRANTED;
    }

    private void requestPermissionForCameraAndMicrophone(){
        if (ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.CAMERA) ||
                ActivityCompat.shouldShowRequestPermissionRationale(getActivity(),
                        Manifest.permission.RECORD_AUDIO)) {
            Toast.makeText(getActivity(),
                    R.string.permissions_needed,
                    Toast.LENGTH_LONG).show();
        } else {
            ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[]{Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO},
                    CAMERA_MIC_PERMISSION_REQUEST_CODE);
        }
    }


//    @Override
//    public boolean onOptionsItemSelected(MenuItem item) {
//        Log.i(TAG, "onOptionsItemSelected(): ARE WE GOING TO HAVE AN OPTIONS MENU?");
//        switch (item.getItemId()) {
//            case R.id.menu_settings:
//                startActivity(new Intent(this, SettingsActivity.class));
//                return true;
//            case R.id.speaker_menu_item:
//                if (audioManager.isSpeakerphoneOn()) {
//                    audioManager.setSpeakerphoneOn(false);
//                    item.setIcon(ic_phonelink_ring_white_24dp);
//                } else {
//                    audioManager.setSpeakerphoneOn(true);
//                    item.setIcon(ic_volume_up_white_24dp);
//                }
//                return true;
//            default:
//                return false;
//        }
//    }

    private LocalAudioTrack createLocalAudioTrack() {
        // Share your microphone
        AudioOptions.Builder builder = new AudioOptions.Builder();
        AudioOptions options = builder.echoCancellation(true).autoGainControl(true).highpassFilter(true).noiseSuppression(true).build();
        LocalAudioTrack at = LocalAudioTrack.create(getActivity(), true, options, LOCAL_AUDIO_TRACK_NAME);
//                localAudioTrack = LocalAudioTrack.create(getActivity(), true, LOCAL_AUDIO_TRACK_NAME);
        return at;
    }

    private void createAudioAndVideoTracks() {
        // Share your microphone
        localAudioTrack = createLocalAudioTrack();

        // Share your camera
        cameraCapturerCompat = new CameraCapturerCompat(getActivity(), getAvailableCameraSource());
        Activity a = getActivity();
        VideoCapturer vc = cameraCapturerCompat.getVideoCapturer();
        localVideoTrack = LocalVideoTrack.create(a,true, vc, LOCAL_VIDEO_TRACK_NAME);
        local_camera_view.setMirror(true);
        localVideoTrack.addRenderer(local_camera_view);
    }

    private CameraCapturer.CameraSource getAvailableCameraSource() {
        return (CameraCapturer.isSourceAvailable(CameraCapturer.CameraSource.FRONT_CAMERA)) ?
                (CameraCapturer.CameraSource.FRONT_CAMERA) :
                (CameraCapturer.CameraSource.BACK_CAMERA);
    }

    /*
     * Room events listener
     */
    private Room.Listener roomListener() {
        return new Room.Listener() {
            @Override
            public void onConnected(Room room) {
                localParticipant = room.getLocalParticipant();
                //videoStatusTextView.setText("Connected to " + room.getName()); // maybe change the text to say WHO we're connected to
                //setTitle(room.getName()); // don't think we care about the room name

                for (RemoteParticipant remoteParticipant : room.getRemoteParticipants()) {
                    addRemoteParticipant(remoteParticipant);
                    break;
                }
            }

            @Override
            public void onConnectFailure(Room room, TwilioException e) {
                //videoStatusTextView.setText("Failed to connect"); // do we want to add this extra attribute to the UI?
                configureAudio(false);
                //initializeUI();
            }

            @Override
            public void onDisconnected(Room room, TwilioException e) {
                localParticipant = null;
//                videoStatusTextView.setText("Disconnected from " + room.getName()); // do we want to add this extra attribute to the UI?
                VidyoChatFragment.this.room = null;
                // Only reinitialize the UI if disconnect was not called from onDestroy()
                if (!disconnectedFromOnDestroy) {
                    configureAudio(false);
                    //initializeUI();
                    //moveLocalVideoToPrimaryView();
                }
            }

            @Override
            public void onParticipantConnected(Room room, RemoteParticipant remoteParticipant) {
                addRemoteParticipant(remoteParticipant);

            }

            @Override
            public void onParticipantDisconnected(Room room, RemoteParticipant remoteParticipant) {
                removeRemoteParticipant(remoteParticipant);
            }

            @Override
            public void onRecordingStarted(Room room) {
                /*
                 * Indicates when media shared to a Room is being recorded. Note that
                 * recording is only available in our Group Rooms developer preview.
                 */
                Log.d(TAG, "onRecordingStarted");
            }

            @Override
            public void onRecordingStopped(Room room) {
                /*
                 * Indicates when media shared to a Room is no longer being recorded. Note that
                 * recording is only available in our Group Rooms developer preview.
                 */
                Log.d(TAG, "onRecordingStopped");
            }
        };
    }

    /*
     * Get the preferred audio codec from shared preferences
     */
    private AudioCodec getAudioCodecPreference(String key, String defaultValue) {
        final String audioCodecName = preferences.getString(key, defaultValue);

        switch (audioCodecName) {
            case IsacCodec.NAME:
                return new IsacCodec();
            case OpusCodec.NAME:
                return new OpusCodec();
            case PcmaCodec.NAME:
                return new PcmaCodec();
            case PcmuCodec.NAME:
                return new PcmuCodec();
            case G722Codec.NAME:
                return new G722Codec();
            default:
                return new OpusCodec();
        }
    }

    /*
     * Get the preferred video codec from shared preferences
     */
    private VideoCodec getVideoCodecPreference(String key, String defaultValue) {
        final String videoCodecName = preferences.getString(key, defaultValue);

        switch (videoCodecName) {
            // TODO what are we going to do about these default values?
            case Vp8Codec.NAME:
                Log.i(TAG, "getVideoCodecPreference(): THESE DEFAULT VALUES ARE PROBABLY NOT RIGHT");
                boolean simulcast = preferences.getBoolean(/*SettingsActivity.*/PREF_VP8_SIMULCAST,
                        /*SettingsActivity.*/PREF_VP8_SIMULCAST_DEFAULT);
                return new Vp8Codec(simulcast);
            case H264Codec.NAME:
                return new H264Codec();
            case Vp9Codec.NAME:
                return new Vp9Codec();
            default:
                return new Vp8Codec();
        }
    }

    private EncodingParameters getEncodingParameters() {
        // TODO what are we going to do about these default values?
        Log.i(TAG, "getEncodingParameters(): THESE DEFAULT VALUES ARE PROBABLY NOT RIGHT");
        final int maxAudioBitrate = Integer.parseInt(
                preferences.getString(/*SettingsActivity.*/PREF_SENDER_MAX_AUDIO_BITRATE,
                        /*SettingsActivity.*/PREF_SENDER_MAX_AUDIO_BITRATE_DEFAULT));
        final int maxVideoBitrate = Integer.parseInt(
                preferences.getString(/*SettingsActivity.*/PREF_SENDER_MAX_VIDEO_BITRATE,
                        /*SettingsActivity.*/PREF_SENDER_MAX_VIDEO_BITRATE_DEFAULT));

        return new EncodingParameters(maxAudioBitrate, maxVideoBitrate);
    }

    /*
     * The actions performed during disconnect.
     */
    private void setDisconnectAction() {
        Log.i(TAG, "setDisconnectAction(): ALL COMMENTED OUT - THIS IS WHERE THE SAMPLE PROJECT DID STUFF WITH THE BUTTONS");
//        connectActionFab.setImageDrawable(ContextCompat.getDrawable(this,
//                R.drawable.ic_call_end_white_24px));
//        connectActionFab.show();
//        connectActionFab.setOnClickListener(disconnectClickListener());
    }

    private void configureAudio(boolean enable) {
        if (enable) {
            previousAudioMode = audioManager.getMode();
            // Request audio focus before making any device switch
            requestAudioFocus();
            /*
             * Use MODE_IN_COMMUNICATION as the default audio mode. It is required
             * to be in this mode when playout and/or recording starts for the best
             * possible VoIP performance. Some devices have difficulties with
             * speaker mode if this is not set.
             */
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            /*
             * Always disable microphone mute during a WebRTC call.
             */
            previousMicrophoneMute = audioManager.isMicrophoneMute();
            audioManager.setMicrophoneMute(false);
        } else {
            audioManager.setMode(previousAudioMode);
            audioManager.abandonAudioFocus(null);
            audioManager.setMicrophoneMute(previousMicrophoneMute);
        }
    }

    private void requestAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes playbackAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build();
            AudioFocusRequest focusRequest =
                    new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                            .setAudioAttributes(playbackAttributes)
                            .setAcceptsDelayedFocusGain(true)
                            .setOnAudioFocusChangeListener(
                                    new AudioManager.OnAudioFocusChangeListener() {
                                        @Override
                                        public void onAudioFocusChange(int i) { }
                                    })
                            .build();
            audioManager.requestAudioFocus(focusRequest);
        } else {
            audioManager.requestAudioFocus(null, AudioManager.STREAM_VOICE_CALL,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
        }
    }

    @Override
    public  void onResume() {
        super.onResume();

        this.getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);

        /*
         * Update preferred audio and video codec in case changed in settings
         */
        Log.i(TAG, "onResume():  ARE THESE DEFAULT CODEC VALUES OK?");
        audioCodec = getAudioCodecPreference(/*SettingsActivity.*/PREF_AUDIO_CODEC,
                /*SettingsActivity.*/PREF_AUDIO_CODEC_DEFAULT);
        videoCodec = getVideoCodecPreference(/*SettingsActivity.*/PREF_VIDEO_CODEC,
                /*SettingsActivity.*/PREF_VIDEO_CODEC_DEFAULT);

        /*
         * Get latest encoding parameters
         */
        final EncodingParameters newEncodingParameters = getEncodingParameters();


        /*
         * If the local video track was released when the app was put in the background, recreate.
         */
        if (localVideoTrack == null && checkPermissionForCameraAndMicrophone()) {

            local_camera_view.setMirror(true);

            if(localAudioTrack == null) {
                // Share your microphone
                localAudioTrack = createLocalAudioTrack();
            }

            if(cameraCapturerCompat == null) {
                // Share your camera
                cameraCapturerCompat = new CameraCapturerCompat(getActivity(), getAvailableCameraSource());
            }
            VideoCapturer vc = cameraCapturerCompat.getVideoCapturer();
            Activity a = getActivity();
            localVideoTrack = LocalVideoTrack.create(a,true, vc, LOCAL_VIDEO_TRACK_NAME);

            localVideoTrack = LocalVideoTrack.create(getActivity(),
                    true,
                    cameraCapturerCompat.getVideoCapturer(),
                    LOCAL_VIDEO_TRACK_NAME);
            localVideoTrack.addRenderer(local_camera_view);

            /*
             * If connected to a Room then share the local video track.
             */
            if (localParticipant != null) {
                localParticipant.publishTrack(localVideoTrack);

                /*
                 * Update encoding parameters if they have changed.
                 */
                if (!newEncodingParameters.equals(encodingParameters)) {
                    localParticipant.setEncodingParameters(newEncodingParameters);
                }
            }
        }

        /*
         * Update encoding parameters
         */
        encodingParameters = newEncodingParameters;
    }

    @Override
    public void onPause() {
        this.getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        /*
         * Release the local video track before going in the background. This ensures that the
         * camera can be used by other applications while this app is in the background.
         */
        if (localVideoTrack != null) {
            /*
             * If this local video track is being shared in a Room, unpublish from room before
             * releasing the video track. Participants will be notified that the track has been
             * unpublished.
             */
            if (localParticipant != null) {
                localParticipant.unpublishTrack(localVideoTrack);
            }

            localVideoTrack.release();
            localVideoTrack = null;
        }
        super.onPause();
    }

    @Override
    public void onDestroy() {
        /*
         * Always disconnect from the room before leaving the Activity to
         * ensure any memory allocated to the Room resource is freed.
         */
        if (room != null && room.getState() != RoomState.DISCONNECTED) {
            room.disconnect();
            disconnectedFromOnDestroy = true;
        }

        /*
         * Release the local audio and video tracks ensuring any memory allocated to audio
         * or video is freed.
         */
        if (localAudioTrack != null) {
            localAudioTrack.release();
            localAudioTrack = null;
        }
        if (localVideoTrack != null) {
            localVideoTrack.release();
            localVideoTrack = null;
        }

        super.onDestroy();
    }

    /*
     * Called when remote participant joins the room
     */
    private void addRemoteParticipant(RemoteParticipant remoteParticipant) {
        remoteParticipantIdentity = remoteParticipant.getIdentity();

        // remove the invitation links and text
        // remove the invitation links and text
        remoteCameraVisible = true;
        inviteLinks();

        /*
         * Add remote participant renderer
         */
        if (remoteParticipant.getRemoteVideoTracks().size() > 0) {
            RemoteVideoTrackPublication remoteVideoTrackPublication =
                    remoteParticipant.getRemoteVideoTracks().get(0);

            /*
             * Only render video tracks that are subscribed to
             */
            if (remoteVideoTrackPublication.isTrackSubscribed()) {
                addRemoteParticipantVideo(remoteVideoTrackPublication.getRemoteVideoTrack());
            }
        }

        /*
         * Start listening for participant events
         */
        remoteParticipant.setListener(remoteParticipantListener());
    }

    private RemoteParticipant.Listener remoteParticipantListener() {
        return new RemoteParticipant.Listener() {
            @Override
            public void onAudioTrackPublished(RemoteParticipant remoteParticipant,
                                              RemoteAudioTrackPublication remoteAudioTrackPublication) {
                Log.i(TAG, String.format("onAudioTrackPublished: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteAudioTrackPublication: sid=%s, enabled=%b, " +
                                "subscribed=%b, name=%s]",
                        remoteParticipant.getIdentity(),
                        remoteAudioTrackPublication.getTrackSid(),
                        remoteAudioTrackPublication.isTrackEnabled(),
                        remoteAudioTrackPublication.isTrackSubscribed(),
                        remoteAudioTrackPublication.getTrackName()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onAudioTrackPublished");
            }

            @Override
            public void onAudioTrackUnpublished(RemoteParticipant remoteParticipant,
                                                RemoteAudioTrackPublication remoteAudioTrackPublication) {
                Log.i(TAG, String.format("onAudioTrackUnpublished: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteAudioTrackPublication: sid=%s, enabled=%b, " +
                                "subscribed=%b, name=%s]",
                        remoteParticipant.getIdentity(),
                        remoteAudioTrackPublication.getTrackSid(),
                        remoteAudioTrackPublication.isTrackEnabled(),
                        remoteAudioTrackPublication.isTrackSubscribed(),
                        remoteAudioTrackPublication.getTrackName()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onAudioTrackUnpublished");
            }

            @Override
            public void onDataTrackPublished(RemoteParticipant remoteParticipant,
                                             RemoteDataTrackPublication remoteDataTrackPublication) {
                Log.i(TAG, String.format("onDataTrackPublished: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteDataTrackPublication: sid=%s, enabled=%b, " +
                                "subscribed=%b, name=%s]",
                        remoteParticipant.getIdentity(),
                        remoteDataTrackPublication.getTrackSid(),
                        remoteDataTrackPublication.isTrackEnabled(),
                        remoteDataTrackPublication.isTrackSubscribed(),
                        remoteDataTrackPublication.getTrackName()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onDataTrackPublished");
            }

            @Override
            public void onDataTrackUnpublished(RemoteParticipant remoteParticipant,
                                               RemoteDataTrackPublication remoteDataTrackPublication) {
                Log.i(TAG, String.format("onDataTrackUnpublished: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteDataTrackPublication: sid=%s, enabled=%b, " +
                                "subscribed=%b, name=%s]",
                        remoteParticipant.getIdentity(),
                        remoteDataTrackPublication.getTrackSid(),
                        remoteDataTrackPublication.isTrackEnabled(),
                        remoteDataTrackPublication.isTrackSubscribed(),
                        remoteDataTrackPublication.getTrackName()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onDataTrackUnpublished");
            }

            @Override
            public void onVideoTrackPublished(RemoteParticipant remoteParticipant,
                                              RemoteVideoTrackPublication remoteVideoTrackPublication) {
                Log.i(TAG, String.format("onVideoTrackPublished: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteVideoTrackPublication: sid=%s, enabled=%b, " +
                                "subscribed=%b, name=%s]",
                        remoteParticipant.getIdentity(),
                        remoteVideoTrackPublication.getTrackSid(),
                        remoteVideoTrackPublication.isTrackEnabled(),
                        remoteVideoTrackPublication.isTrackSubscribed(),
                        remoteVideoTrackPublication.getTrackName()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onVideoTrackPublished");
            }

            @Override
            public void onVideoTrackUnpublished(RemoteParticipant remoteParticipant,
                                                RemoteVideoTrackPublication remoteVideoTrackPublication) {
                Log.i(TAG, String.format("onVideoTrackUnpublished: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteVideoTrackPublication: sid=%s, enabled=%b, " +
                                "subscribed=%b, name=%s]",
                        remoteParticipant.getIdentity(),
                        remoteVideoTrackPublication.getTrackSid(),
                        remoteVideoTrackPublication.isTrackEnabled(),
                        remoteVideoTrackPublication.isTrackSubscribed(),
                        remoteVideoTrackPublication.getTrackName()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onVideoTrackUnpublished");
            }

            @Override
            public void onAudioTrackSubscribed(RemoteParticipant remoteParticipant,
                                               RemoteAudioTrackPublication remoteAudioTrackPublication,
                                               RemoteAudioTrack remoteAudioTrack) {
                Log.i(TAG, String.format("onAudioTrackSubscribed: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteAudioTrack: enabled=%b, playbackEnabled=%b, name=%s]",
                        remoteParticipant.getIdentity(),
                        remoteAudioTrack.isEnabled(),
                        remoteAudioTrack.isPlaybackEnabled(),
                        remoteAudioTrack.getName()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onAudioTrackSubscribed");
            }

            @Override
            public void onAudioTrackUnsubscribed(RemoteParticipant remoteParticipant,
                                                 RemoteAudioTrackPublication remoteAudioTrackPublication,
                                                 RemoteAudioTrack remoteAudioTrack) {
                Log.i(TAG, String.format("onAudioTrackUnsubscribed: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteAudioTrack: enabled=%b, playbackEnabled=%b, name=%s]",
                        remoteParticipant.getIdentity(),
                        remoteAudioTrack.isEnabled(),
                        remoteAudioTrack.isPlaybackEnabled(),
                        remoteAudioTrack.getName()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onAudioTrackUnsubscribed");
            }

            @Override
            public void onAudioTrackSubscriptionFailed(RemoteParticipant remoteParticipant,
                                                       RemoteAudioTrackPublication remoteAudioTrackPublication,
                                                       TwilioException twilioException) {
                Log.i(TAG, String.format("onAudioTrackSubscriptionFailed: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteAudioTrackPublication: sid=%b, name=%s]" +
                                "[TwilioException: code=%d, message=%s]",
                        remoteParticipant.getIdentity(),
                        remoteAudioTrackPublication.getTrackSid(),
                        remoteAudioTrackPublication.getTrackName(),
                        twilioException.getCode(),
                        twilioException.getMessage()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onAudioTrackSubscriptionFailed");
            }

            @Override
            public void onDataTrackSubscribed(RemoteParticipant remoteParticipant,
                                              RemoteDataTrackPublication remoteDataTrackPublication,
                                              RemoteDataTrack remoteDataTrack) {
                Log.i(TAG, String.format("onDataTrackSubscribed: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteDataTrack: enabled=%b, name=%s]",
                        remoteParticipant.getIdentity(),
                        remoteDataTrack.isEnabled(),
                        remoteDataTrack.getName()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onDataTrackSubscribed");
            }

            @Override
            public void onDataTrackUnsubscribed(RemoteParticipant remoteParticipant,
                                                RemoteDataTrackPublication remoteDataTrackPublication,
                                                RemoteDataTrack remoteDataTrack) {
                Log.i(TAG, String.format("onDataTrackUnsubscribed: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteDataTrack: enabled=%b, name=%s]",
                        remoteParticipant.getIdentity(),
                        remoteDataTrack.isEnabled(),
                        remoteDataTrack.getName()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onDataTrackUnsubscribed");
            }

            @Override
            public void onDataTrackSubscriptionFailed(RemoteParticipant remoteParticipant,
                                                      RemoteDataTrackPublication remoteDataTrackPublication,
                                                      TwilioException twilioException) {
                Log.i(TAG, String.format("onDataTrackSubscriptionFailed: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteDataTrackPublication: sid=%b, name=%s]" +
                                "[TwilioException: code=%d, message=%s]",
                        remoteParticipant.getIdentity(),
                        remoteDataTrackPublication.getTrackSid(),
                        remoteDataTrackPublication.getTrackName(),
                        twilioException.getCode(),
                        twilioException.getMessage()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onDataTrackSubscriptionFailed");
            }

            @Override
            public void onVideoTrackSubscribed(RemoteParticipant remoteParticipant,
                                               RemoteVideoTrackPublication remoteVideoTrackPublication,
                                               RemoteVideoTrack remoteVideoTrack) {
                Log.i(TAG, String.format("onVideoTrackSubscribed: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteVideoTrack: enabled=%b, name=%s]",
                        remoteParticipant.getIdentity(),
                        remoteVideoTrack.isEnabled(),
                        remoteVideoTrack.getName()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onVideoTrackSubscribed");
                addRemoteParticipantVideo(remoteVideoTrack);
            }

            @Override
            public void onVideoTrackUnsubscribed(RemoteParticipant remoteParticipant,
                                                 RemoteVideoTrackPublication remoteVideoTrackPublication,
                                                 RemoteVideoTrack remoteVideoTrack) {
                Log.i(TAG, String.format("onVideoTrackUnsubscribed: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteVideoTrack: enabled=%b, name=%s]",
                        remoteParticipant.getIdentity(),
                        remoteVideoTrack.isEnabled(),
                        remoteVideoTrack.getName()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onVideoTrackUnsubscribed");
                removeParticipantVideo(remoteVideoTrack);
            }

            @Override
            public void onVideoTrackSubscriptionFailed(RemoteParticipant remoteParticipant,
                                                       RemoteVideoTrackPublication remoteVideoTrackPublication,
                                                       TwilioException twilioException) {
                Log.i(TAG, String.format("onVideoTrackSubscriptionFailed: " +
                                "[RemoteParticipant: identity=%s], " +
                                "[RemoteVideoTrackPublication: sid=%b, name=%s]" +
                                "[TwilioException: code=%d, message=%s]",
                        remoteParticipant.getIdentity(),
                        remoteVideoTrackPublication.getTrackSid(),
                        remoteVideoTrackPublication.getTrackName(),
                        twilioException.getCode(),
                        twilioException.getMessage()));

                // TODO Are we going to display these status messages?
//                videoStatusTextView.setText("onVideoTrackSubscriptionFailed");

                // TODO what about this?...
//                Snackbar.make(connectActionFab,
//                        String.format("Failed to subscribe to %s video track",
//                                remoteParticipant.getIdentity()),
//                        Snackbar.LENGTH_LONG)
//                        .show();
            }

            @Override
            public void onAudioTrackEnabled(RemoteParticipant remoteParticipant,
                                            RemoteAudioTrackPublication remoteAudioTrackPublication) {

            }

            @Override
            public void onAudioTrackDisabled(RemoteParticipant remoteParticipant,
                                             RemoteAudioTrackPublication remoteAudioTrackPublication) {

            }

            @Override
            public void onVideoTrackEnabled(RemoteParticipant remoteParticipant,
                                            RemoteVideoTrackPublication remoteVideoTrackPublication) {

            }

            @Override
            public void onVideoTrackDisabled(RemoteParticipant remoteParticipant,
                                             RemoteVideoTrackPublication remoteVideoTrackPublication) {

            }
        };
    }

    private void removeParticipantVideo(VideoTrack videoTrack) {
        videoTrack.removeRenderer(remote_camera_view);
        remote_camera_view.setBackgroundColor(0xFFDDDDDD);

        // remove the invitation links and text
        remoteCameraVisible = false;
        inviteLinks();
    }

    /*
     * Set primary view as renderer for participant video track
     */
    private void addRemoteParticipantVideo(VideoTrack videoTrack) {
        //moveLocalVideoToThumbnailView(); // we don't need to do this anymore
        remote_camera_view.setMirror(false);
        remote_camera_view.setBackgroundColor(0x00000000);
        videoTrack.addRenderer(remote_camera_view);
    }

    /*
     * Called when remote participant leaves the room
     */
    private void removeRemoteParticipant(RemoteParticipant remoteParticipant) {

        if (!remoteParticipant.getIdentity().equals(remoteParticipantIdentity)) {
            return;
        }

        /*
         * Remove remote participant renderer
         */
        if (!remoteParticipant.getRemoteVideoTracks().isEmpty()) {
            RemoteVideoTrackPublication remoteVideoTrackPublication =
                    remoteParticipant.getRemoteVideoTracks().get(0);

            /*
             * Remove video only if subscribed to participant track
             */
            if (remoteVideoTrackPublication.isTrackSubscribed()) {
                removeParticipantVideo(remoteVideoTrackPublication.getRemoteVideoTrack());
            }
        }
        // don't need this either
//        moveLocalVideoToPrimaryView();
    }



    private void setVideoNodeAttribute(String attribute, boolean b) {
        if(currentVideoNode == null)
            return;
        FirebaseDatabase.getInstance().getReference("video/list/"+currentVideoNode.getKey()+"/"+attribute).setValue(b);
    }

    private String getVideoNodeKey() {
        String vtype = "Video Petition"; // TODO at some point, get this from the database
        String videoNodeKey = getVideoNodeKey(vtype);
        return videoNodeKey;
    }

    private void queryCurrentVideoNode() {

        if(currentVideoNode == null) {
            final String videoNodeKey = getVideoNodeKey();
            if (videoNodeKey != null) {
                FirebaseDatabase.getInstance().getReference("video/list/" + videoNodeKey).addValueEventListener(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot dataSnapshot) {
                        VideoNode vnode = dataSnapshot.getValue(VideoNode.class);
                        if (vnode == null) return;
                        currentVideoNode = vnode;
                        currentVideoNode.setKey(videoNodeKey);
                        video_mission_description.setText(currentVideoNode.getVideo_mission_description());
                        if(currentVideoNode.getLeg_id() != null && !currentVideoNode.getLeg_id().equals("")) {
                            video_title.setText(currentVideoNode.getVideo_title());
                            youtube_video_description.setText(currentVideoNode.getYoutube_video_description());
                        }
                        else {
                            video_title.setText("(Choose a legislator first)");
                            youtube_video_description.setText("(Choose a legislator first)");
                        }

                        setLegislatorFields(currentVideoNode);

                        email_to_legislator.setChecked(currentVideoNode.isEmail_to_legislator());
                        post_to_facebook.setChecked(currentVideoNode.isPost_to_facebook());
                        post_to_twitter.setChecked(currentVideoNode.isPost_to_twitter());

//                        // the connect_button toggles its image as soon as it's clicked.  This code will just keep it in sync if a disconnect is forced from somewhere else
//                        if(currentVideoNode.getParticipant(User.getInstance().getUid()).isConnected()) {
//                            doConnect();
//                        } else {
//                            doDisconnect();
//                        }
                        figureOutConnectivity();

                        // I don't think this is how we should determine to show the publish button
                        // A better
//                        if(currentVideoNode.recordingHasStarted()) recordingHasStarted();
//                        else if(currentVideoNode.recordingHasStopped()) recordingHasStopped();
//                        else recordingHasNotStarted();

                        // Determine publish_button visibility:
                        // Hide if the video has been published (email_to_participant_send_date != null)
                        // Show if not published but twilio has called back to us with a recording-completed event
                        // see twilio-telepatriot.js:twilioCallback()
                        // Hide otherwise
                        if(currentVideoNode.getEmail_to_participant_send_date() != null) {
                            publish_button.setVisibility(View.GONE);
                        } else if(currentVideoNode.isRecording_completed()) {
                            publish_button.setVisibility(View.VISIBLE);
                        } else {
                            publish_button.setVisibility(View.GONE);
                        }

                        inviteLinks();


                        // notify the user when publishing is complete - 'cause that's the end
                        boomNotify();


                        if(noLegislator(currentVideoNode)) {
                            // use then before any legislator is chosen
                            youtube_video_description.setText("Choose a legislator and TelePatriot will create the YouTube video description for you.  (Doesn't get any easier than that!)");
                        }

                        if(currentVideoNode.bothParticipantsPresent()) {
                            Log.d(TAG, "BOTH PARTICIPANTS READY !!!!!!");
                            // connect automatically !!!
                            connectIfNotConnected();
                        }
                        else {
                            Log.d(TAG, "BOTH PARTICIPANTS >>>NOT<<< READY");
                        }

                        if(currentVideoNode.getVideo_id() == null) {
                            youtube_status.setImageResource(R.drawable.gray_checkmark);
                        }
                        else {
                            youtube_status.setImageResource(R.drawable.green_checkmark);
                        }
                        if(currentVideoNode.getFacebook_post_id() == null) {
                            facebook_status.setImageResource(R.drawable.gray_checkmark);
                        }
                        else {
                            facebook_status.setImageResource(R.drawable.green_checkmark);
                        }
                        if(currentVideoNode.getTwitter_post_id() == null) {
                            twitter_status.setImageResource(R.drawable.gray_checkmark);
                        }
                        else {
                            twitter_status.setImageResource(R.drawable.green_checkmark);
                        }
                        if(currentVideoNode.getEmail_to_legislator_send_date() == null) {
                            emailed_to_legislator_status.setImageResource(R.drawable.gray_checkmark);
                        }
                        else {
                            emailed_to_legislator_status.setImageResource(R.drawable.green_checkmark);
                        }
                        if(currentVideoNode.getEmail_to_participant_send_date() == null) {
                            emailed_to_participant_status.setImageResource(R.drawable.gray_checkmark);
                        }
                        else {
                            emailed_to_participant_status.setImageResource(R.drawable.green_checkmark);
                        }
                    }

                    @Override
                    public void onCancelled(DatabaseError databaseError) {
                    }
                });
            }
        }
    }

    private boolean notifiedOfEnd = false;
    private void boomNotify() {
        if (User.getInstance().isAllowed() && User.getInstance().isVideoCreator()) {
            boomNotify1();
        }
        else {
            boomNotify2();
        }
    }

    private void boomNotify1() {
        if(currentVideoNode == null) return;
        boolean videoLifecycleComplete = currentVideoNode.getEmail_to_participant_send_date() != null;
        if(videoLifecycleComplete && !notifiedOfEnd) {

            notifiedOfEnd = true;

            DialogInterface.OnClickListener makeAnother = new DialogInterface.OnClickListener() {
                public void onClick(DialogInterface dialog, int id) {
                    makeAnotherVideo();
                }
            };

            DialogInterface.OnClickListener stop = new DialogInterface.OnClickListener() {
                public void onClick(DialogInterface dialog, int id) {
                    stopForNow();
                }
            };

            AlertDialog.Builder builder = new AlertDialog.Builder(myView.getContext());
            builder.setMessage("Mission Accomplished - Your video has been published.  What do you want to do now?")
                    .setTitle("BOOM! You Did It!")
                    .setCancelable(true)
                    .setPositiveButton("Make Another Video", makeAnother)
                    .setNegativeButton("Stop For Now", stop);
            AlertDialog alert = builder.create();
            alert.show();
        }
    }

    // for users that aren't allowed in to the app yet.  We don't give them an option to do anything
    // after the video has been published. They can hit ok and that sends them back to the limbo screen
    private void boomNotify2() {
        if(currentVideoNode == null) return;
        boolean videoLifecycleComplete = currentVideoNode.getEmail_to_participant_send_date() != null;
        if(videoLifecycleComplete && !notifiedOfEnd) {

            notifiedOfEnd = true;

            DialogInterface.OnClickListener close = new DialogInterface.OnClickListener() {
                public void onClick(DialogInterface dialog, int id) {
                    Map updates = new HashMap();
                    updates.put("users/"+User.getInstance().getUid()+"/current_video_node_key", null);
                    updates.put("users/"+User.getInstance().getUid()+"/video_invitation_from", null);
                    updates.put("users/"+User.getInstance().getUid()+"/video_invitation_from_name", null);
                    FirebaseDatabase.getInstance().getReference("/").updateChildren(updates);
                    getActivity().finishAffinity();
                }
            };

            AlertDialog.Builder builder = new AlertDialog.Builder(myView.getContext());
            builder.setTitle("BOOM! You Did It!")
                    .setMessage("Mission Accomplished - Your video has been published.  Check your email.")
                    .setCancelable(false)
                    .setPositiveButton("OK", close);
            AlertDialog alert = builder.create();
            alert.show();
        }
    }

    private void makeAnotherVideo() {
        // Should create another video node
        notifiedOfEnd = false;
        disconnectIfConnected();
        createVideoNodeKey("Video Petition"); // TODO at some point, get this from the database
        currentVideoNode = null;
        queryCurrentVideoNode();
    }

    private void disconnectIfConnected() {
        // disconnect if connected
        if(room != null && (room.getState() == RoomState.CONNECTING || room.getState() == RoomState.CONNECTED)) {
            // disconnect just in
            VideoEvent ve = new VideoEvent(User.getInstance().getUid(), User.getInstance().getName(), currentVideoNode.getKey(),
                    currentVideoNode.getRoom_id(), "disconnect request", currentVideoNode.getRoom_sid(), currentVideoNode.getComposition_MediaUri());
            // currentVideoNode.getRoom_sid() prevents js exception on the server by not trying to create a room that we know exists -  see switchboard.js:connect()
            // currentVideoNode.getComposition_MediaUri() when not null, will let us publish a video without re-composing it, because re-composing isn't necessary
            // and takes about a minute or more
            ve.save();
        }
    }

    // unset the user's current_video_node_key
    private void stopForNow() {
        disconnectIfConnected();
        User.getInstance().setCurrent_video_node_key(null);
        AuthUI aui = AuthUI.getInstance();
        Activity act = getActivity();
        if(act instanceof FragmentActivity) {
            aui.signOut((FragmentActivity) getActivity())
                    .addOnCompleteListener(new OnCompleteListener<Void>() {
                        @Override
                        public void onComplete(@NonNull Task<Void> task) {
                            getActivity().finishAffinity();
                        }
                    });
        }
    }


    /**
     * Are we connected? Are we disconnected?  Should we be connected?  Should we be disconnected?
     * Should we disconnect from one room and connect to another room?
     * Do I need to connect?  Yes, if I'm not connected to the right room
     * Do I need to disconnect?
     */
    private String currentRoomId; // won't this get nulled if I move off the screen and come back?
    private void figureOutConnectivity() {
        // Do I have a token?  -geez
        boolean doIHaveToken = false;
        // Should we be connected?
        VideoParticipant me = currentVideoNode.getParticipant(User.getInstance().getUid());
        boolean iAmParticipant = me != null;
        if(iAmParticipant) {
            if (currentVideoNode.getRoom_id().startsWith("record"))
                doIHaveToken = currentVideoNode.getParticipant(User.getInstance().getUid()).getTwilio_token_record() != null;
            else
                doIHaveToken = currentVideoNode.getParticipant(User.getInstance().getUid()).getTwilio_token() != null;
        }

        boolean iAmAbleToConect = doIHaveToken;

        // Are we connected?
        boolean connected = room != null && (room.getState() == RoomState.CONNECTED || room.getState() == RoomState.CONNECTING);
        boolean shouldBeConnected = me!=null && me.isConnected();
        // Should we be disconnected?
        boolean shouldBeDisconnected = !shouldBeConnected;
        // Am I connected to the wrong room?
        boolean connectedToTheWrongRoom = connected && !currentVideoNode.getRoom_id().equals(currentRoomId);
        // Do I need to connect?
        boolean doINeedToConnect = !connected && shouldBeConnected;
        boolean iAmAboutToConnect = iAmAbleToConect && doINeedToConnect;
        boolean doINeedToDisconnect = connected && shouldBeDisconnected;
        boolean iAmAboutToDisconnect = doINeedToDisconnect;
        boolean doINeedToSwitchRooms = shouldBeConnected && connectedToTheWrongRoom;
        boolean iAmAboutToSwitchRooms = iAmAbleToConect && doINeedToSwitchRooms;

        System.out.println(TAG+ "]  ------------------------------------------------------------");
        System.out.println(TAG+ "]  RoomId IS: "+currentRoomId+"   -- CHANGING TO: "+currentVideoNode.getRoom_id());
        System.out.println(TAG+ "]      connected: "+connected);
        System.out.println(TAG+ "]      shouldBeConnected: "+shouldBeConnected);
        System.out.println(TAG+ "]      shouldBeDisconnected: "+shouldBeDisconnected);
        System.out.println(TAG+ "]      connectedToTheWrongRoom: "+connectedToTheWrongRoom);
        System.out.println(TAG+ "]      iAmAbleToConect: "+iAmAbleToConect);
        System.out.println(TAG+ "]      doINeedToConnect: "+doINeedToConnect);
        System.out.println(TAG+ "]      iAmAboutToConnect: "+iAmAboutToConnect);
        System.out.println(TAG+ "]      doINeedToDisconnect: "+doINeedToDisconnect);
        System.out.println(TAG+ "]      iAmAboutToDisconnect: "+iAmAboutToDisconnect);
        System.out.println(TAG+ "]      doINeedToSwitchRooms: "+doINeedToSwitchRooms);
        System.out.println(TAG+ "]      iAmAboutToSwitchRooms: "+iAmAboutToSwitchRooms);

        if(iAmAboutToConnect) {
            System.out.println(TAG+ "]  connecting...");
            doConnect();
            currentRoomId = currentVideoNode.getRoom_id();
        }
        else if(iAmAboutToDisconnect) {
            System.out.println(TAG+ "]  disconnecting...");
            doDisconnect();
            currentRoomId = currentVideoNode.getRoom_id();
        }
        else if(iAmAboutToSwitchRooms) {
            System.out.println(TAG+ "]  disconnecting...");
            doDisconnect();
            System.out.println(TAG+ "]  connecting...");
            doConnect();
            currentRoomId = currentVideoNode.getRoom_id();
        }
    }


    private void doConnect() {
        //getActivity().runOnUiThread(new Runnable() { public void run() {connect_button.setChecked(true);}});

        VideoParticipant me = currentVideoNode.getParticipant(User.getInstance().getUid());
        if(me == null)
            return;

        configureAudio(true);

        String token = currentVideoNode.getRoom_id().startsWith("record") ? me.getTwilio_token_record() : me.getTwilio_token();

        // Get accessToken from the user's node under /video/list/{video_node_key}/video_participants/{uid}/twilio_token
        ConnectOptions.Builder connectOptionsBuilder = new ConnectOptions.Builder(token)
                .roomName(currentVideoNode.getRoom_id());

        /*
         * Add local audio track to connect options to share with participants.
         */
        if (localAudioTrack != null) {
            connectOptionsBuilder
                    .audioTracks(Collections.singletonList(localAudioTrack));
        }

        /*
         * Add local video track to connect options to share with participants.
         */
        if (localVideoTrack != null) {
            connectOptionsBuilder.videoTracks(Collections.singletonList(localVideoTrack));
        }

        /*
         * Set the preferred audio and video codec for media.
         */
        connectOptionsBuilder.preferAudioCodecs(Collections.singletonList(audioCodec));
        connectOptionsBuilder.preferVideoCodecs(Collections.singletonList(videoCodec));

        /*
         * Set the sender side encoding parameters.
         */
        connectOptionsBuilder.encodingParameters(encodingParameters);

        if(getActivity() == null) { // I've seen this happen when another user tries to connect and the android user is still on the limbo screen
            return;
        }

        room = Video.connect(getActivity(), connectOptionsBuilder.build(), roomListener());

        buttonStates(true);

        if(room.getName().startsWith("record"))
            record_label.setText("Recording...");
        else record_label.setText("");
        microphone_button.setVisibility(View.VISIBLE);
        record_button.setVisibility(View.VISIBLE);
        setDisconnectAction();
    }


    private void doDisconnect() {
//        connect_button.setChecked(false);
//        microphone_button.setVisibility(View.GONE);
//        record_button.setVisibility(View.GONE);

        if(room.isRecording())
            ; // how do we stop a recording in progress?
        room.disconnect();

        if (recordingWillStop) {
            record_label.setText("Recording stopped");
        }
        else if (recordingWillStart) {
            /*noop*/
        }
        else {
            record_label.setText("");
        }

        buttonStates(false);

        System.out.println(TAG+ "]  disconnected from:  "+room.getName()+" (currentVideoNode.getRoom_id() = "+currentVideoNode.getRoom_id()+")");
    }


    // Update our UI based upon if we are in a Room or not
    private void buttonStates(boolean inRoom) {
        if(currentVideoNode == null)
            return;
        if (recordingWillStart || recordingWillStop) {
            // prevent the buttons from changing state when the recording starts and stops - very confusing to the user
            // The user doesn't know that they are actually being disconnected from one room and automatically connected to another room
        } else {
            connect_button.setChecked(inRoom);
            microphone_button.setVisibility(inRoom ? View.VISIBLE : View.GONE);
            record_button.setVisibility(inRoom ? View.VISIBLE : View.GONE);
        }
    }


//    private void recordingHasStarted() {
//        if (recording) {
//            return; // means we've already been here
//        }
//        recording = true;
//        record_button.setBackgroundResource(R.drawable.recordstop);
//        publish_button.setVisibility(View.GONE);
//        dismissSpinner();
//    }

    private void inviteLinks() {
        if(isAdded())
            inviteLinks_();
    }

    private void inviteLinks_() {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if(remoteCameraVisible) {
                    invite_someone_button.setVisibility(View.GONE);
                    guest_name.setVisibility(View.GONE);
                    revoke_invitation_button.setVisibility(View.GONE);
                }
                else if(currentVideoNode.getVideo_invitation_key()!=null) {
                    invite_someone_button.setText(""); //invite_someone_button.setVisibility(View.GONE);
                    // weird side effect of accepting someone's invitation: When you join someone's video node,
                    // the guest_name label will say you have invited yourself.  Not true, but that's how it will read
                    // So compare current user with the name the invitation was extended to and don't show the
                    // guest_name label
                    guest_name.setVisibility(View.VISIBLE);
                    if(!User.getInstance().getName().equals(currentVideoNode.getVideo_invitation_extended_to())) {
                        guest_name.setText("You have invited "+currentVideoNode.getVideo_invitation_extended_to()+" to participate in a video chat");
                        revoke_invitation_button.setVisibility(View.VISIBLE);
                    }
                    else {
                        String initiator = new VideoInvitation(currentVideoNode).getInitiator_name();
                        guest_name.setText(initiator+" has invited you to participate in a video chat.  Click the green phone button to connect with "+initiator);
                        revoke_invitation_button.setVisibility(View.VISIBLE);
                    }
                }
                else {
                    // means the remote camera is not visible and there's no invitation extended yet
                    invite_someone_button.setVisibility(View.VISIBLE);
                    invite_someone_button.setText("invite someone");
                    guest_name.setVisibility(View.GONE);
                    revoke_invitation_button.setVisibility(View.GONE);
                }
            }
        });

    }

    //method to get the right URL to use in the intent
    public String getFacebookPageURL(Context context, String FACEBOOK_PAGE) {
        String fb = FACEBOOK_PAGE;
        if(fb.startsWith("FB: @"))
            fb = fb.substring("FB: @".length()).trim();
        PackageManager packageManager = context.getPackageManager();
        try {
            int versionCode = packageManager.getPackageInfo("com.facebook.katana", 0).versionCode;
            if (versionCode >= 3002850) { //newer versions of fb app
                return "fb://facewebmodal/f?href=https://www.facebook.com/" + fb;
            } else { //older versions of fb app
                return "fb://page/" + fb;
            }
        } catch (PackageManager.NameNotFoundException e) {
            return "https://www.facebook.com/" + fb; //normal web url
        }
    }

    private void chooseLegislatorFirst() {
        // pop up a dialog if the user tries to start the recording before choosing a legislator
        // We need the legislator chosen first (or at least before publishing) because we create
        // the YouTube video title and description using legislator name and contact info
        // Even though we only NEED this info before publishing, it makes more sense to ask for it
        // before recording starts.
        Util.simpleOKDialog(myView.getContext(), "Choose a legislator before recording");
    }

    /**
     * Created so that we could pop up a simple dialog and edit facebook and twitter handles
     * for legislators
     * @param videoNode The node under video/list
     * @param attributeName The name of the attribute in the video node, i.e. It would be the
     *                      "legislator_facebook" part of video/list/{key}/legislator_facebook
     * @param attributeValue the value of the node, i.e. the value of video/list/{key}/legislator_facebook
     * @param screenElement the corresponding screen element on this fragmenet, i.e. legislator_facebook
     */
    private void dlg(final VideoNode videoNode, final String attributeName, String attributeValue, TextView screenElement, String what) {
        if(getActivity().isFinishing())
            return;
        LayoutInflater li = LayoutInflater.from(myView.getContext());
        final View promptsView = li.inflate(R.layout.ok_cancel_dialog_one_numeric_input, null);
        TextView heading = promptsView.findViewById(R.id.dialog_heading);
        heading.setText("Edit "+what);
        TextView moreInf = promptsView.findViewById(R.id.dialog_additional_information);
        String moreInfo = "Update the "+what+" for "+videoNode.getLegislator_first_name()+" "+videoNode.getLegislator_last_name();
        moreInf.setText(moreInfo);
        EditText thefield = promptsView.findViewById(R.id.dialog_input);
        thefield.setText(attributeValue);

        AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(myView.getContext());
        alertDialogBuilder.setView(myView);

        // set prompts.xml to alertdialog builder
        alertDialogBuilder.setView(promptsView);

        final EditText userInput = (EditText) promptsView
                .findViewById(R.id.dialog_input);

        // set dialog message
        alertDialogBuilder
                .setCancelable(false)
                .setPositiveButton("OK",
                        new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog,int id) {

                                // In Swift, this is EditSocialMediaVC.saveSocialMedia() which internally calls socialMediaDelegate.saveSocialMedia()
                                // socialMediaDelegate.saveSocialMedia() is VideoChatInstructionsView.saveSocialMedia()

                                // this is where we save the new value to the database
                                String newval = ((EditText) promptsView.findViewById(R.id.dialog_input)).getText().toString();
                                if(newval.startsWith("@")) newval = newval.substring(1);

                                Map updates = new HashMap();
                                updates.put("leg_id", currentVideoNode.getLeg_id());
                                updates.put("type", attributeName.equalsIgnoreCase("legislator_facebook") ? "Facebook" : "Twitter");
                                updates.put("id", newval);
                                updates.put("legislator_full_name", currentVideoNode.getLegislator_full_name());
                                updates.put("state_abbrev", currentVideoNode.getLegislator_state_abbrev());
                                updates.put("state_chamber", currentVideoNode.getLegislator_chamber());
                                updates.put("state_chamber_district", currentVideoNode.getLegislator_state_abbrev()+"-"+currentVideoNode.getLegislator_chamber()+"-"+currentVideoNode.getLegislator_district());
                                updates.put("updating_user_id", User.getInstance().getUid());
                                updates.put("updating_user_name", User.getInstance().getName());
                                updates.put("updating_user_email", User.getInstance().getEmail());
                                updates.put("updated_date", Util.getDate_MMM_d_yyyy_hmm_am_z());
                                updates.put("updated_date_ms", Util.getDate_as_millis());

                                FirebaseDatabase.getInstance().getReference("social_media/user_updates").push().setValue(updates);
                                dialog.dismiss();
                            }
                        })
                .setNegativeButton("Cancel",
                        new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int id) {
                                dialog.cancel();
                            }
                        });

        // create alert dialog
        AlertDialog alertDialog = alertDialogBuilder.create();
        // show it
        alertDialog.show();
    }


    private boolean noLegislator(VideoNode node) {
        return node.getLeg_id() == null || node.getLeg_id().trim().equals("");
    }

    private void setLegislatorFieldVisibility(int vis) {
        edit_facebook.setVisibility(vis);
        edit_twitter.setVisibility(vis);
        legislator_first_name.setVisibility(vis);
        legislator_last_name.setVisibility(vis);
        legislator_state_abbrev.setVisibility(vis);
        legislator_chamber.setVisibility(vis);
        legislator_district.setVisibility(vis);
        legislator_facebook.setVisibility(vis);
        legislator_twitter.setVisibility(vis);
    }

    private void setLegislatorFields(VideoNode node) {
        if(noLegislator(node)) {
            setLegislatorFieldVisibility(View.GONE);
        }
        else {
            setLegislatorFieldVisibility(View.VISIBLE);
            legislator_first_name.setText(node.getLegislator_first_name());
            legislator_last_name.setText(node.getLegislator_last_name());
            String state_abbrev = "";
            if(node.getLegislator_state() != null)
                state_abbrev = node.getLegislator_state().toUpperCase();
            legislator_state_abbrev.setText(state_abbrev);

            if(node.getLegislator_chamber() == null)
                legislator_chamber.setText("");
            else
                legislator_chamber.setText("lower".equalsIgnoreCase(node.getLegislator_chamber()) ? "HD" : "SD");

            legislator_district.setText(node.getLegislator_district());

            String fb = "FB: -";
            if(node.getLegislator_facebook() != null)
                fb = "FB: @"+node.getLegislator_facebook();
            legislator_facebook.setText(fb);

            String tw = "TW: -";
            if(node.getLegislator_twitter() != null)
                tw = "TW: @"+node.getLegislator_twitter();
            legislator_twitter.setText(tw);
        }


    }


    @Override
    public void onStart() {
        super.onStart();
    }

    public Fragment getFragment() {
        return this;
    }

    private void setUserPresent(User user, boolean present) {
        String videoNodeKey = getVideoNodeKey();
        Map updates = new HashMap();
        updates.put("present", present);
        if(present)
            updates.put("vidyo_token_requested", true);

        FirebaseDatabase.getInstance().getReference("video/list/"+videoNodeKey+"/video_participants/"+user.getUid()).updateChildren(updates);
    }

    @Override
    public void onStop() {
        super.onStop();
        Log.d(TAG, "onStop");
    }

    private String getVideoNodeKey(String vtype) {

        String current_video_node_key = User.getInstance().getCurrent_video_node_key();
        if(current_video_node_key != null) {
            return current_video_node_key;
        }
        else {
            return createVideoNodeKey(vtype);
        }
    }

    private String createVideoNodeKey(String vtype) {
        VideoNode vn = createVideoNode(vtype);
        if(vn == null)
            return null;
        User.getInstance().setCurrent_video_node_key(vn.getKey());
        String thekey = vn.getKey(); // <-- inside this method is where we actually save the new video node
        return thekey;
    }

    private VideoNode createVideoNode(String t) {
        VideoType vtype = VideoType.getType(t /*"Video Petition"*/);
        if(vtype == null)
            return null; // might want some sensible default

        return new VideoNode(User.getInstance(), vtype);
    }




    /****
     * See google-cloud.js:video_title()
     * That function will honor the edits you made to the youtube video description attribute IF
     * you edit that field AFTER selecting the legislator.  But whenever you select or change the legislator,
     * your custom youtube video description will be overwritten.  So always pick the legislator FIRST
     * and THEN edit the youtube video description
     */
    private void editYoutubeVideoTitle() {
        // custom dialog
        EditVideoMissionDescriptionDlg dialog = new EditVideoMissionDescriptionDlg(getActivity(), currentVideoNode.getKey(),
                "YouTube Video Title","video_title", currentVideoNode.getVideo_title());
        dialog.show();
    }

    /****
     * See google-cloud.js:youtubeVideoDescription()
     * That function will honor the edits you made to the youtube video description attribute IF
     * you edit that field AFTER selecting the legislator.  But whenever you select or change the legislator,
     * your custom youtube video description will be overwritten.  So always pick the legislator FIRST
     * and THEN edit the youtube video description
     */
    private void editYoutubeVideoDescription() {
        // TODO really should rename EditVideoMissionDescriptionDlg to something like EditSomeVideoNodeAttribute
        // because we're making EditVideoMissionDescriptionDlg do double duty.
        EditVideoMissionDescriptionDlg dialog = new EditVideoMissionDescriptionDlg(getActivity(), currentVideoNode.getKey(), "YouTube Video Description",
                "youtube_video_description", currentVideoNode.getYoutube_video_description());
        dialog.show();
    }

    private void editVideoMissionDescription() {
        // custom dialog
        EditVideoMissionDescriptionDlg dialog = new EditVideoMissionDescriptionDlg(getActivity(), currentVideoNode.getKey(),
                "Video Mission Description","video_mission_description", currentVideoNode.getVideo_mission_description());
        dialog.show();
    }

    private void inviteSomeone() {
        SearchUsersDlg dialog = new SearchUsersDlg(getActivity(), currentVideoNode);
        dialog.show();
//        SearchUsersFragment f = new SearchUsersFragment();
//        f.setWhereTo(VidyoChatFragment.this); // means we'll come back to this fragment once we select a user
//        showFragment(f);
    }

    private void revokeInvitation() {
        if(currentVideoNode == null)
            return;
        new VideoInvitation(currentVideoNode).delete();
    }


//    private void setTwitterInfo() {
//        if (mTwitterButton.getText().toString().equals("Edit")) {
//            legislator_twitter.setVisibility(View.INVISIBLE);
//            mTwitterEdit.setVisibility(View.VISIBLE);
//            mTwitterButton.setText("Done");
//        }else {
//            legislator_twitter.setText(mTwitterEdit.getText().toString().trim());
//            legislator_twitter.setVisibility(View.VISIBLE);
//            mTwitterEdit.setVisibility(View.GONE);
//            mTwitterButton.setText("Edit");
//        }
//    }

    // TODO woops - not implemented yet
    private void setFBInfo() {
//        if (mFBButton.getText().toString().equals("Edit")) {
//            mRepFB.setVisibility(View.INVISIBLE);
//            mFBEdit.setVisibility(View.VISIBLE);
//            mFBButton.setText("Done");
//        }else {
//            mRepFB.setText(repNameEdit.getText().toString().trim());
//            mRepFB.setVisibility(View.VISIBLE);
//            mFBEdit.setVisibility(View.GONE);
//            mFBButton.setText("Edit");
//        }
    }

    private void chooseLegislator() {
        EditLegislatorForVideoDlg dialog = new EditLegislatorForVideoDlg(getActivity(), currentVideoNode);
        dialog.show();
    }


    private void simpleOKDialog(String message) {
        Util.simpleOKDialog(myView.getContext(), message);
    }

    // The Connect button was pressed.
    // If not in a call, attempt to connect to the backend service.
    // If in a call, disconnect.
    // See in Swift: VideoChatVC.connectionClicked()
    private void connectionClicked() {
        if(currentVideoNode == null) {
            simpleOKDialog("Video chat is currently disabled");
            return;
        }

        recordingWillStart = false; // reset these value to false whenever
        recordingWillStop = false;  // the connect/disconnect button is clicked

        VideoParticipant vp = currentVideoNode.getParticipant(User.getInstance().getUid());
        if(vp == null) {
            simpleOKDialog("Video chat is currently disabled");
            return;
        }
        showSpinner(); // dismissed in doConnect() and doDisconnect()
        String request_type = "connect request";
        if(vp.isConnected()) {
            request_type = "disconnect request";
        }
        VideoEvent ve = new VideoEvent(User.getInstance().getUid(), User.getInstance().getName(), currentVideoNode.getKey(),
                currentVideoNode.getRoom_id(), request_type, currentVideoNode.getRoom_sid(), currentVideoNode.getComposition_MediaUri());
                // currentVideoNode.getRoom_sid() prevents js exception on the server by not trying to create a room that we know exists -  see switchboard.js:connect()
                // currentVideoNode.getComposition_MediaUri() when not null, will let us publish a video without re-composing it, because re-composing isn't necessary
                // and takes about a minute or more
        ve.save();

    }

    boolean recordingWillStart = false;
    boolean recordingWillStop = false;
    private void recordClicked() {
        if(currentVideoNode == null) {
            simpleOKDialog("Recording is currently disabled");
            return;
        }
        if(currentVideoNode.getLeg_id() == null || currentVideoNode.getLeg_id().trim().equals("")) {
            chooseLegislatorFirst();
            return;
        }

        if(currentVideoNode.getRoom_id() != null && currentVideoNode.getRoom_sid() != null) {
            boolean previousRecordingExists = currentVideoNode.getRecording_stopped() != null;
            if(previousRecordingExists) {

                DialogInterface.OnClickListener l = new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        doRecording();
                    }
                };

                Util.simpleOKCancelDialog(myView.getContext(), "Erase Recording?", "Do you want to record over the video you just created?", "Record Over", "Keep", l);
            }
            else {
                doRecording();
            }
        }
        else {
            simpleOKDialog("Recording is currently disabled");
        }
    }

    private void doRecording() {
        if (currentVideoNode.recordingHasNotStarted() || currentVideoNode.recordingHasStopped()) {
            record_label.setText("Recording will start momentarily");
            recordingWillStart = true;
            recordingWillStop = false;
        } else {
            record_label.setText("Recording will stop momentarily");
            recordingWillStart = false;
            recordingWillStop = true;
        }

        String request_type = "start recording";
        if (currentVideoNode.recordingHasStarted())
            request_type = "stop recording";
        else
            simpleOKDialog("Recording will start as soon as you see \"Recording...\" across the top");
        VideoEvent ve = new VideoEvent(User.getInstance().getUid(), User.getInstance().getName(), currentVideoNode.getKey(),
                currentVideoNode.getRoom_id(), request_type, currentVideoNode.getRoom_sid(), currentVideoNode.getComposition_MediaUri());
        ve.save();
    }

    private void connectIfNotConnected() {
        //TODO if we put this auto-connect logic back in, we have to remember that we connect using "connect request" calls now.  We don't directly call doConnect()
//        if(mVidyoConnectorState != VidyoConnectorState.Connected)
//            doConnect();
//        else Log.d(TAG, "already connected to Vidyo server");
    }


    private void showSpinner() {
        //video_chat_spinner.setVisibility(View.VISIBLE);
    }

    private void dismissSpinner() {
        video_chat_spinner.setVisibility(View.GONE);
    }


    private void publishClicked() {
        if(currentVideoNode == null) {
            simpleOKDialog("No video to publish at this time");
            return;
        }
        showSpinner();
        simpleOKDialog("Publishing has started. You will get an email when your video is ready.  May take up to 10 mins.");
        // See google-cloud.js:dockerRequest()
        VideoEvent ve = new VideoEvent(User.getInstance().getUid(),
                                        User.getInstance().getName(),
                                        currentVideoNode.getKey(),
                                        currentVideoNode.getRoom_id(),
                                       "start publishing",
                                        currentVideoNode.getRoom_sid_record(),       // allowed to be null
                                        currentVideoNode.getComposition_MediaUri()); // allowed to be null
        ve.save();
    }
}
