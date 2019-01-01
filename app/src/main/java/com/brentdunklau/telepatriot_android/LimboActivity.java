package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentTransaction;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.IdRes;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.AccountStatusEvent;
import com.brentdunklau.telepatriot_android.util.AppLog;
import com.brentdunklau.telepatriot_android.util.CBAPIEvent;
import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.VideoNode;
import com.brentdunklau.telepatriot_android.util.VideoParticipant;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 10/1/17.
 */

public class LimboActivity extends BaseActivity implements AccountStatusEvent.Listener /*RoleAssignedListener, OneTime*/ {

    protected String TAG = "LimboActivity";
//    private FirebaseRecyclerAdapter<AccountStatusEvent, AccountStatusEventHolder> mAdapter;
//    private RecyclerView accountStatusEvents;

    private TextView welcome_heading;
    private TextView limboExplanation;
    private TextView access_limited_description;
    private Button show_me_how_button;      // hidden when a video invitation has been extended to this person
    private Button video_invitation_button; // only visible when a video invitation has been extended to this person
    private TextView full_access_description;
    private TextView legal_requirement_1_heading;
    private TextView legal_requirement_1;
    private Button sign_petition_button;
    private TextView legal_requirement_2_heading;
    private TextView legal_requirement_2;
    private Button sign_confidentiality_agreement_button;
    private TextView when_finished_heading;
    private TextView when_finished;
    private Button done_button;

    private String name, email;

    private static final String ACCESS_LIMITED_DESCRIPTION = "You currently have Limited Access to TelePatriot.  With Limited Access, you can " +
            "record video messages of support for the Convention of States and this app will automatically upload them to YouTube," +
            "Facebook and Twitter.  Click SHOW ME HOW to find out how.";

    private static final String YOUVE_BEEN_INVITED_MESSAGE = " has invited you to participate in a video call.  Click \"VIDEO CALL - YOU'RE INVITED!\" to join ";


    @Override
    protected void onCreate(final Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_limbo);

        name = getIntent().getStringExtra("name");
        email = getIntent().getStringExtra("email");
        if(name == null) name = User.getInstance().getName();
        if(email == null) email = User.getInstance().getEmail();

        welcome_heading = findViewById(R.id.welcome_heading);
        limboExplanation = findViewById(R.id.limboExplanation);
        access_limited_description = findViewById(R.id.access_limited_description);
        show_me_how_button = findViewById(R.id.show_me_how_button);
        video_invitation_button = findViewById(R.id.video_invitation_button);
        full_access_description = findViewById(R.id.full_access_description);

//        You do have limited access to TelePatriot even before meeting the legal requirements described below.
        legal_requirement_1_heading = findViewById(R.id.legal_requirement_1_heading);
        legal_requirement_1 = findViewById(R.id.legal_requirement_1);
        sign_petition_button = findViewById(R.id.sign_petition_button);
        legal_requirement_2_heading = findViewById(R.id.legal_requirement_2_heading);
        legal_requirement_2 = findViewById(R.id.legal_requirement_2);
        sign_confidentiality_agreement_button = findViewById(R.id.sign_confidentiality_agreement_button);
        when_finished_heading = findViewById(R.id.when_finished_heading);
        when_finished = findViewById(R.id.when_finished);
        done_button = findViewById(R.id.done_button);

        limboExplanation.setText(name+", welcome to TelePatriot. This app is a powerful tool for " +
                "supporters of the Convention of States Project.");
        access_limited_description.setText("You currently have Limited Access to TelePatriot.  With Limited Access, you can " +
                "record video messages of support for the Convention of States and this app will automatically upload them to YouTube," +
                "Facebook and Twitter.  Click SHOW ME HOW to find out how.");
        full_access_description.setText("For Full Access to TelePatriot, there are two legal requirements you must meet.  They are described below.");

        legal_requirement_1.setText("You must sign the Convention of States petition using this email address: "+email);
        legal_requirement_2.setText("You must sign the Convention of States confidentiality agreement using this email address: "+email);

        when_finished.setText("Once you have signed both documents, click DONE below.");

