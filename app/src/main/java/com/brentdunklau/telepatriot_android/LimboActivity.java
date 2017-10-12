package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.AccountStatusEvent;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.AccountStatusEventHolder;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.OneTime;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.RoleAssignedListener;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.User;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;

/**
 * Created by bdunklau on 10/1/17.
 */

public class LimboActivity extends BaseActivity implements RoleAssignedListener, OneTime {

    protected String TAG = "LimboActivity";
    private FirebaseRecyclerAdapter<AccountStatusEvent, AccountStatusEventHolder> mAdapter;
    private RecyclerView accountStatusEvents;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_limbo);

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        accountStatusEvents = (RecyclerView) findViewById(R.id.account_status_events);
        accountStatusEvents.setLayoutManager(new LinearLayoutManager(this));


        // should not be null because we don't even get here till the user
        // has logged in and been sent here from MainActivity.onActivityResult()
        mFirebaseAuth = FirebaseAuth.getInstance();
        User.getInstance().addRoleAssignedListener(this);
        String uid = User.getInstance().getUid();//mFirebaseAuth.getCurrentUser().getUid();
        final String name = User.getInstance().getName();//mFirebaseAuth.getCurrentUser().getDisplayName();
        final String msg = name + ", welcome to TelePatriot.  Because you are a new user, an admin " +
                "has been notified to assign you to the appropriate group.";
        updateLabel(R.id.txt_limbo, msg);

        database = FirebaseDatabase.getInstance();
        myRef = database.getReference("users/"+uid+"/account_status_events");

        // see:  https://www.youtube.com/watch?v=ynKWnC0XiXk
        mAdapter = new FirebaseRecyclerAdapter<AccountStatusEvent, AccountStatusEventHolder>(
                AccountStatusEvent.class,
                R.layout.list_item,  // see 0:42 of https://www.youtube.com/watch?v=A-_hKWMA7mk
                AccountStatusEventHolder.class,
                myRef) {
            @Override
            public void populateViewHolder(AccountStatusEventHolder holder, AccountStatusEvent evt, int position) {
                holder.setStatus(evt.getDate(), evt.getEvent());
            }
        };

        accountStatusEvents.setAdapter(mAdapter);
    }

    // TODO  try to use fragments from now own
    public void slideOutChatWindow(View view) {
        startActivity(new Intent(this, ChatActivity.class));
        overridePendingTransition(R.anim.slide_from_right, R.anim.slide_to_left);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mAdapter.cleanup();
    }

    public void roleAssigned(String role) {
        Class activity = null;
        if("admin".equalsIgnoreCase(role))
            activity = AdminActivity.class;
        else if("director".equalsIgnoreCase(role))
            activity = DirectorActivity.class;
        /*else if("volunteer".equalsIgnoreCase(role))
            activity = VolunteerActivity.class;*/

        if(activity != null) {
            Intent it = new Intent(this, activity);
            startActivity(it);
        }
    }
}
