package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.AccountStatusEvent;
import com.brentdunklau.telepatriot_android.util.User;

/**
 * Created by bdunklau on 8/30/18.
 */

public class DisabledActivity extends BaseActivity implements AccountStatusEvent.Listener
{


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_disabled);
        User.getInstance().addAccountStatusEventListener(this);
    }

    @Override
    public void fired(AccountStatusEvent evt) {

        if(evt instanceof AccountStatusEvent.AccountEnabled
                || evt instanceof AccountStatusEvent.NotAllowed) {

            /**
             * If a user goes from disabled to enabled, we will send them through the limbo screen
             * and make them click "Done" again.  Seems ok to me.
             */
            startActivity(new Intent(this, LimboActivity.class));
            User.getInstance().removeAccountStatusEventListener(this);
        }
    }

    @Override
    public void onBackPressed() {
        // super.onBackPressed(); commented this line in order to disable back press

//        If you land on the limbo screen, I don't WANT you to be able to back up
    }
}
