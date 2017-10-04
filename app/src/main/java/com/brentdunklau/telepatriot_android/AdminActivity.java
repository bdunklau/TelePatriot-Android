package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SlideIt;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SwipeAdapter;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.User;

/**
 * Created by bdunklau on 10/2/17.
 */

public class AdminActivity extends BaseActivity implements SlideIt {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin);
        swipeAdapter = new SwipeAdapter(this, this);
        user = User.getInstance();
    }

    private Class onTheLeft() {
        return user.activityOnTheLeft(AdminActivity.class);
    }

    private Class onTheRight() {
        return user.activityOnTheRight(AdminActivity.class);
    }


    @Override
    public void rightToLeft() {
        Intent it = new Intent(this, onTheRight());
        startActivity(it);
        overridePendingTransition(R.anim.slide_from_right, R.anim.slide_to_left);
    }

    @Override
    public void leftToRight() {
        Intent it = new Intent(this, onTheLeft());
        startActivity(it);
        overridePendingTransition(R.anim.slide_from_left, R.anim.slide_to_right);
    }
/*
    @Override
    protected void onPause() {
        super.onPause();
        Log.d("AdminActivity", "paused");
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.d("AdminActivity", "resume");
    }

    @Override
    protected void onStart() {
        super.onStart();
        Log.d("AdminActivity", "start");
    }*/
}
