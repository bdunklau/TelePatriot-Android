package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;

/**
 * Created by bdunklau on 10/10/2017.
 */

public class ChatActivity extends BaseActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_chat);
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
        startActivity(new Intent(this, LimboActivity.class));
        overridePendingTransition(R.anim.slide_from_left, R.anim.slide_to_right);
    }
}
