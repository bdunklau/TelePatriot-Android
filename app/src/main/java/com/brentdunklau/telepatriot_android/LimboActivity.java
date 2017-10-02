package com.brentdunklau.telepatriot_android;

import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.widget.TextView;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;

/**
 * Created by bdunklau on 10/1/17.
 */

public class LimboActivity extends BaseActivity {

    protected String TAG = "LimboActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_limbo);

        // should not be null because we don't even get here till the user
        // has logged in and been sent here from MainActivity.onActivityResult()
        mFirebaseAuth = FirebaseAuth.getInstance();
        String uid = mFirebaseAuth.getCurrentUser().getUid()
        final String name = mFirebaseAuth.getCurrentUser().getDisplayName();
        final String msg = name + ", welcome to TelePatriot.  Because you are a new user, an admin " +
                "has been notified to assign you to the appropriate group.";
        Runnable r = new Runnable() {
            public void run() {
                ((TextView)findViewById(R.id.txt_limbo)).setText(msg);
            }
        };
        new Thread(r).start();


        database = FirebaseDatabase.getInstance();
        myRef = database.getReference("users/{uid}/account_status_events");
        ChildEventListener ce = new ChildEventListener() {
            @Override
            public void onChildAdded(DataSnapshot dataSnapshot, String s) {

            }

            @Override
            public void onChildChanged(DataSnapshot dataSnapshot, String s) {

            }

            @Override
            public void onChildRemoved(DataSnapshot dataSnapshot) {

            }

            @Override
            public void onChildMoved(DataSnapshot dataSnapshot, String s) {

            }

            @Override
            public void onCancelled(DatabaseError databaseError) {

            }
        };

    }
}
