package com.brentdunklau.telepatriot_android;

import android.*;
import android.app.Fragment;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.StrictMode;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.support.v7.widget.SwitchCompat;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.ToggleButton;

import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.Util;
import com.brentdunklau.telepatriot_android.util.VideoEvent;
import com.brentdunklau.telepatriot_android.util.VideoNode;
import com.brentdunklau.telepatriot_android.util.VideoParticipant;
import com.brentdunklau.telepatriot_android.util.VideoType;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.vidyo.VidyoClient.Connector.Connector;
import com.vidyo.VidyoClient.Connector.ConnectorPkg;
import com.vidyo.VidyoClient.Device.Device;
import com.vidyo.VidyoClient.Device.LocalCamera;
import com.vidyo.VidyoClient.Device.LocalMicrophone;
import com.vidyo.VidyoClient.Device.RemoteCamera;
import com.vidyo.VidyoClient.Device.RemoteMicrophone;
import com.vidyo.VidyoClient.Endpoint.LogRecord;
import com.vidyo.VidyoClient.Endpoint.Participant;
import com.vidyo.VidyoClient.NetworkInterface;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * THE ONLY REASON THIS CLASS EXISTS IS TO BE A BACKUP FOR THE ORIGINAL VidyoChatFragment
 * CLASS.  VidyoChatFragment IS NOW BEING USED AS *THE* VIDEO CHAT SCREEN FOR WHATEVER VIDEO
 * IMPLEMENTATION I'M WORKING WITH AT THE MOMENT, UNTIL I FIND ONE THAT WORKS.
 *
 * CREATING THIS VidyoChatFragment_Vidyo CLASS JUST KEEPS ME FROM HAVING TO BOUNCE BACK AND FORTH
 * BETWEEN BRANCHES IF I NEED TO REMEMBER HOW I ORIGINALLY DID SOMETHING ON THE VidyoChatFragment SCREEN
 *
 * Created by bdunklau on 8/9/18.
 */

