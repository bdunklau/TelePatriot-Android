package com.brentdunklau.telepatriot_android;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.Toast;
import android.widget.ToggleButton;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.SocketAddress;
import java.net.URL;
import java.net.URLConnection;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import com.vidyo.VidyoClient.Connector.ConnectorPkg;
import com.vidyo.VidyoClient.Connector.Connector;
import com.vidyo.VidyoClient.Device.Device;
import com.vidyo.VidyoClient.Device.LocalCamera;
import com.vidyo.VidyoClient.Endpoint.LogRecord;
import com.vidyo.VidyoClient.NetworkInterface;


public class VidyoChatFragment extends BaseFragment implements
        View.OnClickListener,
        Connector.IConnect,
        Connector.IRegisterLogEventListener,
        Connector.IRegisterNetworkInterfaceEventListener,
        Connector.IRegisterLocalCameraEventListener,
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
    private ProgressBar mConnectionSpinner;
    private LinearLayout mControlsLayout;
    private LinearLayout mToolbarLayout;
    private EditText mHost;
    public EditText mDisplayName;
    public static EditText mToken;
    private EditText mResourceId;
    private TextView mToolbarStatus;
    private TextView mClientVersion;
    private VideoFrameLayout mVideoFrame;
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
    public static String mTokenString;
    public static String jsonTokenData;

    /*
     *  Operating System Events
     */

    @Nullable
    @Override
    public View onCreateView (LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState){
        myView = inflater.inflate(R.layout.vidyo_chat_fragment,container,false);


        // Initialize the member variables
        mControlsLayout = myView.findViewById(R.id.controls_layout);
        //mToolbarLayout = (LinearLayout) findViewById(R.id.toolbarLayout);
        mVideoFrame = myView.findViewById(R.id.vidyoChatMyScreen);
        mVideoFrame.Register(this);
        //TODO change editText to import data
        mHost = myView.findViewById(R.id.host);
        mHost.setText("prod.vidyo.io");
        mDisplayName = myView.findViewById(R.id.displayName);
        mDisplayName.setText("jeremy");
        mToken = myView.findViewById(R.id.token);
        mResourceId = myView.findViewById(R.id.resource);
        mResourceId.setText("demoRoom");
        mToolbarStatus = myView.findViewById(R.id.toolbarStatusText);
        mClientVersion = myView.findViewById(R.id.clientVersion);
        mConnectionSpinner = myView.findViewById(R.id.connectionSpinner);
        mSelf = (MainActivity) getActivity();
        GetToken newToken = new GetToken();
        newToken.execute();
        mToken.setText(jsonTokenData);

        // Set the onClick listeners for the buttons
        mToggleConnectButton = myView.findViewById(R.id.videoChatConnectButton);
        mToggleConnectButton.setOnClickListener(this);
        mMicrophonePrivacyButton = myView.findViewById(R.id.microphone_on_button);
        mMicrophonePrivacyButton.setOnClickListener(this);
        mCameraPrivacyButton = myView.findViewById(R.id.camera_on_button);
        mCameraPrivacyButton.setOnClickListener(this);
        ToggleButton button;
        button = myView.findViewById(R.id.camera_switch);
        button.setOnClickListener(this);

        // Set the application's UI context to this activity.
        ConnectorPkg.setApplicationUIContext(getActivity());

        // Initialize the VidyoClient library - this should be done once in the lifetime of the application.
        mVidyoClientInitialized = ConnectorPkg.initialize();
        return myView;
    }


    //protected void onNewIntent(Intent intent) {
    //    super.onNewIntent(intent);

        // Set the refreshSettings flag so the app settings are refreshed in onStart
    //    mRefreshSettings = true;

        // New intent was received so set it to use in onStart
    //   setIntent(intent);
    //}

    @Override
    public void onStart() {
        super.onStart();
// Initialize or refresh the app settings.
        // When app is first launched, mRefreshSettings will always be true.
        // Each successive time that onStart is called, app is coming back to foreground so check if the
        // settings need to be refreshed again, as app may have been launched via URI.

        if (mRefreshSettings &&
                mVidyoConnectorState != VidyoConnectorState.Connected &&
                mVidyoConnectorState != VidyoConnectorState.Connecting) {

            Intent intent = getActivity().getIntent();
            Uri uri = intent.getData();

            // Check if app was launched via URI
            if (uri != null) {
                String param = uri.getQueryParameter("host");
                mHost.setText( param != null ? param : "prod.vidyo.io");

                param = uri.getQueryParameter("token");
                mToken.setText(param != null ? param : "");

                param = uri.getQueryParameter("displayName");
                mDisplayName.setText(param != null ? param : "");

                param = uri.getQueryParameter("resourceId");
                mResourceId.setText(param != null ? param : "");

                mReturnURL = uri.getQueryParameter("returnURL");
                mHideConfig = uri.getBooleanQueryParameter("hideConfig", false);
                mAutoJoin = uri.getBooleanQueryParameter("autoJoin", false);
                mAllowReconnect = uri.getBooleanQueryParameter("allowReconnect", true);
                mCameraPrivacy = uri.getBooleanQueryParameter("cameraPrivacy", false);
                mMicrophonePrivacy = uri.getBooleanQueryParameter("microphonePrivacy", false);
                mEnableDebug = uri.getBooleanQueryParameter("enableDebug", false);
                mExperimentalOptions = uri.getQueryParameter("experimentalOptions");
            } else {
                // If the app was launched by a different app, then get any parameters; otherwise use default settings
                mHost.setText(intent.hasExtra("host") ? intent.getStringExtra("host") : "prod.vidyo.io");
                mToken.setText(mTokenString);
                mDisplayName.setText(intent.hasExtra("displayName") ? intent.getStringExtra("displayName") : "");
                mResourceId.setText(intent.hasExtra("resourceId") ? intent.getStringExtra("resourceId") : "");
                mReturnURL = intent.hasExtra("returnURL") ? intent.getStringExtra("returnURL") : null;
                mHideConfig = intent.getBooleanExtra("hideConfig", false);
                mAutoJoin = intent.getBooleanExtra("autoJoin", false);
                mAllowReconnect = intent.getBooleanExtra("allowReconnect", true);
                mCameraPrivacy = intent.getBooleanExtra("cameraPrivacy", false);
                mMicrophonePrivacy = intent.getBooleanExtra("microphonePrivacy", false);
                mEnableDebug = intent.getBooleanExtra("enableDebug", false);
                mExperimentalOptions = intent.hasExtra("experimentalOptions") ? intent.getStringExtra("experimentalOptions") : null;
            }

            // Hide the controls if hideConfig enabled
            if (mHideConfig) {
                mControlsLayout.setVisibility(View.GONE);
            }

            // Apply the app settings if the Connector object has been created
            if (mVidyoConnector != null) {
                // Apply some of the app settings
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
            }

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
            mVidyoConnector.setMode(Connector.ConnectorMode.VIDYO_CONNECTORMODE_Background);
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

    // Construct Connector and register for event listeners.
    private void startVidyoConnector() {

        // Wait until mVideoFrame is drawn until getting started.
        ViewTreeObserver viewTreeObserver = mVideoFrame.getViewTreeObserver();
        if (viewTreeObserver.isAlive()) {
            viewTreeObserver.addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
                @Override
                public void onGlobalLayout() {
                    mVideoFrame.getViewTreeObserver().removeOnGlobalLayoutListener(this);

                    // Construct Connector
                    try {
                        mVidyoConnector = new Connector(mVideoFrame,
                                Connector.ConnectorViewStyle.VIDYO_CONNECTORVIEWSTYLE_Default,
                                15,
                                "info@VidyoClient info@VidyoConnector warning",
                                "",
                                0);

                        // Set the client version in the toolbar
                        mClientVersion.setText("VidyoClient-AndroidSDK " + mVidyoConnector.getVersion());

                        // Set initial position
                        refreshUI();

                        // Register for local camera events
                        if (!mVidyoConnector.registerLocalCameraEventListener((Connector.IRegisterLocalCameraEventListener) mSelf)) {
                        }
                        // Register for network interface events
                        if (!mVidyoConnector.registerNetworkInterfaceEventListener((Connector.IRegisterNetworkInterfaceEventListener) mSelf)) {
                        }
                        // Register for log events
                        if (!mVidyoConnector.registerLogEventListener((Connector.IRegisterLogEventListener) mSelf, "info@VidyoClient info@VidyoConnector warning")) {
                        }

                        // Apply the app settings
                        applySettings();
                    }
                    catch (Exception e) {
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

    // Refresh the UI
    private void refreshUI() {
        // Refresh the rendering of the video
        mVidyoConnector.showViewAt(mVideoFrame, 0, 0, mVideoFrame.getWidth(), mVideoFrame.getHeight());
    }

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
                            mConnectionSpinner.setVisibility(View.VISIBLE);
                            Toast.makeText(mSelf, "connecting", Toast.LENGTH_SHORT).show();
                            break;

                        case Connected:
                            mToggleConnectButton.setChecked(true);
                            mControlsLayout.setVisibility(View.GONE);
                            mConnectionSpinner.setVisibility(View.INVISIBLE);
                            Toast.makeText(mSelf, "Connected", Toast.LENGTH_SHORT).show();
                            break;

                        case Disconnecting:
                            // The button just switched to the callStart image.
                            // Change the button back to the callEnd image because do not want to assume that the Disconnect
                            // call will actually end the call. Need to wait for the callback to be received
                            // before swapping to the callStart image.
                            mToggleConnectButton.setChecked(true);
                            Toast.makeText(mSelf, "Disconnecting", Toast.LENGTH_SHORT).show();
                            break;

                        case Disconnected:
                            Toast.makeText(mSelf, "Disconnected", Toast.LENGTH_SHORT).show();
                        case DisconnectedUnexpected:
                            Toast.makeText(mSelf, "Disconnected Unexpected", Toast.LENGTH_SHORT).show();
                        case Failure:
                            Toast.makeText(mSelf, "Failure", Toast.LENGTH_SHORT).show();
                        case FailureInvalidResource:
                            Toast.makeText(mSelf, "Invalid Resource", Toast.LENGTH_SHORT).show();
                            mToggleConnectButton.setChecked(false);
                            mConnectionSpinner.setVisibility(View.INVISIBLE);

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
                                mControlsLayout.setVisibility(View.VISIBLE);
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

            case R.id.camera_switch:
                // Cycle the camera.
                mVidyoConnector.cycleCamera();
                break;

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
                        resourceId,
                        this);

                //TODO move to record button

                try {
                    URL url = new URL("http://35.185.56.20/record/demoRoom/uniqueField");
                    url.openConnection();
                    Toast.makeText(mSelf, "Docker connection", Toast.LENGTH_SHORT).show();
                } catch (MalformedURLException e) {
                    e.printStackTrace();
                } catch (IOException e) {
                    e.printStackTrace();
                }
                if (!status) {
                    changeState(VidyoConnectorState.Failure);
                    Toast.makeText(mSelf, "failure", Toast.LENGTH_SHORT).show();
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

    // Handle local camera events.
    @Override
    public void onLocalCameraAdded(LocalCamera localCamera) {
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
}
