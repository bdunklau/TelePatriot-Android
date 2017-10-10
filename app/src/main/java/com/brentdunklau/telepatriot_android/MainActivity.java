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
import com.google.firebase.database.FirebaseDatabase;
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


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // https://stackoverflow.com/a/14002030
        if (getIntent().getBooleanExtra("EXIT", false)) {
            finish();
        }
        else if(User.getInstance().isLoggedId()) {
            // We have to check here also to see if the user belongs to any roles yet
            // because if they don't, we have to send them back to LimboActivity
            figureOutWhereToGo();

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

            // NOTE:  FirebaseAuth.getInstance().getCurrentUser() = null  at this point
            startActivityForResult(intent, RC_SIGN_IN);
        }


        // Left as a comment because SwipeAdapter does provide an example of how to do swiping
        // even though we're not swiping to change perspectives anymore
        //this.swipeAdapter = new SwipeAdapter(this, this);

    }

    private void figureOutWhereToGo() {
        database = FirebaseDatabase.getInstance();
        database.getReference("/users/"+User.getInstance().getUid()+"/roles").addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                HashMap<String, String> roles = (HashMap) dataSnapshot.getValue();
                if(roles == null || roles.isEmpty()) {
                    try {
                        DbLog.d("logging in - no roles assigned yet");
                        Intent it = new Intent(MainActivity.this, LimboActivity.class);
                        startActivity(it);
                        //finish();  DON'T call this   https://stackoverflow.com/a/23718678
                    } catch(Throwable t) {
                        DbLog.e("Throwable: "+t);
                    }
                } else {
                    Map<String, Class> activities = new HashMap<String, Class>();
                    activities.put("Admin", UnassignedUsersActivity.class);
                    activities.put("Director", DirectorActivity.class);
                    //activities.put("Volunteer", VolunteerActivity.class);
                    String role = roles.keySet().iterator().next();
                    DbLog.d("logging in - going to "+role+" screen");
                    Class activity = activities.get(role);
                    if(activity == null) {
                        DbLog.e("There is no activity class mapped to this role: "+role+"  If this doesn't sound right, see MainActivity.figureOutWhereToGo().  Because there is no activity, we are going to stay on MainActivity");
                    } else {
                        Intent it = new Intent(MainActivity.this, activity);
                        startActivity(it);
                        //finish();  DON'T call this   https://stackoverflow.com/a/23718678
                    }
                }
            }
            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        // NOTE:  FirebaseAuth.getInstance().getCurrentUser() IS NOT null  at this point

        super.onActivityResult(requestCode, resultCode, data);
        if(requestCode == RC_SIGN_IN) {
            if(resultCode == RESULT_OK) {
                /**
                 * Does the user have any roles yet, or is this a brand new user?
                 * Where we send the user will depend on whether they are brand new or not
                 */
                figureOutWhereToGo();

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
