package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SlideIt;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SwipeAdapter;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.User;

/**
 * Created by bdunklau on 10/3/17.
 */

public class DirectorActivity extends BaseActivity implements SlideIt {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_director);
        swipeAdapter = new SwipeAdapter(this, this);
        user = User.getInstance();
    }


    private Class onTheLeft() {
        return user.activityOnTheLeft(DirectorActivity.class);
    }


    private Class onTheRight() {
        return user.activityOnTheRight(DirectorActivity.class);
    }


    @Override
    public void rightToLeft() {
        Class onTheRight = onTheRight();
        if(onTheRight != null) {
            Intent it = new Intent(this, onTheRight());
            startActivity(it);
            overridePendingTransition(R.anim.slide_from_right, R.anim.slide_to_left);
        }
    }

    @Override
    public void leftToRight() {
        Class onTheLeft = onTheLeft();
        if(onTheLeft != null) {
            Intent it = new Intent(this, onTheLeft());
            startActivity(it);
            overridePendingTransition(R.anim.slide_from_left, R.anim.slide_to_right);
        }
    }

/*
    @Override
    protected void onPause() {
        super.onPause();
        Log.d("DirectorActivity", "paused");
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.d("DirectorActivity", "resume");
    }*/
}