public class VidyoChatFragment_Vidyo extends BaseFragment implements
        View.OnClickListener
        ,Connector.IConnect
        ,Connector.IRegisterLogEventListener
        ,Connector.IRegisterNetworkInterfaceEventListener
        ,Connector.IRegisterLocalCameraEventListener
        ,Connector.IRegisterLocalMicrophoneEventListener
        ,Connector.IRegisterRemoteCameraEventListener
        ,Connector.IRegisterRemoteMicrophoneEventListener
        //,IVideoFrameListener
{

    private static String TAG = "VidyoChatFragment_Vidyo";

    // Define the various states of this application.
    enum VidyoConnectorState {
        Connecting,
        Connected,
        Disconnecting,
        Disconnected,
        DisconnectedUnexpected,
        Failure,
        FailureInvalidResource
    }

    /************* not sure if we need this 7/7/18
     // Map the application state to the status to display in the toolbar.
     private static final Map<VidyoConnectorState, String> mStateDescription = new HashMap<VidyoConnectorState, String>() {{
     put(VidyoConnectorState.Connecting, "Connecting...");
     put(VidyoConnectorState.Connected, "Connected");
     put(VidyoConnectorState.Disconnecting, "Disconnecting...");
     put(VidyoConnectorState.Disconnected, "Disconnected");
     put(VidyoConnectorState.DisconnectedUnexpected, "Unexpected disconnection");
     put(VidyoConnectorState.Failure, "Connection failed");
     put(VidyoConnectorState.FailureInvalidResource, "Invalid Resource ID");
     }};
     ***************/

    // Helps check whether app has permission to access what is declared in its manifest.
    // - Permissions from app's manifest that have a "protection level" of "dangerous".
    private static final String[] mPermissions = new String[] {
            android.Manifest.permission.CAMERA,
            android.Manifest.permission.RECORD_AUDIO,
            android.Manifest.permission.WRITE_EXTERNAL_STORAGE
    };
    // - This arbitrary, app-internal constant represents a group of requested permissions.
    // - For simplicity, this app treats all desired permissions as part of a single group.
    private final int PERMISSIONS_REQUEST_ALL = 1988;

    private VidyoConnectorState mVidyoConnectorState = VidyoConnectorState.Disconnected;
    private boolean mVidyoClientInitialized = false;
    private Connector mVidyoConnector = null;
    private LocalCamera mLastSelectedCamera = null;
    public EditText mDisplayName;
    //public static EditText mToken;

    private VideoFrameLayout local_camera_view;

    private VideoFrameLayout remote_camera_view;
    private boolean remoteCameraVisible;
    private TextView invite_someone_button, guest_name, revoke_invitation_button;

    private boolean mCameraPrivacy = false;
    private boolean mMicrophonePrivacy = false;
    private boolean mEnableDebug = false;
    private boolean mRefreshSettings = true;
    private boolean mDevicesSelected = true;
    private View myView;
    private String uid;
    private Integer videoTypeKey;
    private String room_id; // the initiator's user id
    private String missionDescription;  // we can probably get rid of this - we have video_mission_description
    private TextView video_mission_description;
    private TextView choose_legislator;
    private TextView edit_video_title_button;
    private TextView video_title;
    private TextView edit_video_mission_description_button;
    private TextView edit_youtube_video_description_button;
    private TextView youtube_video_description;
    private String reasons;
    private LocalCamera localCamera;
    private VideoNode currentVideoNode;

    private boolean recording = false;

    private ToggleButton connect_button;
    private ToggleButton microphone_button;
    //private ToggleButton camera_button;
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

    private ProgressBar video_chat_spinner;

//    private FragmentManager fragmentManager;
//    private Fragment back;


    /*
     *  Operating System Events
     */

    @Nullable
    @Override
    public View onCreateView (LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState){
        myView = inflater.inflate(R.layout.vidyo_chat_fragment,container,false);

        int SDK_INT = Build.VERSION.SDK_INT;
        if (SDK_INT > 8)
        {
            StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder()  // What is this good for?
                    .permitAll().build();
            StrictMode.setThreadPolicy(policy);

            //your codes here
//            getToken(); // this doesn't do anything.  It gets a token but doesn't return it or set it
        }

        // We need to know if we are coming to this screen from a video invitation or if the user
        // is initiating a video chat
        // How would we tell?
        // Option 1: Users have a "currentVideoNodeKey" attribute.  If we make sure this attribute is
        //          set before the user gets here, then it won't matter if they are initiator or guest

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
                if(tw.startsWith("TW: "))
                    tw = tw.substring("TW: ".length()).trim();
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("twitter://user?screen_name=" + tw)));
                }catch (Exception e) {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://twitter.com/#!/" + tw)));
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
        missionDescription = videoType.getVideo_mission_description();
        uid =  User.getInstance().getUid();

        local_camera_view = myView.findViewById(R.id.local_camera_view);
        remote_camera_view = myView.findViewById(R.id.remote_camera_view);

        local_camera_view.setMinimumWidth(local_camera_view.getHeight() * 16 / 9);

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
        connect_button.setOnClickListener(this); // See onClick() in this class
        microphone_button = myView.findViewById(R.id.microphone_button);
        microphone_button.setOnClickListener(this);
//        camera_button = myView.findViewById(R.id.camera_button);
//        camera_button.setOnClickListener(this);

        video_chat_spinner = myView.findViewById(R.id.video_chat_spinner);


        // Set the application's UI context to this activity.
        ConnectorPkg.setApplicationUIContext(getActivity());

        // Initialize the VidyoClient library - this should be done once in the lifetime of the application.
        mVidyoClientInitialized = ConnectorPkg.initialize();

        queryCurrentVideoNode();

        record_button = myView.findViewById(R.id.record_button);
        record_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (recording) {
                    stopRecording();
                }
                else {
                    startRecording();
                }
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


//        record_button.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
//            @Override
//            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
//
//
//                int SDK_INT = Build.VERSION.SDK_INT;
//                if (SDK_INT < 9) {
//                    Toast.makeText(getActivity(), "Android Update Required", Toast.LENGTH_LONG).show();
//                }
//
//                StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder()
//                        .permitAll().build();
//                StrictMode.setThreadPolicy(policy);
//
//                if (isChecked) {
//                    startRecording();
//                } else {
//                    stopRecording();
//                }
//
//            }
//        });

        /*******
         if(room_id != null) {
         connect_button.setChecked(true);
         _mVidyoConnector();
         connectionClicked();
         }
         ********/

        return myView;
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
                        video_title.setText(currentVideoNode.getVideo_title());
                        youtube_video_description.setText(currentVideoNode.getYoutube_video_description());

                        setLegislatorFields(currentVideoNode);

                        email_to_legislator.setChecked(currentVideoNode.isEmail_to_legislator());
                        post_to_facebook.setChecked(currentVideoNode.isPost_to_facebook());
                        post_to_twitter.setChecked(currentVideoNode.isPost_to_twitter());

                        // the connect_button toggles its image as soon as it's clicked.  This code will just keep it in sync if a disconnect is forced from somewhere else
                        if(currentVideoNode.getParticipant(User.getInstance().getUid()).isConnected()) {
                            connect_button.setChecked(true);
                            doConnect();
                        } else {
                            connect_button.setChecked(false);
                            doDisconnect();
                        }

                        inviteLinks();

                        if(Boolean.TRUE == currentVideoNode.getRecording_requested()) {
                            showSpinner(); // dismissed just below here, once currentVideoNode.getRecording_started() != null
                            simpleOKDialog("The recording will start in 30-45 seconds.  When the spinner goes away, the recording will begin.");
                        }

                        if(currentVideoNode.getRecording_started() != null && currentVideoNode.getRecording_stopped() == null) {
                            //dismissSpinner();
                            recordingHasStarted();
                        }





//                        if let vn = self.videoNode, let recording_requested = vn.recording_requested {
//                            if (recording_requested) {
//                                self.showSpinner2()
//                            } // spinner dismissed on the next lines...
//                        }
//
//                        if let vn = self.videoNode, let _ = vn.recording_started, vn.recording_stopped == nil {
//                            self.recordingHasStarted()
//                        }





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
                    }

                    @Override
                    public void onCancelled(DatabaseError databaseError) {
                    }
                });
            }
        }
    }


    private void recordingHasStarted() {
        if (recording) {
            return; // means we've already been here
        }
        recording = true;
        record_button.setBackgroundResource(R.drawable.recordstop);
        publish_button.setVisibility(View.GONE);
        dismissSpinner();
    }


    private void inviteLinks() {
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if(remoteCameraVisible) {
                    invite_someone_button.setVisibility(View.GONE);
                    guest_name.setVisibility(View.GONE);
                    revoke_invitation_button.setVisibility(View.GONE);
                }
                else if(currentVideoNode.getVideo_invitation_key()!=null) {
                    invite_someone_button.setVisibility(View.GONE);
                    // weird side effect of accepting someone's invitation: When you join someone's video node,
                    // the guest_name label will say you have invited yourself.  Not true, but that's how it will read
                    // So compare current user with the name the invitation was extended to and don't show the
                    // guest_name label
                    if(User.getInstance().getName().equals(currentVideoNode.getVideo_invitation_extended_to())) {
                        guest_name.setVisibility(View.GONE);
                    }
                    else {
                        guest_name.setVisibility(View.VISIBLE);
                    }
                    revoke_invitation_button.setVisibility(View.VISIBLE);
                }
                else {
                    // means the remote camera is not visible and there's no invitation extended yet
                    invite_someone_button.setVisibility(View.VISIBLE);
                    guest_name.setVisibility(View.GONE);
                    revoke_invitation_button.setVisibility(View.GONE);
                }

                if(guest_name.getVisibility() == View.VISIBLE) {
                    guest_name.setText("You have invited "+currentVideoNode.getVideo_invitation_extended_to()+" to participate in a video chat");
                }
            }
        });


    }

    //method to get the right URL to use in the intent
    public String getFacebookPageURL(Context context, String FACEBOOK_PAGE) {
        String fb = FACEBOOK_PAGE;
        if(fb.startsWith("FB: "))
            fb = fb.substring("FB: ".length()).trim();
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
        simpleOKDialog("Choose a legislator before recording");
    }

    private void simpleOKDialog(String message) {
        AlertDialog.Builder builder = new AlertDialog.Builder(myView.getContext());
        builder.setMessage(message)
                .setCancelable(false)
                .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        //do things
                    }
                });
        AlertDialog alert = builder.create();
        alert.show();
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

                                // In Swift, this is EditSocialMediaVC.saveSocialMedia() which internall calls socialMediaDelegate.saveSocialMedia()
                                // socialMediaDelegate.saveSocialMedia() is VideoChatInstructionsView.saveSocialMedia()

                                // this is where we save the new value to the database
                                String newval = ((EditText) promptsView.findViewById(R.id.dialog_input)).getText().toString();

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
                fb = "FB: "+node.getLegislator_facebook();
            legislator_facebook.setText(fb);

            String tw = "TW: -";
            if(node.getLegislator_twitter() != null)
                tw = "TW: "+node.getLegislator_twitter();
            legislator_twitter.setText(tw);
        }


    }


    @Override
    public void onStart() {
        super.onStart();
        // Initialize or refresh the app settings.
        // When app is first launched, mRefreshSettings will always be true.
        // Each successive time that onStart is called, app is coming back to foreground so check if the
        // settings need to be refreshed again, as app may have been launched via URI.

        mRefreshSettings = false;

        geeez();
    }

    private void geeez() {

        if(!mVidyoClientInitialized) {
            // Set the application's UI context to this activity.
            ConnectorPkg.setApplicationUIContext(getActivity());

            // Initialize the VidyoClient library - this should be done once in the lifetime of the application.
            mVidyoClientInitialized = ConnectorPkg.initialize();
        }

        // If Vidyo Client has been successfully initialized and the Connector has
        // not yet been constructed, then check permissions and construct Connector.
        if (mVidyoConnector == null) {
            // Beginning in Android 6.0 (API level 23), users grant permissions to apps while
            // app is running, not when they install the app. Check whether app has permission
            // to access what is declared in its manifest.
            if (Build.VERSION.SDK_INT > 22) {
                List<String> permissionsNeeded = new ArrayList<>();
                for (String permission : mPermissions) {
                    // Check if the permission has already been granted.
                    if (ContextCompat.checkSelfPermission(getActivity(), permission) != PackageManager.PERMISSION_GRANTED)
                        permissionsNeeded.add(permission);
                }
                if (permissionsNeeded.size() > 0) {
                    // Request any permissions which have not been granted. The result will be called back in onRequestPermissionsResult.
                    ActivityCompat.requestPermissions(getActivity(), permissionsNeeded.toArray(new String[0]), PERMISSIONS_REQUEST_ALL);
                } else {
                    startVidyoConnector();
                }
            } else {
                startVidyoConnector();
            }
        }

    }

