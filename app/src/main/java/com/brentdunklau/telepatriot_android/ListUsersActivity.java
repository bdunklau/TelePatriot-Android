package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.AccountStatusEvent;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.AccountStatusEventHolder;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SlideIt;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.UserBean;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.UserHolder;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.ValueEventListener;

import java.util.HashMap;

/**
 * Created by bdunklau on 10/4/17.
 */

public class ListUsersActivity extends BaseActivity implements SlideIt {

    private FirebaseRecyclerAdapter<UserBean, UserHolder> mAdapter;
    protected String TAG = "ListUsersActivity";
    private RecyclerView users;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_listusers);
        currentActivity = this.getClass(); // get rid of this probably ...in all activity classes

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        users = (RecyclerView) findViewById(R.id.user_list);
        users.setLayoutManager(new LinearLayoutManager(this));

        // Just focusing on users that need to be assigned to a role
        myRef = database.getReference("no_roles");
        myRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                if(dataSnapshot.getValue() == null) {
                    // print a "Your Work is Done" message
                    // All users are in a role
                    String workIsDone = "Your work is done here. All users have been assigned to at least one group.";
                    updateLabel(R.id.txt_explanation, workIsDone);
                }
                else {
                    // this is the case where we have some new users that need to be assigned to a role
                    doit();
                }
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {

            }
        });


    }

    private void doit() {

        // see:  https://www.youtube.com/watch?v=ynKWnC0XiXk
        mAdapter = new FirebaseRecyclerAdapter<UserBean, UserHolder>(
                UserBean.class,
                R.layout.list_item,  // see 0:42 of https://www.youtube.com/watch?v=A-_hKWMA7mk
                UserHolder.class,
                myRef) {
            @Override
            public void populateViewHolder(UserHolder holder, UserBean user, int position) {
                holder.setName(user.getName());
            }


            // https://stackoverflow.com/a/41629505
            @Override
            public UserHolder onCreateViewHolder(ViewGroup parent, int viewType) {
                UserHolder viewHolder = super.onCreateViewHolder(parent, viewType);
                viewHolder.setOnClickListener(new UserHolder.ClickListener() {
                    @Override
                    public void onItemClick(View view, int position) {
                        int vid = view.getId();
                        Log.d("ListUsersActivity", "view.getId()="+view.getId());
                        mAdapter.getRef(position).orderByKey().addListenerForSingleValueEvent(new ValueEventListener() {
                            @Override
                            public void onDataChange(DataSnapshot dataSnapshot) {
                                HashMap map = (HashMap) dataSnapshot.getValue();
                                Intent it = new Intent(ListUsersActivity.this, AssignUserActivity.class);
                                it.putExtra("uid", dataSnapshot.getKey());
                                it.putExtra("name", map.get("name")+"");
                                it.putExtra("email", map.get("email")+"");
                                it.putExtra("photoUrl", map.get("photoUrl")+"");
                                startActivity(it);
                            }

                            @Override
                            public void onCancelled(DatabaseError databaseError) {

                            }
                        });
                    }

                    @Override
                    public void onItemLongClick(View view, int position) {
                    }
                });
                return viewHolder;
            }
        };
        users.setAdapter(mAdapter);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mAdapter.cleanup();
    }
}
