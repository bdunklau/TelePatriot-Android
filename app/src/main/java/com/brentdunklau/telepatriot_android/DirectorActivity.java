package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SlideIt;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SwipeAdapter;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.User;

/**
 * Created by bdunklau on 10/3/17.
 */

public class DirectorActivity extends BaseActivity implements SlideIt {

    private final static String TAG = "DirectoryActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_director);
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