//    // per FragmentContainingUser
//    public void userSelected(UserBean guest) {
//        // this is the person that was just invited - it's not the current user.  The current user invited this person
//        if(currentVideoNode == null)
//            return;
//        VideoInvitation inv = new VideoInvitation(User.getInstance(), guest, currentVideoNode.getKey());
//        String key = inv.save();
//        Map updates = new HashMap();
//        updates.put("video_invitation_key", key);
//        updates.put("video_invitation_extended_to", guest.getName());
//        FirebaseDatabase.getInstance().getReference("video/list/"+currentVideoNode.getKey()).updateChildren(updates);
//    }

//    // per FragmentContainingUser
//    public void setFragmentManager(FragmentManager fragmentManager, Fragment back) {
//        this.fragmentManager = fragmentManager;
//        this.back = back;
//    }

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
    public void onResume() {
        super.onResume();
        Log.d(TAG, "onResume");
        setUserPresent(User.getInstance(), true);

        // Set the application's UI context to this activity.
        //ConnectorPkg.setApplicationUIContext(getActivity());

        // Initialize the VidyoClient library - this should be done once in the lifetime of the application.
        //mVidyoClientInitialized = ConnectorPkg.initialize();
    }

    @Override
    public void onPause() {
        super.onPause();
        Log.d(TAG, "onPause");
        setUserPresent(User.getInstance(), false);
    }

    @Override
    public void onStop() {
        super.onStop();
        Log.d(TAG, "onStop");

        if (mVidyoConnector != null) {
            if (mVidyoConnectorState != VidyoConnectorState.Connected &&
                    mVidyoConnectorState != VidyoConnectorState.Connecting) {
                // Not connected/connecting to a resource.
                // Release camera, mic, and speaker from this app while backgrounded.
                mVidyoConnector.selectLocalCamera(null);
                mVidyoConnector.selectLocalMicrophone(null);
                mVidyoConnector.selectLocalSpeaker(null);
                mDevicesSelected = false;
            }
            mVidyoConnector.disable(); // this is key
            // If you don't call disable(), your app will hang on to the camera and the next time you come to
            // this screen you'll try to open the camera again and you won't be able to.  You'll be instantiating mVidyoConnector
            // again but you won't be able to get the camera back - hard lesson learned here.

            //mVidyoConnector.setMode(Connector.ConnectorMode.VIDYO_CONNECTORMODE_Background); not sure if we need this given that we call disable() above
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "onDestroy");

        // Release device resources
        mLastSelectedCamera = null;
        mVidyoConnector.disable();

        // Connector will be destructed upon garbage collection.
        mVidyoConnector = null;

        ConnectorPkg.setApplicationUIContext(null);

        // Uninitialize the VidyoClient library - this should be done once in the lifetime of the application.
        ConnectorPkg.uninitialize();
    }

    private String getVideoNodeKey(String vtype) {

        String current_video_node_key = User.getInstance().getCurrent_video_node_key();
        if(current_video_node_key != null) {
            return current_video_node_key;
        }
        else {
            VideoNode vn = createVideoNode(vtype);
            if(vn == null)
                return null;
            User.getInstance().setCurrent_video_node_key(vn.getKey());
            return vn.getKey(); // <-- inside this method is where we actually save the new video node
        }
    }

    private VideoNode createVideoNode(String t) {
        VideoType vtype = VideoType.getType(t /*"Video Petition"*/);
        if(vtype == null)
            return null; // might want some sensible default

        return new VideoNode(User.getInstance(), vtype);
    }

    // set the room_id by updating the database.  The realtime query will cause the fields in
    // this class to be updated
    public String getRoom_id() {
        if(room_id == null)
            room_id = User.getInstance().getCurrent_video_node_key();
        return room_id;
    }


    private String getToken() {
        if(currentVideoNode == null)
            return "";
        for(VideoParticipant vp : currentVideoNode.getVideo_participants().values()) {
            if(vp.getUid().equals(User.getInstance().getUid()))
                return vp.getVidyo_token();
        }
        return "";
    }


    /**
     * Don't GET a token.  ASK for a token by writing to the video_participant's node and then creating
     * a trigger function that will listen for writes to that node and generate a token and write that token
     * to the participant's node
     */
