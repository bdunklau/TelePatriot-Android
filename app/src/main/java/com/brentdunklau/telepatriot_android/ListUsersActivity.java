package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Spinner;
import android.widget.TextView;
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

import org.w3c.dom.Text;

import java.util.HashMap;

/**
 * Created by bdunklau on 10/4/17.
 */

public class ListUsersActivity extends BaseActivity
        //implements SlideIt
{

    private UserListFragment userListFragment;
    private TextView textAdmin, textDirector, textVolunteer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_listusers);
        textAdmin = findViewById(R.id.text_admin);
        textDirector = findViewById(R.id.text_director);
        textVolunteer = findViewById(R.id.text_volunteer);
        userListFragment = (UserListFragment) getSupportFragmentManager().findFragmentById(R.id.user_list_fragment);
        userListFragment.setDatabase(database);

        String showTab = "Admin";
        if (getIntent().getExtras() != null && getIntent().getExtras().get("returnToTab") != null) {
            showTab = (String) getIntent().getExtras().get("returnToTab");
        }
        userListFragment.setRole(showTab);
    }

    public void onClickRole(View view) {
        int id = view.getId();
        TextView textView = (TextView) findViewById(view.getId());
        String role = textView.getText().toString();
        userListFragment.setRole(role);
    }
}
