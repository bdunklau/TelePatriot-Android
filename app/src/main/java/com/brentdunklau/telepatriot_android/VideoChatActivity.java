package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.FragmentActivity;
import android.widget.FrameLayout;

import com.brentdunklau.telepatriot_android.util.AccountStatusEvent;
import com.brentdunklau.telepatriot_android.util.User;

/**
 * Create so that I could transition from LimboActivity to the video chat
 * screen
 */

public class VideoChatActivity extends FragmentActivity implements AccountStatusEvent.Listener {

    @Override
    protected void onCreate(final Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_video_chat);

        User.getInstance().addAccountStatusEventListener(this);
        Fragment fragment = new VidyoChatFragment();
        getFragmentManager().beginTransaction().replace(R.id.content_frame, fragment).commit();

    }

    @Override
    public void fired(AccountStatusEvent evt) {
        if(evt instanceof AccountStatusEvent.VideoInvitationRevoked) {
            User.getInstance().removeAccountStatusEventListener(this);
            this.finish();
            startActivity(new Intent(this, LimboActivity.class));
        }
    }
}
