package com.brentdunklau.telepatriot_android;

import android.os.Bundle;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SwipeAdapter;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.WhereYouAre;

/**
 * Created by bdunklau on 10/3/17.
 */

public class DirectorActivity extends BaseActivity implements WhereYouAre {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_director);
        this.swipeAdapter = new SwipeAdapter(this, this, this);
    }

    @Override
    public Class onTheLeft() {
        return AdminActivity.class;
    }

    @Override
    public Class onTheRight() {
        return null;
    }
}
