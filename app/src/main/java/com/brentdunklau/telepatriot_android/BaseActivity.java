package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.MotionEvent;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SlideIt;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SwipeAdapter;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.User;
import com.firebase.ui.auth.AuthUI;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 10/1/17.
 */

public class BaseActivity extends AppCompatActivity {


    private String TAG = "BaseActivity";

    // Firebase instance variables
    protected FirebaseAuth mFirebaseAuth;  // see https://codelabs.developers.google.com/codelabs/firebase-android/#5
    protected FirebaseDatabase database;
    protected DatabaseReference myRef;
    protected SwipeAdapter swipeAdapter;
    protected User user;
    protected Class currentActivity;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        database = FirebaseDatabase.getInstance();

        // Initialize Firebase Auth
        mFirebaseAuth = FirebaseAuth.getInstance();


        // Need to be more general with this.  Need to look at all child nodes of /users/uid/roles
        /*
        if(mFirebaseAuth == null || mFirebaseAuth.getCurrentUser() == null) {
            if (true) ;
        } else {
            DatabaseReference r1 = database.getReference("/users/" + mFirebaseAuth.getCurrentUser().getUid() + "/roles/Admin");
            r1.addValueEventListener(new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot dataSnapshot) {
                    Object o = dataSnapshot.getValue();
                    boolean roleRemoved = o == null;
                    if (roleRemoved) {

                    } else {
                        // make sure user has Director access
                    }
                }

                @Override
                public void onCancelled(DatabaseError databaseError) {
                    // do what here?
                }
            });
        }*/

    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch(item.getItemId()) {
            case(R.id.chat_help):
                return true;
            case(R.id.sign_out_menu):
                signOut();
                return true;
            default: return super.onOptionsItemSelected(item);
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main_menu, menu);
        //return true;
        return super.onCreateOptionsMenu(menu);
    }

    protected void signOut() {
        AuthUI.getInstance().signOut(this)
                .addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        Log.d(TAG, "USER LOGGED OUT");
                        user.onSignout();
                        finish();
                    }
                });
    }

    // 1:00  https://www.youtube.com/watch?v=VKbEfhf1qc&list=PL6gx4Cwl9DGBsvRxJJOzG4r4k_zLKrnxl&index=22
    @Override
    public boolean onTouchEvent(MotionEvent event) {
        this.swipeAdapter.onTouchEvent(event);
        return super.onTouchEvent(event);
    }

    protected void updateLabel(final int Rid, final String text) {
        Runnable r = new Runnable() {
            @Override
            public void run() {
                ((TextView)findViewById(Rid)).setText(text);
            }
        };
        new Thread(r).start();
    }

    @Override
    protected void onPause() {
        super.onPause();
        String cname = this.getClass().getName();
        Log.d(cname, "paused");
    }

    @Override
    protected void onResume() {
        super.onResume();
        String cname = this.getClass().getName();
        Log.d(cname, "resume");
    }

    @Override
    protected void onStart() {
        super.onStart();
        String cname = this.getClass().getName();
        Log.d(cname, "start");
    }


    private Class onTheLeft() {
        return user.activityOnTheLeft(currentActivity);
    }


    private Class onTheRight() {
        return user.activityOnTheRight(currentActivity);
    }


    public void rightToLeft() {
        Class onTheRight = onTheRight();
        if(onTheRight != null) {
            Intent it = new Intent(this, onTheRight());
            startActivity(it);
            overridePendingTransition(R.anim.slide_from_right, R.anim.slide_to_left);
        }
    }

    public void leftToRight() {
        Class onTheLeft = onTheLeft();
        if(onTheLeft != null) {
            Intent it = new Intent(this, onTheLeft());
            startActivity(it);
            overridePendingTransition(R.anim.slide_from_left, R.anim.slide_to_right);
        }
    }
}