//    private String getToken() {
//        String token = "";
//        HttpURLConnection connection = null;
//        BufferedReader reader = null;
//
//        try {
//            String uid = User.getInstance().getUid();
//            if(uid.contains("@")){
//                uid = uid.replaceAll("@","_");
//            }
//            // TODO maybe get this url from the database instead?
//            // TODO not good to have parm named userName if the value is the user's id
//            String urlString = "https://us-central1-telepatriot-bd737.cloudfunctions.net/generateVidyoToken?userName=" + uid;
//            URL url = new URL(urlString);
//
//            connection = (HttpURLConnection) url.openConnection();
//            connection.connect();
//            InputStream inputStream = connection.getInputStream();
//            reader = new BufferedReader(new InputStreamReader(inputStream));
//
//            StringBuffer buffer = new StringBuffer();
//            String line = "";
//
//            while ((line = reader.readLine()) != null) {
//                buffer.append(line + "/n");
//            }
//
//            String bufferString = buffer.toString();
//            JSONObject jsonObject = new JSONObject(bufferString);
//            token = jsonObject.getString("token").trim();
//        } catch (MalformedURLException e) {
//            // TODO what are we supposed to do in this case?
//        } catch (IOException e) {
//            // TODO what are we supposed to do in this case?
//        } catch (JSONException e) {
//            // TODO what are we supposed to do in this case?
//        } finally {
//            if (connection != null) {
//                connection.disconnect();
//            }
//            try {
//                if (reader != null) {
//                    reader.close();
//                }
//            }
//            catch (IOException e) {
//                // TODO what are we supposed to do in this case?
//            }
//        }
//        return token;
//    }



    /********* get rid of this once the new version above is working
     private void getToken_orig() {
     pd = new ProgressDialog(getActivity());
     pd.setMessage("Please Wait");
     pd.show();

     HttpURLConnection vmConnection = null;
     BufferedReader reader = null;

     //TODO make dynamic

     try {
     String tokenThing = User.getInstance().getUid();
     if(tokenThing.contains("@")){
     tokenThing = tokenThing.replaceAll("@","_");
     }
     String urlString = "https://us-central1-telepatriot-bd737.cloudfunctions.net/generateVidyoToken?userName=" + tokenThing;
     URL url = new URL(urlString);

     vmConnection = (HttpURLConnection) url.openConnection();
     vmConnection.connect();
     InputStream inputStream = vmConnection.getInputStream();
     reader = new BufferedReader(new InputStreamReader(inputStream));

     StringBuffer buffer = new StringBuffer();
     String line = "";

     while ((line = reader.readLine()) != null) {
     buffer.append(line + "/n");
     }

     String bufferString = buffer.toString();
     JSONObject jsonObject = new JSONObject(bufferString);
     jsonTokenData = jsonObject.getString("token").trim();
     } catch (MalformedURLException e) {
     } catch (IOException e) {
     } catch (JSONException e) {
     e.printStackTrace();
     } finally {
     if (vmConnection != null) {
     vmConnection.disconnect();
     }
     try {
     if (reader != null) {
     reader.close();
     }
     } catch (IOException e) {
     }
     }
     pd.dismiss();
     }
     ***********/

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


    //protected void onNewIntent(Intent intent) {
    //    super.onNewIntent(intent);

    // Set the refreshSettings flag so the app settings are refreshed in onStart
    //    mRefreshSettings = true;

    // New intent was received so set it to use in onStart
    //   setIntent(intent);
    //}


    /**************************
     // The device interface orientation has changed
     @Override
     public void onConfigurationChanged(Configuration newConfig) {
     super.onConfigurationChanged(newConfig);

     // Refresh the video size after it is painted
     ViewTreeObserver viewTreeObserver = local_camera_view.getViewTreeObserver();
     if (viewTreeObserver.isAlive()) {
     viewTreeObserver.addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
     @Override
     public void onGlobalLayout() {
     local_camera_view.getViewTreeObserver().removeOnGlobalLayoutListener(this);

     // Width/height values of views not updated at this point so need to wait
     // before refreshing UI

     refreshUI();
     }
     });
     }
     }
     *******************/

    /*
     * Private Utility Functions
     */

    // Callback containing the result of the permissions request. If permissions were not previously,
    // obtained, wait until this is received until calling startVidyoConnector where Connector is constructed.
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {

        // If the expected request code is received, start VidyoConnector
        if (requestCode == PERMISSIONS_REQUEST_ALL) {
            for (int i = 0; i < permissions.length; ++i)
                startVidyoConnector();
        } else {
        }
    }

    private void logit(String s) {
        for(int i=0; i < 20; i++)
            System.out.println(s);
    }

    // Construct Connector and register for event listeners.
    private void startVidyoConnector() {

        // Wait until local_camera_view is drawn until getting started.
        ViewTreeObserver viewTreeObserver = local_camera_view.getViewTreeObserver();
        boolean isAlive = viewTreeObserver.isAlive();
        if (isAlive) {
            viewTreeObserver.addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
                @Override
                public void onGlobalLayout() {
                    local_camera_view.getViewTreeObserver().removeOnGlobalLayoutListener(this);

                    // Construct Connector
                    try {

                        // LAME - can't put a breakpoint here
                        mVidyoConnector = new Connector(null, // null for custom layouts - IMPORTANT ! this is how you get the video to take
                                // up the whole video frame !
                                // BUT null means the "camera flip" button won't activate the back camera (probably doesn't matter)
                                Connector.ConnectorViewStyle.VIDYO_CONNECTORVIEWSTYLE_Default,
                                1,
                                "error@VidyoClient error@VidyoConnector error", // don't know what these next 3 lines do
                                "",
                                0);

                        // Set the client version in the toolbar
                        String version =  mVidyoConnector.getVersion();
                        System.out.println("startVidyoConnector():  mVidyoConnector.getVersion() = "+mVidyoConnector.getVersion());

                        // Set initial position
                        //refreshUI();

                        // Register for local camera events
                        mVidyoConnector.registerLocalCameraEventListener((Connector.IRegisterLocalCameraEventListener) VidyoChatFragment_Vidyo.this);

                        mVidyoConnector.registerLocalMicrophoneEventListener((Connector.IRegisterLocalMicrophoneEventListener) VidyoChatFragment_Vidyo.this);

                        // Register for remote camera events - this is the good stuff right here :)
                        mVidyoConnector.registerRemoteCameraEventListener((Connector.IRegisterRemoteCameraEventListener) VidyoChatFragment_Vidyo.this);

                        mVidyoConnector.registerRemoteMicrophoneEventListener((Connector.IRegisterRemoteMicrophoneEventListener) VidyoChatFragment_Vidyo.this);

                        // Register for network interface events
                        mVidyoConnector.registerNetworkInterfaceEventListener((Connector.IRegisterNetworkInterfaceEventListener) VidyoChatFragment_Vidyo.this);

                        // Register for log events
                        // You can do this, but it's going to fill up the console with crap and you'll never be able to find YOUR log output
                        //mVidyoConnector.registerLogEventListener((Connector.IRegisterLogEventListener) VidyoChatFragment.this, "info@VidyoClient info@VidyoConnector warning");

                        // Apply the app settings
                        applySettings();
                    }
                    catch (Throwable e) {
                        logit("startVidyoConnector: Throwable!  "+e);
                    }
                }

                // Apply some of the app settings
                public void applySettings() {
                    // If enableDebug is configured then enable debugging
                    if (mEnableDebug) {
                        mVidyoConnector.enableDebug(7776, "warning info@VidyoClient info@VidyoConnector");
                    } else {
                        mVidyoConnector.disableDebug();
                    }

//                    // If cameraPrivacy is configured then mute the camera
//                    camera_button.setChecked(false); // reset state
//                    if (mCameraPrivacy) {
//                        camera_button.performClick();
//                    }

                    // If microphonePrivacy is configured then mute the microphone
                    microphone_button.setChecked(false); // reset state
                    if (mMicrophonePrivacy) {
                        microphone_button.performClick();
                    }

                    /********
                     // Set experimental options if any exist
                     if (mExperimentalOptions != null) {
                     ConnectorPkg.setExperimentalOptions(mExperimentalOptions);
                     }

                     // If configured to auto-join, then simulate a click of the toggle connect button
                     if (mAutoJoin) {
                     connect_button.performClick();
                     }
                     ***********/
                }
            });
        }
    }

    /****************************
     // Refresh the UI
     private void refreshUI() {
     // Refresh the rendering of the video
     System.out.println("refreshUI:  mLastSelectedCamera = "+mLastSelectedCamera);
     mVidyoConnector.assignViewToLocalCamera(local_camera_view, mLastSelectedCamera, false, false);
     mVidyoConnector.showViewAt(local_camera_view, 100, 0, local_camera_view.getWidth(), local_camera_view.getHeight());
     }
     **************/


    // The state of the VidyoConnector vmConnection changed, reconfigure the UI.
    // If connected, dismiss the controls layout
    private void changeState(VidyoConnectorState state) {

        mVidyoConnectorState = state;

        System.out.println("getActivity() = "+getActivity());

        // Execute this code on the main thread since it is updating the UI layout.
        getActivity().runOnUiThread(new Runnable()
                                    {
                                        @Override
                                        public void run() {

                                            // REGARDING ALL THE COMMENTED-OUT Toast CALLS...
                                            // I think the call in case Connected was throwing a nasty exception because we are
                                            // now connecting automatically whenever both participants (video/list/[key]/video_participants) are 'present'
                                            // The problem (I think) is that getActivity() above is not ready at the point that we
                                            // call changeState() - hence the exception.


                                            // Depending on the state, do a subset of the following:
                                            // - update the toggle connect button to either start call or end call image: connect_button
                                            // - display toolbar in case it is hidden: mToolbarLayout
                                            // - show/hide the vmConnection spinner: mConnectionSpinner
                                            // - show/hide the input form: mControlsLayout
                                            switch (mVidyoConnectorState) {
                                                case Connecting:
                                                    connect_button.setChecked(true);
                                                    //mConnectionSpinner.setVisibility(View.VISIBLE);
//                            Toast.makeText(getActivity(), "connecting", Toast.LENGTH_SHORT).show();
                                                    break;

                                                case Connected:
                                                    connect_button.setChecked(true);
                                                    //record_button.setVisibility(View.VISIBLE);
                                                    //mConnectionSpinner.setVisibility(View.INVISIBLE);
//                            Toast.makeText(getActivity(), "connected", Toast.LENGTH_SHORT).show();
                                                    break;

                                                case Disconnecting:
                                                    // See VideoChatVC.connectionClicked() - the 'if connected' block
                                                    if(recording) {
                                                        stopRecording();
                                                    }

                                                    // unrid()  // TODO create this method similar to VideoChatVC.unrid() in Swift

                                                    // The button just switched to the callStart image.
                                                    // Change the button back to the callEnd image because do not want to assume that the Disconnect
                                                    // call will actually end the call. Need to wait for the callback to be received
                                                    // before swapping to the callStart image.
                                                    connect_button.setChecked(true);
                                                    //record_button.setVisibility(View.GONE);
//                            Toast.makeText(getActivity(), "disconnecting", Toast.LENGTH_SHORT).show();
                                                    break;

                                                case Disconnected:
                                                    //record_button.setVisibility(View.GONE);
//                            Toast.makeText(getActivity(), "disconnected", Toast.LENGTH_SHORT).show();
                                                    connect_button.setChecked(false);
                                                    break;
                                                case DisconnectedUnexpected:
                                                    // TODO not sure what to do about these error conditions
                                                    // displaying this kind of toast isn't helpful for the user
                                                    //Toast.makeText(getActivity(), "disconnect unexpected", Toast.LENGTH_SHORT).show();
                                                    break;
                                                case Failure:
                                                    // TODO not sure what to do about these error conditions
                                                    // displaying this kind of toast isn't helpful for the user
                                                    //Toast.makeText(getActivity(), "failure", Toast.LENGTH_SHORT).show();
                                                    break;
                                                case FailureInvalidResource:
                                                    // TODO not sure what to do about these error conditions
                                                    // displaying this kind of toast isn't helpful for the user
                                                    //Toast.makeText(getActivity(), "invalid resource", Toast.LENGTH_SHORT).show();
                                                    connect_button.setChecked(false);
                                                    //mConnectionSpinner.setVisibility(View.INVISIBLE);

                                                    /************
                                                     // If a return URL was provided as an input parameter, then return to that application
                                                     if (mReturnURL != null) {
                                                     // Provide a callstate of either 0 or 1, depending on whether the call was successful
                                                     Intent returnApp = getActivity().getPackageManager().getLaunchIntentForPackage(mReturnURL);
                                                     returnApp.putExtra("callstate", (mVidyoConnectorState == VidyoConnectorState.Disconnected) ? 1 : 0);
                                                     startActivity(returnApp);
                                                     }

                                                     // If the allow-reconnect flag is set to false and a normal (non-failure) disconnect occurred,
                                                     // then disable the toggle connect button, in order to prevent reconnection.
                                                     if (!mAllowReconnect && (mVidyoConnectorState == VidyoConnectorState.Disconnected)) {
                                                     connect_button.setEnabled(false);
                                                     //mToolbarStatus.setText("Call ended");
                                                     }

                                                     if (!mHideConfig ) {
                                                     // Display the controls
                                                     //mControlsLayout.setVisibility(View.VISIBLE);
                                                     }
                                                     ************/
                                                    break;
                                                // There aren't cased for recoding started and recording stopped because we already
                                                // have this method call: record_button.setOnCheckedChangeListener
                                            }
                                        }
                                    }
        );
    }

    /*
     * Button Event Callbacks
     */

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.connect_button:
                // Connect or disconnect.
                connectionClicked();
                break;

            /***********  read NOTE below as to why commented out
             case R.id.camera_switch:
             // Cycle the camera.
             // NOTE: This seems to be broken by the null viewId that we use when we initialize
             // the mVidyoConnector object earlier in this class.  Doesn't really matter that we can't flip the
             // camera around I guess
             mVidyoConnector.cycleCamera();
             break;
             *************/
