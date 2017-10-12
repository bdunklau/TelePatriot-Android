package com.brentdunklau.telepatriot_android;

import android.os.Bundle;
import android.util.Log;

/**
 * Created by bdunklau on 10/3/17.
 */

public class DirectorActivity extends BaseActivity
        //implements SlideIt
{

    private final static String TAG = "DirectoryActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.director_fragment);
        //swipeAdapter = new SwipeAdapter(this, this);
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.d(TAG, "resume");
    }

    @Override
    protected void onStart() {
        super.onStart();
    }
}
