package com.brentdunklau.telepatriot_android;

import android.os.Bundle;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.AccountStatusEvent;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.AccountStatusEventHolder;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SlideIt;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.UserBean;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.UserHolder;
import com.firebase.ui.database.FirebaseRecyclerAdapter;

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
        currentActivity = this.getClass();

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        users = (RecyclerView) findViewById(R.id.user_list);
        users.setLayoutManager(new LinearLayoutManager(this));

        myRef = database.getReference("users");

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
        };
        users.setAdapter(mAdapter);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        mAdapter.cleanup();
    }
}
