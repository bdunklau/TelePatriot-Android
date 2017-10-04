package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SlideIt;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SwipeAdapter;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.User;

/**
 * Created by bdunklau on 10/2/17.
 */

public class AdminActivity extends BaseActivity implements SlideIt {

    private final static String TAG = "AdminActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin);
        currentActivity = this.getClass();
        swipeAdapter = new SwipeAdapter(this, this);
        user = User.getInstance();
    }

    @Override
    protected void onResume() {
        super.onResume();
        currentActivity = this.getClass();
        Log.d(TAG, "resume");
    }

    @Override
    protected void onStart() {
        super.onStart();
        currentActivity = this.getClass();
    }
}
