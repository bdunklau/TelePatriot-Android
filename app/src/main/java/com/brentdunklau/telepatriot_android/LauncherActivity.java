package com.brentdunklau.telepatriot_android;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.RequiresApi;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.View;
import android.widget.Button;

import com.brentdunklau.telepatriot_android.util.AccountStatusEvent;
import com.brentdunklau.telepatriot_android.util.AppLog;
import com.brentdunklau.telepatriot_android.util.User;
import com.firebase.ui.auth.AuthUI;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by bdunklau on 10/12/2017.
 */

public class LauncherActivity extends BaseActivity
//        implements AccountStatusEvent.Listener
{

    private final static String TAG = "LauncherActivity";
    private static final int RC_SIGN_IN = 1;
    private Button button_get_started;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // We don't need to do this because we're never going to show this
        // screen.  We're either going to go to the Login screen provided by
        // FirebaseUI or we're going to go to MainActivity
        setContentView(R.layout.activity_launcher);

        button_get_started = findViewById(R.id.button_get_started);
        button_get_started.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                getStarted();
            }
        });

        getStarted();
    }

    private void getStarted() {

        if(User.getInstance().isLoggedIn()) {
            // then we can skip this and go straight to MainActivity
            startActivity(new Intent(this, MainActivity.class));
        }
        else {
            // src:  https://github.com/firebase/FirebaseUI-Android/blob/master/auth/README.md
            // gotta stick around and login
            AuthUI aui = AuthUI.getInstance();
            AuthUI.SignInIntentBuilder sib = aui.createSignInIntentBuilder()
                    .setAvailableProviders(Arrays.asList(
                            new AuthUI.IdpConfig.Builder(AuthUI.FACEBOOK_PROVIDER).build()
                            , new AuthUI.IdpConfig.Builder(AuthUI.EMAIL_PROVIDER).build()
                            //, new AuthUI.IdpConfig.Builder(AuthUI.GOOGLE_PROVIDER).build() // removed till I figure out what's wrong
                            )
                    );

            Intent intent = sib.build();

            // NOTE:  FirebaseAuth.getInstance().getCurrentUser() = null  at this point
            startActivityForResult(intent, RC_SIGN_IN);

        }
    }


    /* We don't even need to do this because the singleton constructor in User.java registers
    itself as a Firebase Auth state listener.  Go look at the queries we do in login() and see how
    we fire different events when the user is written and removed from the /no_roles node
*/
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        // NOTE:  FirebaseAuth.getInstance().getCurrentUser() IS NOT null  at this point

        super.onActivityResult(requestCode, resultCode, data);
        if(requestCode == RC_SIGN_IN) {
            if(resultCode == RESULT_OK) {

                final String uid = FirebaseAuth.getInstance().getCurrentUser().getUid();
                final String name = FirebaseAuth.getInstance().getCurrentUser().getDisplayName();
                final String email = FirebaseAuth.getInstance().getCurrentUser().getEmail();

                Map vals = new HashMap();
                vals.put("name", name);
                vals.put("name_lower", name.toLowerCase());
                FirebaseDatabase.getInstance().getReference("users/"+uid).updateChildren(vals);

                FirebaseDatabase.getInstance().getReference("administration/configuration").addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot dataSnapshot) {
                        Map<String, Object> config = (Map<String, Object>) dataSnapshot.getValue();
//                        Map<String, Object> config = (Map<String, Object>) m.get("configuration");
                        Boolean simulate_missing_name = (Boolean) config.get("simulate_missing_name");
                        Boolean simulate_missing_email = (Boolean) config.get("simulate_missing_email");

                        boolean dataMissing = name==null || email==null || name.trim().equals("") || email.trim().equals("")
                                || simulate_missing_name || simulate_missing_email;

                        if(dataMissing) {
                            Intent intent = new Intent(LauncherActivity.this, MissingInformationActivity.class);
                            intent.putExtra("uid", uid);
                            startActivity(intent);
                            return;
                        }

                        if(User.getInstance().isDisabled()) {
                            startActivity(new Intent(LauncherActivity.this, DisabledActivity.class));
                            return;
                        }

                        if(User.getInstance().isNotAllowed()) {
                            startActivity(new Intent(LauncherActivity.this, LimboActivity.class));
                            return;
                        }

                    }

                    @Override
                    public void onCancelled(DatabaseError databaseError) {  }
                });

            } else {
                // user not authenticated
                Log.d("LauncherActivity", "USER NOT AUTHENTICATED");
            }

        }
    }

    private void gotoScreen(Class c) {
        startActivity(new Intent(this, c));
    }


}
