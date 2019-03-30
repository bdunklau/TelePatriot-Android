package com.brentdunklau.telepatriot_android;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;

/**
 * Created by bdunklau on 3/11/19.
 */

public class NevermindActivity extends BaseActivity {

    protected String TAG = "NevermindActivity";
    private Button reregister_button, quit_button;


    @Override
    protected void onCreate(final Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_nevermind);

        reregister_button = findViewById(R.id.reregister_button);
        quit_button = findViewById(R.id.quit_button);


        reregister_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                clickReregister();
            }
        });

        quit_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                clickQuit();
            }
        });
    }

    private void clickReregister() {
        startActivity(new Intent(this, LauncherActivity.class));
        finish();
    }

    private void clickQuit() {
        finishAffinity();
    }
}