        sign_petition_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                clickSignPetition();
            }
        });

        sign_confidentiality_agreement_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                clickSignConfidentialityAgreement();
            }
        });

        done_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                clickDone();
            }
        });

        show_me_how_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(LimboActivity.this, ShowMeHowActivity.class));
                Log.i(TAG, "show_me_how_button.setOnClickListener():  DONE");
            }
        });

        video_invitation_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startVideoChat();
            }
        });

        User.getInstance().addAccountStatusEventListener(this);
        // This ---^ misses the first events from User.  This affects the cases of
        // VideoInvitationExtended and VideoInvitationRevoked, so check the User attributes
        // that may have fired these events...
        if(User.getInstance().isAllowed()) {
            fired(new AccountStatusEvent.Allowed());
        }

        if(User.getInstance().getVideo_invitation_from() != null)
            fired(new AccountStatusEvent.VideoInvitationExtended());
        else
            fired(new AccountStatusEvent.VideoInvitationRevoked());
    }

    /**
     * Called from the video_invitation_button
     * Adds the user as a participant on the video node, then sends the user to the VideoChatActivity
     */
    private void startVideoChat() {
        OnCompleteListener onComplete = new OnCompleteListener() {
            @Override
            public void onComplete(@NonNull Task task) {
                startActivity(new Intent(LimboActivity.this, VideoChatActivity.class));
            }
        };
        String room_id = User.getInstance().getCurrent_video_node_key(); // generally always true?
        VideoInvitation.accept(User.getInstance().getCurrent_video_node_key(), User.getInstance(), room_id, onComplete);
    }

    @Override
    public void onBackPressed() {
        // super.onBackPressed(); commented this line in order to disable back press

//        If you land on the limbo screen, I don't WANT you to be able to back up
    }

    private void clickSignPetition() {
        // TODO should get from database
        openUrl("https://www.conventionofstates.com");
    }

    private void clickSignConfidentialityAgreement() {
        // TODO should get from database
        openUrl("https://esign.coslms.com:8443/S/COS/Transaction/Volunteer_Agreement_Manual");
    }

    private void clickDone() {
        long now = System.currentTimeMillis();
        done_button.setText("Verifying...");
        CBAPIEvent evt = new CBAPIEvent.CheckLegal(User.getInstance(), name, email);

        /**
         * See checkLegal() in checkVolunteerStatus.js
         * checkLegal() is triggered by this save()
         */
        evt.save();

        FirebaseDatabase.getInstance()
                .getReference("cb_api_events/check-legal-responses/"+User.getInstance().getUid())
                .orderByChild("date_ms")
                .startAt((double)now)
                .limitToFirst(1)
                .addValueEventListener(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot dataSnapshot) {
                        AppLog.debug(User.getInstance(), TAG, "clickDone", "beginning of onDataChange()");
                        try {
                            for (DataSnapshot child : dataSnapshot.getChildren()) {
                                Boolean valid = child.child("valid").getValue(Boolean.class);
                                done_button.setText(Boolean.TRUE == valid ? "Good" : "Signatures Not Received Yet");
                            }
                        }
                        catch(Throwable t) {
                            AppLog.error(User.getInstance(), TAG, "clickDone", "Throwable: "+t.getMessage());
                        }
                    }

                    @Override
                    public void onCancelled(DatabaseError databaseError) {

                    }
                });
    }

    private void openUrl(String url) {
        Uri uri = Uri.parse(url); // missing 'https://' will cause crash
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        startActivity(intent);
    }


    // TODO  try to use fragments from now own
    public void slideOutChatWindow(View view) {
        /*startActivity(new Intent(this, ChatActivity.class));
        overridePendingTransition(R.anim.slide_from_right, R.anim.slide_to_left);*/
    }


    @Override
    protected void onDestroy() {
        super.onDestroy();
//        mAdapter.cleanup();
    }

    // per AccountStatusEvent.Listener
    @Override
    public void fired(AccountStatusEvent evt) {
        // We don't send the user to MainActivity anymore based on whether they have roles or not
//        if(evt instanceof AccountStatusEvent.RoleAdded)
//            startActivity(new Intent(this, MainActivity.class));

        // We send them based on whether they are truly allowed to go to that screen
        // based on meeting the legal requirements
        if(evt instanceof AccountStatusEvent.Allowed) {
            startActivity(new Intent(this, MainActivity.class));
            User.getInstance().removeAccountStatusEventListener(this);
        }
        else if(evt instanceof AccountStatusEvent.AccountDisabled) {
            startActivity(new Intent(this, DisabledActivity.class));
        }
        else if(evt instanceof AccountStatusEvent.VideoInvitationExtended) {
            show_me_how_button.setVisibility(View.INVISIBLE);
            video_invitation_button.setVisibility(View.VISIBLE);
            access_limited_description.setText(User.getInstance().getVideo_invitation_from_name()+YOUVE_BEEN_INVITED_MESSAGE+User.getInstance().getVideo_invitation_from_name());
        }
        else if(evt instanceof AccountStatusEvent.VideoInvitationRevoked) {
            show_me_how_button.setVisibility(View.VISIBLE);
            video_invitation_button.setVisibility(View.INVISIBLE);
            access_limited_description.setText(ACCESS_LIMITED_DESCRIPTION);
        }
        else if(evt instanceof AccountStatusEvent.LegalAttributesChanged) {

            if(User.getInstance().isHas_signed_petition()) {
                legal_requirement_1.setText("You have already signed the Convention of States petition");
                sign_petition_button.setVisibility(View.GONE);
            }
            else {
                legal_requirement_1.setText("You must sign the Convention of States petition using this email address: "+email);
                sign_petition_button.setVisibility(View.VISIBLE);
            }

            if(User.getInstance().isHas_signed_confidentiality_agreement()) {
                legal_requirement_2.setText("You have already signed the Convention of States confidentiality agreement");
                sign_confidentiality_agreement_button.setVisibility(View.GONE);
            }
            else {
                legal_requirement_2.setText("You must sign the Convention of States confidentiality agreement using this email address: "+email);
                sign_confidentiality_agreement_button.setVisibility(View.VISIBLE);
            }
        }
    }
}
