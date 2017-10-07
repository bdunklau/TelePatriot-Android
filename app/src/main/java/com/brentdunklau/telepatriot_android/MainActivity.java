package com.brentdunklau.telepatriot_android;


import android.app.Activity;
import android.app.Application;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.support.v4.content.LocalBroadcastManager;
import android.support.v7.app.AlertDialog;
import android.os.Bundle;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.Toast;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.DbLog;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SlideIt;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SwipeAdapter;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.User;
import com.firebase.ui.auth.AuthUI;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.messaging.FirebaseMessaging;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends BaseActivity
        //implements SlideIt
{

    private static final int RC_SIGN_IN = 1;
    private static final String TAG = "MainActivity";
    public static final String ANONYMOUS = "anonymous";

    //private String dataTitle, dataMessage;
    private EditText title, message;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        /**
         * see:  https://stackoverflow.com/a/11656129
         */
        setupUI(findViewById(R.id.main_view));

        // Initialize Firebase Auth  (moved to BaseActivity)
        //mFirebaseAuth = FirebaseAuth.getInstance();

        if(mFirebaseAuth.getCurrentUser() != null) {
            String name = User.getInstance(mFirebaseAuth.getCurrentUser()).getName();
            updateLabel(R.id.name, name);
        } else {
            AuthUI aui = AuthUI.getInstance();
            AuthUI.SignInIntentBuilder sib = aui.createSignInIntentBuilder()
                    .setAvailableProviders(Arrays.asList(
                            new AuthUI.IdpConfig.Builder(AuthUI.FACEBOOK_PROVIDER).build(),
                            new AuthUI.IdpConfig.Builder(AuthUI.GOOGLE_PROVIDER).build(),
                            new AuthUI.IdpConfig.Builder(AuthUI.EMAIL_PROVIDER).build()
                            )
                    );

            Intent intent = sib.build();
            intent.putExtra("backgroundImage", R.drawable.usflag);

            startActivityForResult(intent, RC_SIGN_IN);
        }

        // If the app is not currently up or in the foreground, this is what gets called after
        // you pull down the notifications and click one.
        // If the app is not currently up or in the foreground, you don't execute the onMessageReceived()
        // method in MyFirebaseMessagingService
        //
        // Handle possible data accompanying notification message.
        if (getIntent().getExtras() != null) {
            String dataTitle = null; String dataMessage = null; String uid = null;
            for (String key : getIntent().getExtras().keySet()) {
                if (key.equals("title")) {
                    dataTitle=(String)getIntent().getExtras().get(key);
                }
                if (key.equals("message")) {
                    dataMessage = (String)getIntent().getExtras().get(key);
                }
                if (key.equals("uid")) {
                    uid = (String)getIntent().getExtras().get(key);
                }
            }
            showAlertDialog(uid, dataTitle, dataMessage);
        }

        myRef = database.getReference("messages");

        title = findViewById(R.id.title);
        message = findViewById(R.id.message);

        // Left as a comment because SwipeAdapter does provide an example of how to do swiping
        // even though we're not swiping to change perspectives anymore
        //this.swipeAdapter = new SwipeAdapter(this, this);


        // https://stackoverflow.com/a/14002030
        if (getIntent().getBooleanExtra("EXIT", false)) {
            finish();
        }
    }

    /**
     * See setupUI() in onCreate() to see how we hide the keyboard when the user clicks away from either the title or the message field.
     * Got the answer from here:  https://stackoverflow.com/a/11656129
     * @param activity
     */
    public static void hideSoftKeyboard(Activity activity) {
        InputMethodManager inputMethodManager =
                (InputMethodManager) activity.getSystemService(
                        Activity.INPUT_METHOD_SERVICE);
        inputMethodManager.hideSoftInputFromWindow(
                activity.getCurrentFocus().getWindowToken(), 0);
    } 

    /**
     * See setupUI() in onCreate() to see how we hide the keyboard when the user clicks away from either the title or the message field.
     * Got the answer from here:  https://stackoverflow.com/a/11656129
     * @param view
     */
    public void setupUI(View view) {

        // Set up touch listener for non-text box views to hide keyboard.
        if (!(view instanceof EditText)) {
            view.setOnTouchListener(new View.OnTouchListener() {
                public boolean onTouch(View v, MotionEvent event) {
                    hideSoftKeyboard(MainActivity.this);
                    return false;
                }
            });
        }

        //If a layout container, iterate over children and seed recursion.
        if (view instanceof ViewGroup) {
            for (int i = 0; i < ((ViewGroup) view).getChildCount(); i++) {
                View innerView = ((ViewGroup) view).getChildAt(i);
                setupUI(innerView);
            }
        }
    }

    public void subscribeToTopics() {
        String uid = mFirebaseAuth.getCurrentUser().getUid();

        //DatabaseReference meAdmin = database.getReference("users/${uid}/Admin");

    }

    public void subscribeToTopic(View view) {
        String topic = "messages";
        FirebaseMessaging.getInstance().subscribeToTopic(topic);
        Toast.makeText(this, "Subscribed to Topic: "+topic, Toast.LENGTH_SHORT).show();
    }

    /**
     * See android:onClick="sendMessage" in activity_main.xml
     * @param view
     */
    public void sendMessage(View view) {
        myRef.push().setValue(new Message(title.getText().toString(), message.getText().toString()));
        Toast.makeText(this, "Message Sent", Toast.LENGTH_SHORT).show();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if(requestCode == RC_SIGN_IN) {
            if(resultCode == RESULT_OK) {
                User user = User.getInstance(mFirebaseAuth.getCurrentUser());
                String name = user.getName();

                // Oops - this causes the app to crash.  I guess because we set the text of a label
                // in a Runnable and by the time the Runnable gets called, we have moved on to the LimboActivity ...?
                // Is that it?  Seems like it.  Everything seems to work when this 1 line below is commented out
                //updateLabel(R.id.name, name);
                // user logged in
                //Log.d(TAG, mFirebaseAuth.getCurrentUser().getEmail());


                /**
                 * Does the user have any roles yet, or is this a brand new user?
                 * Where we send the user will depend on whether they are brand new or not
                 */

                database.getReference("/users/"+mFirebaseAuth.getCurrentUser().getUid()+"/roles").addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot dataSnapshot) {
                        HashMap<String, String> roles = (HashMap) dataSnapshot.getValue();
                        if(roles == null || roles.isEmpty()) {
                            DbLog.d(mFirebaseAuth.getCurrentUser().getDisplayName(), "logging in - no roles assigned yet");
                            Intent it = new Intent(MainActivity.this, LimboActivity.class);
                            startActivity(it);
                        } else {
                            Map<String, Class> activities = new HashMap<String, Class>();
                            activities.put("Admin", AdminActivity.class);
                            activities.put("Director", DirectorActivity.class);
                            //activities.put("Volunteer", VolunteerActivity.class);
                            String role = roles.keySet().iterator().next();
                            DbLog.d(mFirebaseAuth.getCurrentUser().getDisplayName(), "logging in - going to "+role+" screen");
                            Class activity = activities.get(role);
                            Intent it = new Intent(MainActivity.this, activity);
                            startActivity(it);
                        }
                    }
                    @Override
                    public void onCancelled(DatabaseError databaseError) { }
                });


            } else {
                // user not authenticated
                Log.d(TAG, "USER NOT AUTHENTICATED");
            }

        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.d(TAG, "resume");
    }


    /*

    @Override
    public void onConnectionFailed(@NonNull ConnectionResult connectionResult) {
        // An unresolvable error has occurred and Google APIs (including Sign-In) will not
        // be available.
        Log.d(TAG, "onConnectionFailed:" + connectionResult);
        Toast.makeText(this, "Network connection dropped", Toast.LENGTH_SHORT).show();
    }*/


}