//            case R.id.camera_button:
//                // Toggle the camera privacy.
//                mCameraPrivacy = camera_button.isChecked();
//                mVidyoConnector.setCameraPrivacy(mCameraPrivacy);
//                break;

            case R.id.microphone_button:
                // Toggle the microphone privacy.
                mMicrophonePrivacy = microphone_button.isChecked();
                mVidyoConnector.setMicrophonePrivacy(mMicrophonePrivacy);
                break;

            //case R.id.toggle_debug:
            // Toggle debugging.
            //    mEnableDebug = !mEnableDebug;
            //    if (mEnableDebug) {
            //        mVidyoConnector.enableDebug(7776, "warning info@VidyoClient info@VidyoConnector");
            //        mClientVersion.setVisibility(View.VISIBLE);
            //    } else {
            //        mVidyoConnector.disableDebug();
            //        mClientVersion.setVisibility(View.INVISIBLE);
            //    }
            //    break;

            default:
                break;
        }
    }

    // The Connect button was pressed.
    // If not in a call, attempt to connect to the backend service.
    // If in a call, disconnect.
    // See in Swift: VideoChatVC.connectionClicked()
    public void connectionClicked() {
        if(currentVideoNode == null)
            return;
        VideoParticipant vp = currentVideoNode.getParticipant(User.getInstance().getUid());
        if(vp == null)
            return;
        showSpinner(); // dismissed in doConnect() and doDisconnect()
        String request_type = "connect request";
        if(vp.isConnected()) {
            request_type = "disconnect request";
        }
        VideoEvent ve = new VideoEvent(User.getInstance(), currentVideoNode.getKey(), /*room_id*/currentVideoNode.getKey(), request_type);
        ve.save();





//        This is the old way of connecting/disconnecting

//        // The logic for Android is opposite from the iOS logic.  Here, connect_button.isChecked() means we just
//        // touched the connect_button but we haven't made the vmConnection yet.  In the iOS version (VideoChatVC.connectionClicked()),
//        // "if connected..." means we already are connected and we want to disconnect
//        if (connectionRequested()) {
//            doConnect();
//        } else {
//            // The user is either connected to a resource or is in the process of connecting to a resource;
//            // Call VidyoConnectorDisconnect to either disconnect or abort the vmConnection attempt.
//            changeState(VidyoConnectorState.Disconnecting);
//            mVidyoConnector.disconnect();
//        }
    }

