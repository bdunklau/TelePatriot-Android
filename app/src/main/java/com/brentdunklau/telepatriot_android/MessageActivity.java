package com.brentdunklau.telepatriot_android;


import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.Toast;
import com.google.firebase.messaging.FirebaseMessaging;

/**
 * This was created from MainActivity and currently (10/8/17) isn't being called at all
 * But it does have some message/chat code that I want to keep until I get around to
 * putting chat into the app.
 */
public class MessageActivity extends BaseActivity
        //implements SlideIt
{

    private static final int RC_SIGN_IN = 1;
    private static final String TAG = "MessageActivity";
    public static final String ANONYMOUS = "anonymous";

    //private String dataTitle, dataMessage;
    private EditText title, message;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_message);
        /**
         * see:  https://stackoverflow.com/a/11656129
         */
        setupUI(findViewById(R.id.main_view));

        myRef = database.getReference("messages");

        title = findViewById(R.id.title);
        message = findViewById(R.id.message);

        // Left as a comment because SwipeAdapter does provide an example of how to do swiping
        // even though we're not swiping to change perspectives anymore
        //this.swipeAdapter = new SwipeAdapter(this, this);

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
                    hideSoftKeyboard(MessageActivity.this);
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
