package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.support.annotation.NonNull;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.Menu;
import android.view.MotionEvent;
import android.widget.TextView;

import com.firebase.ui.auth.AuthUI;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

/**
 * Created by bdunklau on 10/1/17.
 */
 
public class BaseActivity extends AppCompatActivity {


    private String TAG = "BaseActivity";

    // Firebase instance variables
    protected FirebaseAuth mFirebaseAuth;  // see https://codelabs.developers.google.com/codelabs/firebase-android/#5
    protected FirebaseDatabase database;
    protected DatabaseReference myRef;

    // Left as a comment because SwipeAdapter does provide an example of how to do swiping
    // even though we're not swiping to change perspectives anymore
    //protected SwipeAdapter swipeAdapter;
    //protected User user;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        database = FirebaseDatabase.getInstance();

        // Initialize Firebase Auth
        mFirebaseAuth = FirebaseAuth.getInstance();

    }


/*
    // https://stackoverflow.com/a/41931325
    protected BroadcastReceiver mMessageReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            showAlertDialog(intent.getExtras().getString("uid"),
                    intent.getExtras().getString("title"),
                    intent.getExtras().getString("message"));
        }
    };
    */

/*
    protected void showAlertDialog(final String uid, String dataTitle, String dataMessage) {
        if(uid == null || dataTitle == null || dataMessage == null)
            return;
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Message");
        builder.setMessage(dataTitle + "\n" + dataMessage);
        // We COULD send the Admin right to AssignUserActivity for the new person that needs
        // to be assigned, but there IS the possibility of clash between admins
        // So for now, we'll send Admins to UnassignedUsersActivity because there, we display
        // a note next to each new person if an Admin is already reviewing their account
        builder.setPositiveButton("OK", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialogInterface, int i) {
                Intent it = new Intent(BaseActivity.this, UnassignedUsersActivity.class);
                //it.putExtra("uid", uid); // only needed if we send Admins to AssignUserActivity
                startActivity(it);
            }
        });
        builder.show();
    }
    */


/*
    // https://stackoverflow.com/a/41931325
    @Override
    protected void onStart() {
        super.onStart();
        LocalBroadcastManager.getInstance(this).registerReceiver((mMessageReceiver),
                new IntentFilter("NewUser")
        );
    }

    // https://stackoverflow.com/a/41931325
    @Override
    protected void onStop() {
        super.onStop();
        LocalBroadcastManager.getInstance(this).unregisterReceiver(mMessageReceiver);
    }
    */


/*
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch(item.getItemId()) {
            case(R.id.chat_help):
                return true;
            case(R.id.sign_out_menu):
                signOut();
                return true;
            case(R.id.volunteer_view_menu):
                //gotoScreen(VolunteerActivity.class);
                return true;
            case(R.id.director_view_menu):
                gotoScreen(DirectorActivity.class);
                return true;
            case(R.id.admin_view_menu):
                gotoScreen(AdminActivity.class);
                return true;
            default: return super.onOptionsItemSelected(item);
        }
    }
    */


    private void gotoScreen(Class activity) {
        Intent it = new Intent(this, activity);
        startActivity(it);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main_menu, menu);
        //return true;
        return super.onCreateOptionsMenu(menu);
    }

    protected void signOut() {
        AuthUI aui = AuthUI.getInstance();
        aui.signOut(this)
                .addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        Log.d(TAG, "USER LOGGED OUT");
                        // https://stackoverflow.com/a/14002030
                        Intent intent = new Intent(getApplicationContext(), MainActivity.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                        intent.putExtra("EXIT", true);
                        startActivity(intent);
                        finish();
                    }
                });
    }

    // 1:00  https://www.youtube.com/watch?v=VKbEfhf1qc&list=PL6gx4Cwl9DGBsvRxJJOzG4r4k_zLKrnxl&index=22
    @Override
    public boolean onTouchEvent(MotionEvent event) {

        // Left as a comment because SwipeAdapter does provide an example of how to do swiping
        // even though we're not swiping to change perspectives anymore
        //this.swipeAdapter.onTouchEvent(event);
        return super.onTouchEvent(event);
    }

    protected void updateLabel(final int Rid, final String text) {
        Runnable r = new Runnable() {
            @Override
            public void run() {
                try {
                    TextView t = (TextView) findViewById(Rid);
                    t.setText(text);
                }
                catch(Throwable t) {
                    // We get an exception when called from ListUsersActivity when the list of users
                    // goes from a non-zero size to zero size.  Not sure why.  And this exception, when
                    // caught here, doesn't prevent the label from being updated.  So seems like we
                    // could just catch this and do nothing ?  hope so
                    // android.view.ViewRootImpl$CalledFromWrongThreadException: Only the original thread that created a view hierarchy can touch its views.
                    Log.d("xxx", "ssss");
                }
            }
        };
        Handler h = new Handler();
        h.post(r);
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


    /*********
     * Not swiping to change perspectives anymore, but this code, together with SlideIt and
     * SwipeAdapter provide an example of how to do swiping
     *
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
            overridePendingTransition(R.anim.slide_from_right, R.anim.slide_to_left);
        }
    }
     **************/
}
