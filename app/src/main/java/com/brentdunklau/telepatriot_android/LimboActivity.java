package com.brentdunklau.telepatriot_android;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.widget.TextView;

import com.google.firebase.auth.FirebaseAuth;

/**
 * Created by bdunklau on 10/1/17.
 */

public class LimboActivity extends AppCompatActivity {

    // Firebase instance variables
    private FirebaseAuth mFirebaseAuth;  // see https://codelabs.developers.google.com/codelabs/firebase-android/#5


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_limbo);

        // should not be null because we don't even get here till the user
        // has logged in and been sent here from MainActivity.onActivityResult()
        mFirebaseAuth = FirebaseAuth.getInstance();
        final String name = mFirebaseAuth.getCurrentUser().getDisplayName();
        final String msg = name + ", welcome to TelePatriot.  Because you are a new user, an admin " +
                "has been notified to assign you to the appropriate group.";
        Runnable r = new Runnable() {
            public void run() {
                ((TextView)findViewById(R.id.txt_limbo)).setText(msg);
            }
        };
        new Thread(r).start();
    }
}
