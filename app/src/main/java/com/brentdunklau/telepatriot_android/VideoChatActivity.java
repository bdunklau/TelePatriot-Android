package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.os.Bundle;
import android.support.v4.app.FragmentActivity;
import android.widget.FrameLayout;

/**
 * Create so that I could transition from LimboActivity to the video chat
 * screen
 */

public class VideoChatActivity extends FragmentActivity {

    @Override
    protected void onCreate(final Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_video_chat);

        Fragment fragment = new VidyoChatFragment();
        getFragmentManager().beginTransaction().replace(R.id.content_frame, fragment).commit();

    }
}
