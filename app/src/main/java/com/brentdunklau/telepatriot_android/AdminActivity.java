package com.brentdunklau.telepatriot_android;

import android.os.Bundle;
import android.transition.Slide;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SlideIt;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SwipeAdapter;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.WhereYouAre;

/**
 * Created by bdunklau on 10/2/17.
 */

public class AdminActivity extends BaseActivity implements WhereYouAre {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin);
        this.swipeAdapter = new SwipeAdapter(this, this, this);
    }

    @Override
    public Class onTheLeft() {
        return null;
    }

    @Override
    public Class onTheRight() {
        return DirectorActivity.class;
    }
}
