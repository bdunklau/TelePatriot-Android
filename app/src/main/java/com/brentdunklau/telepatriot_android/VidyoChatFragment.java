package com.brentdunklau.telepatriot_android;

import android.Manifest;
import android.app.ProgressDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.StrictMode;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.TextView;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.Toast;
import android.widget.ToggleButton;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;

import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import com.brentdunklau.telepatriot_android.util.Legislator;
import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.VideoNode;
import com.brentdunklau.telepatriot_android.util.VideoType;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.vidyo.VidyoClient.Connector.ConnectorPkg;
import com.vidyo.VidyoClient.Connector.Connector;
import com.vidyo.VidyoClient.Device.Device;
import com.vidyo.VidyoClient.Device.LocalCamera;
import com.vidyo.VidyoClient.Device.RemoteCamera;
import com.vidyo.VidyoClient.Endpoint.LogRecord;
import com.vidyo.VidyoClient.Endpoint.Participant;
import com.vidyo.VidyoClient.NetworkInterface;

import org.json.JSONException;
import org.json.JSONObject;


public class VidyoChatFragment extends BaseFragment implements
        View.OnClickListener,
        Connector.IConnect,
        Connector.IRegisterLogEventListener,
        Connector.IRegisterNetworkInterfaceEventListener,
        Connector.IRegisterLocalCameraEventListener,
        Connector.IRegisterRemoteCameraEventListener,
        IVideoFrameListener {

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

    // Helps check whether app has permission to access what is declared in its manifest.
    // - Permissions from app's manifest that have a "protection level" of "dangerous".
    private static final String[] mPermissions = new String[] {
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
    };
    // - This arbitrary, app-internal constant represents a group of requested permissions.
    // - For simplicity, this app treats all desired permissions as part of a single group.
    private final int PERMISSIONS_REQUEST_ALL = 1988;

    private VidyoConnectorState mVidyoConnectorState = VidyoConnectorState.Disconnected;
    private boolean mVidyoClientInitialized = false;
    private Connector mVidyoConnector = null;
    private LocalCamera mLastSelectedCamera = null;
    private ToggleButton mToggleConnectButton;
    private ToggleButton mMicrophonePrivacyButton;
    private ToggleButton mCameraPrivacyButton;
    //private ProgressBar mConnectionSpinner;
    //private LinearLayout mControlsLayout;
    private LinearLayout mToolbarLayout;
    private EditText mHost;
    public EditText mDisplayName;
    public static EditText mToken;
    private EditText mResourceId;
    private TextView mToolbarStatus;
    private TextView mClientVersion;
    private VideoFrameLayout mVideoFrame;
    private VideoFrameLayout remoteFrame;
    private boolean mHideConfig = false;
    private boolean mAutoJoin = false;
    private boolean mAllowReconnect = true;
    private boolean mCameraPrivacy = false;
    private boolean mMicrophonePrivacy = false;
    private boolean mEnableDebug = false;
    private String mReturnURL = null;
    private String mExperimentalOptions = null;
    private MainActivity mSelf;
    private boolean mRefreshSettings = true;
    private boolean mDevicesSelected = true;
    private View myView;
    public static String jsonTokenData;
    private ToggleButton mRecord;
    private DatabaseReference userDatabase;
    private URL url = null;
    private HttpURLConnection connection;
    private String mTimeMS;
    private String mTime;
    private String uid;
    //private int missionKey;
    private Integer videoTypeKey;
    private String room; // the initiator's user id
    private String missionDescription;  // we can probably get rid of this - we have vidyoChatDescriptionText
    private String nodeKey;
    private TextView vidyoChatDescriptionText;
    private EditText mRepEdit;
    private EditText mFBEdit;
    private EditText mTwitterEdit;
    private TextView mRepButton;
    private TextView mFBButton;
    private TextView mTwitterButton;
    private TextView mRepName;
    private TextView mRepFB;
    private TextView mRepTwitter;
    private TextView mDescriptionEditButton;
    //private EditText mDescriptionEditText;
    private TextView mYouTubeEditButton;
    //private EditText mYouTubeEditText;
    private TextView mYouTubeDescription;
    private Legislator legislator;
    private ProgressDialog pd;
    private String reasons;
    private LocalCamera localCamera;
    private VideoNode currentVideoNode;

    /*
     *  Operating System Events
     */

    @Nullable
    @Override
    public View onCreateView (LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState){
        myView = inflater.inflate(R.layout.vidyo_chat_fragment,container,false);

        int SDK_INT = android.os.Build.VERSION.SDK_INT;
        if (SDK_INT > 8)
        {
            StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder()
                    .permitAll().build();
            StrictMode.setThreadPolicy(policy);
            //your codes here
            getToken();
        }

        // We need to know if we are coming to this screen from a video invitation or if the user
        // is initiating a video chat
        // How would we tell?
        // Option 1: Users have a "currentVideoNodeKey" attribute.  If we make sure this attribute is
        //          set before the user gets here, then it won't matter if they are initiator or guest

        List<VideoType> videoTypes = VideoType.getTypes();
        //TODO make dynamic mission keys
        VideoType videoType = videoTypes.get(0); // TODO how are we going to choose different video types?
        videoTypeKey = videoType.getKey();
        missionDescription = videoType.getVideo_mission_description();
        uid =  User.getInstance().getUid();
        // Initialize the member variables
        //mControlsLayout = myView.findViewById(R.id.controls_layout);
        //mToolbarLayout = (LinearLayout) findViewById(R.id.toolbarLayout);
        mVideoFrame = myView.findViewById(R.id.vidyoChatMyScreen);
        remoteFrame = myView.findViewById(R.id.remoteChatScreen);
        //mVideoFrame.Register(this);
        //TODO change editText to import data
        mHost = myView.findViewById(R.id.host);
        mHost.setText("prod.vidyo.io");
        mDisplayName = myView.findViewById(R.id.displayName);
        mDisplayName.setText(User.getInstance().getName());
        mToken = myView.findViewById(R.id.token);
        mResourceId = myView.findViewById(R.id.resource);
        mResourceId.setText(getRoom());
        mToolbarStatus = myView.findViewById(R.id.toolbarStatusText);
        mClientVersion = myView.findViewById(R.id.clientVersion);
        //mConnectionSpinner = myView.findViewById(R.id.connectionSpinner);
        mSelf = (MainActivity) getActivity();
        mToken.setText(jsonTokenData);
        vidyoChatDescriptionText = myView.findViewById(R.id.videoChatDescriptionText);
        vidyoChatDescriptionText.setText(videoType.getVideo_mission_description());
        mRepName = myView.findViewById(R.id.videoChatRepInfo);
        mRepFB = myView.findViewById(R.id.videoChatRepFBInfo);
        mRepTwitter = myView.findViewById(R.id.videoChatRepTwitterInfo);
        mRepEdit = myView.findViewById(R.id.repNameEdit);
        mRepButton = myView.findViewById(R.id.repEdit);
        mRepButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                chooseLegislator();
            }
        });
        mFBButton = myView.findViewById(R.id.fbEdit);
        mFBEdit = myView.findViewById(R.id.fbRepEdit);
        mFBButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                setFBInfo();
            }
        });
        mTwitterEdit = myView.findViewById(R.id.twitterInfoEdit);
        mTwitterButton = myView.findViewById(R.id.twitterEdit);
        mTwitterButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                setTwitterInfo();
            }
        });

        mDescriptionEditButton = myView.findViewById(R.id.editDescriptionButon);
        mDescriptionEditButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                editVideoMissionDescription();
            }
        });

        mYouTubeDescription = myView.findViewById(R.id.videoChatYouTubeDescription);
        //mYouTubeEditText = myView.findViewById(R.id.editYouTubeDescription);
        mYouTubeEditButton = myView.findViewById(R.id.editYouTubeButton);
        mYouTubeEditButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                editYouTubeDescription();
            }
        });


        // Set the onClick listeners for the buttons
        mToggleConnectButton = myView.findViewById(R.id.videoChatConnectButton);
        mToggleConnectButton.setOnClickListener(this);
        mMicrophonePrivacyButton = myView.findViewById(R.id.microphone_on_button);
        mMicrophonePrivacyButton.setOnClickListener(this);
        mCameraPrivacyButton = myView.findViewById(R.id.camera_on_button);
        mCameraPrivacyButton.setOnClickListener(this);
        /*********
        ToggleButton button;
        button = myView.findViewById(R.id.camera_switch);
        button.setOnClickListener(this);
         *********/
        mRecord = myView.findViewById(R.id.recordButton);


        // Set the application's UI context to this activity.
        ConnectorPkg.setApplicationUIContext(getActivity());

        // Initialize the VidyoClient library - this should be done once in the lifetime of the application.
        mVidyoClientInitialized = ConnectorPkg.initialize();

        String vtype = "Video Petition"; // TODO at some point, get this from the database
        final String videoNodeKey = getVideoNodeKey(vtype);

        if(videoNodeKey != null) {
            FirebaseDatabase.getInstance().getReference("video/list/" + videoNodeKey).addValueEventListener(new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot dataSnapshot) {
                    VideoNode vnode = dataSnapshot.getValue(VideoNode.class);
                    if(vnode == null) return;
                    currentVideoNode = vnode;
                    currentVideoNode.setKey(videoNodeKey);
                    vidyoChatDescriptionText.setText(currentVideoNode.getVideo_mission_description());
                    legislator = currentVideoNode.getLegislator();
                    mYouTubeDescription.setText(currentVideoNode.getYoutube_video_description());
                }

                @Override
                public void onCancelled(DatabaseError databaseError) { }
            });
        }

        mRecord.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {


                int SDK_INT = android.os.Build.VERSION.SDK_INT;
                if (SDK_INT > 8)
                {
                    StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder()
                            .permitAll().build();
                    StrictMode.setThreadPolicy(policy);
                    //your codes here

                    if (isChecked){

                        mRecord.setBackgroundResource(R.drawable.recordstop);

                        try {
                            url = new URL("http://35.185.56.20/record/demoRoom/uniquefield");
                            connection = (HttpURLConnection) url.openConnection();
                            OutputStream stream= new BufferedOutputStream(connection.getOutputStream());

                            Toast.makeText(mSelf, "Docker connection", Toast.LENGTH_SHORT).show();
                        } catch (MalformedURLException e) {
                            Toast.makeText(mSelf, "Malformed", Toast.LENGTH_SHORT).show();
                            e.printStackTrace();
                        } catch (IOException e) {
                            Toast.makeText(mSelf, "IOE", Toast.LENGTH_SHORT).show();
                            e.printStackTrace();
                        }

                        long timeMS = System.currentTimeMillis();
                        mTimeMS = String.valueOf(timeMS);
                        Date date = Calendar.getInstance().getTime();
                        mTime = String.valueOf(date);


                        Map<String, String> videoListMap = new HashMap<>();
                        videoListMap.put("node_create_date", mTime);
                        videoListMap.put("node_create_date_ms", mTimeMS);
                        videoListMap.put("video_mission_description", missionDescription);

                        // looks like multi-path update
                        userDatabase = FirebaseDatabase.getInstance().getReference();
                        DatabaseReference pushed = userDatabase.child("video").child("list").push();
                        nodeKey = pushed.getKey();
                        pushed.setValue(videoListMap);

                        String email = User.getInstance().getEmail();
                        String name = User.getInstance().getName();

                        Map<String, String> participantMap = new HashMap<>();

                        participantMap.put("email", email);
                        participantMap.put("name", name);
                        participantMap.put("start_date", mTime);
                        participantMap.put("start_date_ms", mTimeMS);
                        participantMap.put("uid", uid);

                        pushed.child("video_participants").child("0").setValue(participantMap);


                    } else {
                        mRecord.setBackgroundResource(R.drawable.record);
                        if (url != null){
                            connection.disconnect();
                            url = null;
                        }

                    }
                }
            }
        });

        /*******
        if(room != null) {
            mToggleConnectButton.setChecked(true);
            _mVidyoConnector();
            toggleConnect();
        }
         ********/

        return myView;
    }
    @Override
    public void onStart() {
        super.onStart();
        // Initialize or refresh the app settings.
        // When app is first launched, mRefreshSettings will always be true.
        // Each successive time that onStart is called, app is coming back to foreground so check if the
        // settings need to be refreshed again, as app may have been launched via URI.



        mRefreshSettings = false;


        // If Vidyo Client has been successfully initialized and the Connector has
        // not yet been constructed, then check permissions and construct Connector.
        if (mVidyoClientInitialized && mVidyoConnector == null) {
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

    @Override
    public void onResume() {
        super.onResume();

        // Set the application's UI context to this activity.
        //ConnectorPkg.setApplicationUIContext(getActivity());

        // Initialize the VidyoClient library - this should be done once in the lifetime of the application.
        //mVidyoClientInitialized = ConnectorPkg.initialize();
    }

    @Override
    public void onPause() {
        super.onPause();
    }

    @Override
    public void onStop() {
        super.onStop();

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
            return vn.getKey();
        }
    }

    private VideoNode createVideoNode(String t) {
        VideoType vtype = VideoType.getType(t /*"Video Petition"*/);
        if(vtype == null)
            return null; // might want some sensible default

        return new VideoNode(User.getInstance(), vtype);
    }

    public void setRoom(String room) {
        this.room = room;
    }

    public String getRoom() {
        if(room == null)
            room = User.getInstance().getUid();
        return room;
    }

    private void getToken() {
        pd = new ProgressDialog(getActivity());
        pd.setMessage("Please Wait");
        pd.show();

        HttpURLConnection connection = null;
        BufferedReader reader = null;

        //TODO make dynamic

        try {
            String tokenThing = User.getInstance().getUid();
            if(tokenThing.contains("@")){
                tokenThing = tokenThing.replaceAll("@","_");
            }
            String urlString = "https://us-central1-telepatriot-bd737.cloudfunctions.net/generateVidyoToken?userName=" + tokenThing;
            URL url = new URL(urlString);

            connection = (HttpURLConnection) url.openConnection();
            connection.connect();
            InputStream inputStream = connection.getInputStream();
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
            if (connection != null) {
                connection.disconnect();
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

    private void editYouTubeDescription() {
        if (mYouTubeEditButton.getText().toString().trim().equals("Edit")){
            mYouTubeDescription.setVisibility(View.INVISIBLE);
            //mYouTubeEditText.setVisibility(View.VISIBLE);
            mYouTubeEditButton.setText("Done");
        }else{
            //mYouTubeDescription.setText(mYouTubeEditText.getText());
            mYouTubeDescription.setVisibility(View.VISIBLE);
            //mYouTubeEditText.setVisibility(View.GONE);
            mYouTubeEditButton.setText("Edit");
        }
    }

    private void editVideoMissionDescription() {
        // custom dialog
        EditVideoMissionDescriptionDlg dialog = new EditVideoMissionDescriptionDlg(getActivity(), currentVideoNode);
        dialog.show();
    }

    private void setTwitterInfo() {
        if (mTwitterButton.getText().toString().equals("Edit")) {
            mRepTwitter.setVisibility(View.INVISIBLE);
            mTwitterEdit.setVisibility(View.VISIBLE);
            mTwitterButton.setText("Done");
        }else {
            mRepTwitter.setText(mTwitterEdit.getText().toString().trim());
            mRepTwitter.setVisibility(View.VISIBLE);
            mTwitterEdit.setVisibility(View.GONE);
            mTwitterButton.setText("Edit");
        }
    }

    private void setFBInfo() {
        if (mFBButton.getText().toString().equals("Edit")) {
            mRepFB.setVisibility(View.INVISIBLE);
            mFBEdit.setVisibility(View.VISIBLE);
            mFBButton.setText("Done");
        }else {
            mRepFB.setText(mRepEdit.getText().toString().trim());
            mRepFB.setVisibility(View.VISIBLE);
            mFBEdit.setVisibility(View.GONE);
            mFBButton.setText("Edit");
        }
    }

    private void chooseLegislator() {
        EditLegislatorForVideoDlg dialog = new EditLegislatorForVideoDlg(getActivity(), currentVideoNode);
        dialog.show();

        /************
        if (mRepButton.getText().toString().equals("Edit")) {
            mRepName.setVisibility(View.INVISIBLE);
            mRepEdit.setVisibility(View.VISIBLE);
            mRepButton.setText("Done");
        }else {
            mRepName.setText(mRepEdit.getText().toString().trim());
            mRepName.setVisibility(View.VISIBLE);
            mRepEdit.setVisibility(View.GONE);
            mRepButton.setText("Edit");
        }
        **************/
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
        ViewTreeObserver viewTreeObserver = mVideoFrame.getViewTreeObserver();
        if (viewTreeObserver.isAlive()) {
            viewTreeObserver.addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
                @Override
                public void onGlobalLayout() {
                    mVideoFrame.getViewTreeObserver().removeOnGlobalLayoutListener(this);

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

        // Wait until mVideoFrame is drawn until getting started.
        ViewTreeObserver viewTreeObserver = mVideoFrame.getViewTreeObserver();
        boolean isAlive = viewTreeObserver.isAlive();
        if (isAlive) {
            viewTreeObserver.addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
                @Override
                public void onGlobalLayout() {
                    mVideoFrame.getViewTreeObserver().removeOnGlobalLayoutListener(this);

                    // Construct Connector
                    try {

                        // LAME - can't put a breakpoint here
                        mVidyoConnector = new Connector(null, // null for custom layouts - IMPORTANT ! this is how you get the video to take
                                // up the whole video frame !
                                // BUT null means the "camera flip" button won't activate the back camera (probably doesn't matter)
                                Connector.ConnectorViewStyle.VIDYO_CONNECTORVIEWSTYLE_Default,
                                1,
                                "info@VidyoClient info@VidyoConnector warning", // don't know what these next 3 lines do
                                "",
                                0);

                        // Set the client version in the toolbar
                        String version =  mVidyoConnector.getVersion();
                        System.out.println("startVidyoConnector():  mVidyoConnector.getVersion() = "+mVidyoConnector.getVersion());
                        mClientVersion.setText("VidyoClient-AndroidSDK " + version);

                        // Set initial position
                        //refreshUI();

                        // Register for local camera events
                        mVidyoConnector.registerLocalCameraEventListener((Connector.IRegisterLocalCameraEventListener) VidyoChatFragment.this);

                        // Register for remote camera events - this is the good stuff right here :)
                        mVidyoConnector.registerRemoteCameraEventListener((Connector.IRegisterRemoteCameraEventListener) VidyoChatFragment.this);

                        // Register for network interface events
                        mVidyoConnector.registerNetworkInterfaceEventListener((Connector.IRegisterNetworkInterfaceEventListener) VidyoChatFragment.this);

                        // Register for log events
                        mVidyoConnector.registerLogEventListener((Connector.IRegisterLogEventListener) VidyoChatFragment.this, "info@VidyoClient info@VidyoConnector warning");

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
                        mClientVersion.setVisibility(View.VISIBLE);
                    } else {
                        mVidyoConnector.disableDebug();
                    }

                    // If cameraPrivacy is configured then mute the camera
                    mCameraPrivacyButton.setChecked(false); // reset state
                    if (mCameraPrivacy) {
                        mCameraPrivacyButton.performClick();
                    }

                    // If microphonePrivacy is configured then mute the microphone
                    mMicrophonePrivacyButton.setChecked(false); // reset state
                    if (mMicrophonePrivacy) {
                        mMicrophonePrivacyButton.performClick(); 
                    }

                    // Set experimental options if any exist
                    if (mExperimentalOptions != null) {
                        ConnectorPkg.setExperimentalOptions(mExperimentalOptions);
                    }

                    // If configured to auto-join, then simulate a click of the toggle connect button
                    if (mAutoJoin) {
                        mToggleConnectButton.performClick();
                    }
                }
            });
        }
    }

    /****************************
    // Refresh the UI
    private void refreshUIxxxxxxx() {
        // Refresh the rendering of the video
        System.out.println("refreshUI:  mLastSelectedCamera = "+mLastSelectedCamera);
        mVidyoConnector.assignViewToLocalCamera(mVideoFrame, mLastSelectedCamera, false, false);
        mVidyoConnector.showViewAt(mVideoFrame, 100, 0, mVideoFrame.getWidth(), mVideoFrame.getHeight());
    }
     **************/

    // The state of the VidyoConnector connection changed, reconfigure the UI.
    // If connected, dismiss the controls layout
    private void changeState(VidyoConnectorState state) {

        mVidyoConnectorState = state;

        // Execute this code on the main thread since it is updating the UI layout.
        mSelf.runOnUiThread(new Runnable() {
            @Override
            public void run() {

                    // Set the status text in the toolbar.
                    mToolbarStatus.setText(mStateDescription.get(mVidyoConnectorState));

                    // Depending on the state, do a subset of the following:
                    // - update the toggle connect button to either start call or end call image: mToggleConnectButton
                    // - display toolbar in case it is hidden: mToolbarLayout
                    // - show/hide the connection spinner: mConnectionSpinner
                    // - show/hide the input form: mControlsLayout
                    switch (mVidyoConnectorState) {
                        case Connecting:
                            mToggleConnectButton.setChecked(true);
                            //mConnectionSpinner.setVisibility(View.VISIBLE);
                            Toast.makeText(mSelf, "connecting", Toast.LENGTH_SHORT).show();
                            break;

                        case Connected:
                            mToggleConnectButton.setChecked(true);
                            mRecord.setVisibility(View.VISIBLE);
                            //mConnectionSpinner.setVisibility(View.INVISIBLE);
                            Toast.makeText(mSelf, "connected", Toast.LENGTH_SHORT).show();
                            break;

                        case Disconnecting:
                            // The button just switched to the callStart image.
                            // Change the button back to the callEnd image because do not want to assume that the Disconnect
                            // call will actually end the call. Need to wait for the callback to be received
                            // before swapping to the callStart image.
                            mToggleConnectButton.setChecked(true);
                            Toast.makeText(mSelf, "disconnecting", Toast.LENGTH_SHORT).show();
                            break;

                        case Disconnected:
                            mRecord.setVisibility(View.GONE);
                            Toast.makeText(mSelf, "disconnected", Toast.LENGTH_SHORT).show();
                        case DisconnectedUnexpected:
                        case Failure:
                        case FailureInvalidResource:
                            Toast.makeText(mSelf, "invalid resource", Toast.LENGTH_SHORT).show();
                            mToggleConnectButton.setChecked(false);
                            //mConnectionSpinner.setVisibility(View.INVISIBLE);

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
                                mToggleConnectButton.setEnabled(false);
                                mToolbarStatus.setText("Call ended");
                            }

                            if (!mHideConfig ) {
                                // Display the controls
                                //mControlsLayout.setVisibility(View.VISIBLE);
                            }
                            break;
                    }
                }
            });
            }

    /*
     * Button Event Callbacks
     */

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.videoChatConnectButton:
                // Connect or disconnect.
                this.toggleConnect();
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
            case R.id.camera_on_button:
                // Toggle the camera privacy.
                mCameraPrivacy = mCameraPrivacyButton.isChecked();
                mVidyoConnector.setCameraPrivacy(mCameraPrivacy);
                break;

            case R.id.microphone_on_button:
                // Toggle the microphone privacy.
                mMicrophonePrivacy = mMicrophonePrivacyButton.isChecked();
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
    public void toggleConnect() {
        if (mToggleConnectButton.isChecked()) {
            // Abort the Connect call if resource ID is invalid. It cannot contain empty spaces or "@".
            String resourceId = mResourceId.getText().toString().trim(); // trim leading and trailing white space
            if (resourceId.contains(" ") || resourceId.contains("@")) {
                changeState(VidyoConnectorState.FailureInvalidResource);
            } else {
                changeState(VidyoConnectorState.Connecting);

                final boolean status = mVidyoConnector.connect(
                        mHost.getText().toString().trim(),
                        mToken.getText().toString().trim(),
                        mDisplayName.getText().toString().trim(),
                        /*mResourceId.getText().toString().trim()*/"aaa", // room parameter
                        this);

                if (!status) {
                    changeState(VidyoConnectorState.Failure);
                }
            }
        } else {
            // The user is either connected to a resource or is in the process of connecting to a resource;
            // Call VidyoConnectorDisconnect to either disconnect or abort the connection attempt.
            changeState(VidyoConnectorState.Disconnecting);
            mVidyoConnector.disconnect();
        }
    }

    // Toggle visibility of the toolbar
    @Override
    public void onVideoFrameClicked() {
        if (mVidyoConnectorState == VidyoConnectorState.Connected) {
            if (mToolbarLayout.getVisibility() == View.VISIBLE) {
                mToolbarLayout.setVisibility(View.INVISIBLE);
            } else {
                mToolbarLayout.setVisibility(View.VISIBLE);
            }
        }
    }

    /*
     *  Connector Events
     */

    // Handle successful connection.
    @Override
    public void onSuccess() {
        changeState(VidyoConnectorState.Connected);
    }

    // Handle attempted connection failure.
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
            mVidyoConnector.assignViewToLocalCamera(mVideoFrame, localCamera, true, false);
            mVidyoConnector.showViewAt(mVideoFrame, 0, 0, mVideoFrame.getWidth(), mVideoFrame.getHeight());
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
        }
    }

    @Override
    public void onLocalCameraStateUpdated(LocalCamera localCamera, Device.DeviceState state) {
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


    // per Connector.IRegisterRemoteCameraEventListener
    @Override
    public void onRemoteCameraAdded(RemoteCamera remoteCamera, Participant participant) {
        // see XCode VideoChatVC.onRemoteCameraAdded()  line 742
        if(mVidyoConnector != null) {
            mVidyoConnector.assignViewToRemoteCamera(remoteFrame, remoteCamera, true, false);//.assignViewToLocalCamera(mVideoFrame, localCamera, true, false);
            mVidyoConnector.showViewAt(remoteFrame, 0, 0, remoteFrame.getWidth(), remoteFrame.getHeight());
        }

    }

    // per Connector.IRegisterRemoteCameraEventListener
    @Override
    public void onRemoteCameraRemoved(RemoteCamera remoteCamera, Participant participant) {

    }

    // per Connector.IRegisterRemoteCameraEventListener
    @Override
    public void onRemoteCameraStateUpdated(RemoteCamera remoteCamera, Participant participant, Device.DeviceState deviceState) {
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