//    private boolean connectionRequested() {
//        return connect_button.isChecked();
//    }

    private void connectIfNotConnected() {
        //TODO if we put this auto-connect logic back in, we have to remember that we connect using "connect request" calls now.  We don't directly call doConnect()
//        if(mVidyoConnectorState != VidyoConnectorState.Connected)
//            doConnect();
//        else Log.d(TAG, "already connected to Vidyo server");
    }

    // modeled after Swift VideoChatVC.doConnect()
    private void doConnect() {
        //changeState(VidyoConnectorState.Connecting);
        if(mVidyoConnector==null) return;
        String token = getToken();

        final boolean status = mVidyoConnector.connect(
                "prod.vidyo.io",
                token,
                User.getInstance().getName(),
                getRoom_id(),
                this);

        record_button.setVisibility(View.VISIBLE);
        dismissSpinner();

        // TODO what should we do here? Don't like the changeState() method
        if (!status) {
            changeState(VidyoConnectorState.Failure);
        }
    }

    private void doDisconnect() {
        if(mVidyoConnector!=null) mVidyoConnector.disconnect();
        record_button.setVisibility(View.GONE);
        dismissSpinner();
    }

    private void showSpinner() {
        video_chat_spinner.setVisibility(View.VISIBLE);
    }

    // See Swift VideoChatVC.startRecording()
    private void startRecording() {
        if(currentVideoNode.getLeg_id() == null)
            chooseLegislatorFirst();
        else {
            recording = true;
            showSpinner();
            record_button.setBackgroundResource(R.drawable.recordstop);
            createRecordingEvent("start recording");
            publish_button.setVisibility(View.GONE);
        }
    }

    // See Swift VideoChatVC.stopRecording()
    private void stopRecording() {
        recording = false;
        record_button.setBackgroundResource(R.drawable.record);
        createRecordingEvent("stop recording");
        publish_button.setVisibility(View.VISIBLE);
    }

    private void dismissSpinner() {
        video_chat_spinner.setVisibility(View.GONE);
    }

    // See Swift VideoChatVC.createRecordingEvent()
    private void createRecordingEvent(String request_type) {
        // write at least this much to /video/video_events
        Map recording_request = new HashMap();
        recording_request.put("request_type", request_type);
        recording_request.put("video_node_key", User.getInstance().getCurrent_video_node_key());
        recording_request.put("room_id", User.getInstance().getCurrent_video_node_key());
        recording_request.put("uid", User.getInstance().getUid());
        recording_request.put("date", Util.getDate_MMM_d_yyyy_hmm_am_z());
        recording_request.put("date_ms", Util.getDate_as_millis());
        // might also want to capture who made the request and when

        // There's a trigger function: exports.dockerRequest that listens for writes to this node
        // and selects a docker instance that can serve as "recording secretary" for the call
        FirebaseDatabase.getInstance().getReference("video/video_events").push().setValue(recording_request);
    }


    private void publishClicked() {
        showSpinner();
        // See google-cloud.js:dockerRequest()
        createRecordingEvent("start publishing");
    }

    /*
     *  Connector Events
     */

    // Handle successful vmConnection.
    @Override
    public void onSuccess() {
        changeState(VidyoConnectorState.Connected);
    }

    // Handle attempted vmConnection failure.
    @Override
    public void onFailure(Connector.ConnectorFailReason reason) {
        changeState(VidyoConnectorState.Failure);
        reasons = reason.toString();
    }

    // Handle an existing session being disconnected.
    @Override
    public void onDisconnected(Connector.ConnectorDisconnectReason reason) {
        if (reason == Connector.ConnectorDisconnectReason.VIDYO_CONNECTORDISCONNECTREASON_Disconnected) {
            changeState(VidyoConnectorState.Disconnected);
        } else {
            changeState(VidyoConnectorState.DisconnectedUnexpected);
        }
    }

    // Equiv in XCode is VideoChatVC.onLocalCameraAdded()
    // Handle local camera events.
    @Override
    public void onLocalCameraAdded(LocalCamera localCamera) {
        this.localCamera = localCamera;
        if(mVidyoConnector != null) {
            // We set displayCropped:true on Android because that gets rid any any little black borders around
            // the video frames.  In XCode, I didn't have to do this because I was able to figure out the dimensions
            // of the parent view programmatically
            mVidyoConnector.assignViewToLocalCamera(local_camera_view, localCamera, true, false);
            mVidyoConnector.showViewAt(local_camera_view, 0, 0, local_camera_view.getWidth(), local_camera_view.getHeight());
        }
    }

    @Override
    public void onLocalCameraRemoved(LocalCamera localCamera) {
    }

    @Override
    public void onLocalCameraSelected(LocalCamera localCamera) {

        // If a camera is selected, then update mLastSelectedCamera.
        if (localCamera != null) {
            mLastSelectedCamera = localCamera;
            mLastSelectedCamera.setPreviewLabel(User.getInstance().getName());
        }
    }

    @Override
    public void onLocalCameraStateUpdated(LocalCamera localCamera, Device.DeviceState state) {
    }

    @Override
    public void onLocalMicrophoneAdded(LocalMicrophone localMicrophone) {
        System.out.println("onLocalMicrophoneAdded");
    }

    @Override
    public void onLocalMicrophoneRemoved(LocalMicrophone localMicrophone) {
        System.out.println("onLocalMicrophoneRemoved");
    }

    @Override
    public void onLocalMicrophoneSelected(LocalMicrophone localMicrophone) {
        System.out.println("onLocalMicrophoneSelected");

    }

    @Override
    public void onLocalMicrophoneStateUpdated(LocalMicrophone localMicrophone, Device.DeviceState deviceState) {
        System.out.println("onLocalMicrophoneStateUpdated");
    }

    @Override
    public void onRemoteMicrophoneAdded(RemoteMicrophone remoteMicrophone, Participant participant) {

    }

    @Override
    public void onRemoteMicrophoneRemoved(RemoteMicrophone remoteMicrophone, Participant participant) {

    }

    @Override
    public void onRemoteMicrophoneStateUpdated(RemoteMicrophone remoteMicrophone, Participant participant, Device.DeviceState deviceState) {

    }

    // Handle a message being logged.
    @Override
    public void onLog(LogRecord logRecord) {
    }

    // Handle network interface events
    @Override
    public void onNetworkInterfaceAdded(NetworkInterface vidyoNetworkInterface) {
    }

    @Override
    public void onNetworkInterfaceRemoved(NetworkInterface vidyoNetworkInterface) {
    }

    @Override
    public void onNetworkInterfaceSelected(NetworkInterface vidyoNetworkInterface, NetworkInterface.NetworkInterfaceTransportType vidyoNetworkInterfaceTransportType) {
    }

    @Override
    public void onNetworkInterfaceStateUpdated(NetworkInterface vidyoNetworkInterface, NetworkInterface.NetworkInterfaceState vidyoNetworkInterfaceState) {
    }


    // NOTE: See the commented-out method refreshUI() in this class - that method may bring the remote camera view back to life
    // after the iPhone reconnects
    // per Connector.IRegisterRemoteCameraEventListener
    @Override
    public void onRemoteCameraAdded(RemoteCamera remoteCamera, Participant participant) {
        // see XCode VideoChatVC.onRemoteCameraAdded()  line 751
        if(mVidyoConnector != null) {
            // We set displayCropped:true on Android because that gets rid any any little black borders around
            // the video frames.  In XCode, I didn't have to do this because I was able to figure out the dimensions
            // of the parent view programmatically
            remoteCameraVisible = true;
            inviteLinks();
            mVidyoConnector.assignViewToRemoteCamera(remote_camera_view, remoteCamera, true, false);//.assignViewToLocalCamera(local_camera_view, localCamera, true, false);
            mVidyoConnector.showViewAt(remote_camera_view, 0, 0, remote_camera_view.getWidth(), remote_camera_view.getHeight());
        }

    }

    // per Connector.IRegisterRemoteCameraEventListener
    @Override
    public void onRemoteCameraRemoved(RemoteCamera remoteCamera, Participant participant) {
        System.out.println("onRemoteCameraRemoved ---------");
        remoteCameraVisible = false;
        inviteLinks();
//        if(mVidyoConnector != null) {
//            mVidyoConnector.assignViewToRemoteCamera(remote_camera_view, null, false, false);//.assignViewToLocalCamera(local_camera_view, localCamera, true, false);
//            mVidyoConnector.showViewAt(remote_camera_view, 0, 0, 0, 0);
//        }
    }

    // per Connector.IRegisterRemoteCameraEventListener
    @Override
    public void onRemoteCameraStateUpdated(RemoteCamera remoteCamera, Participant participant, Device.DeviceState deviceState) {
        System.out.println("onRemoteCameraStateUpdated:  deviceState = "+deviceState);
    }


    public void doPositiveClick() {
        // Do stuff here.
        System.out.println("FragmentAlertDialog: Positive click!");
    }

    public void doNegativeClick() {
        // Do stuff here.
        System.out.println("FragmentAlertDialog: Negative click!");
    }

}
