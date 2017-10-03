package com.brentdunklau.telepatriot_android;


import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.support.annotation.NonNull;
import android.support.v4.app.NotificationCompat;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.firebase.ui.auth.AuthUI;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.messaging.FirebaseMessaging;

import java.util.Arrays;
import java.util.StringTokenizer;

public class MainActivity extends BaseActivity
{

    private static final int RC_SIGN_IN = 1;
    protected String TAG = "MainActivity";
    public static final String ANONYMOUS = "anonymous";

    private String dataTitle, dataMessage;
    private EditText title, message;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        /**
         * see:  https://stackoverflow.com/a/11656129
         */
        setupUI(findViewById(R.id.main_view));

        // Initialize Firebase Auth
        mFirebaseAuth = FirebaseAuth.getInstance();
        if(mFirebaseAuth.getCurrentUser() != null) {
            // user already signed in
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
            for (String key : getIntent().getExtras().keySet()) {
                if (key.equals("title")) {
                    dataTitle=(String)getIntent().getExtras().get(key);
                }
                if (key.equals("message")) {
                    dataMessage = (String)getIntent().getExtras().get(key);
                }
            }
            showAlertDialog();
        }

        database = FirebaseDatabase.getInstance();
        myRef = database.getReference("messages");

        title = findViewById(R.id.title);
        message = findViewById(R.id.message);
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


    private void showAlertDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Message");
        builder.setMessage("title: " + dataTitle + "\n" + "message: " + dataMessage);
        builder.setPositiveButton("OK", null);
        builder.show();
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
                // user logged in
                Log.d(TAG, mFirebaseAuth.getCurrentUser().getEmail());

                //Intent it = new Intent(this, LimboActivity.class);
                //startActivity(it);



                /**
                 * Now we have to figure out what roles the person has
                 * If the person is an Admin, they go to the AdminActivity
                 */
                /*
                DatabaseReference r1 = database.getReference("/users/"+mFirebaseAuth.getCurrentUser().getUid()+"/roles");
                r1.addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot dataSnapshot) {
                        Iterable<DataSnapshot> iter = dataSnapshot.getChildren();
                        while(iter.iterator().hasNext()) {
                            DataSnapshot ds = iter.iterator().next();
                            String role = ds.getKey();
                        }
                    }

                    @Override
                    public void onCancelled(DatabaseError databaseError) {
                        // do what here?
                    }
                });*/

                /*****************
                 * This stuff works but isn't really where we want to put this
                // TODO shouldn't this be in a thread?
                ((TextView)findViewById(R.id.name)).setText(mFirebaseAuth.getCurrentUser().getDisplayName());

                subscribeToTopics();
                 *************/

            } else {
                // user not authenticated
                Log.d(TAG, "USER NOT AUTHENTICATED");
            }
        }
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
