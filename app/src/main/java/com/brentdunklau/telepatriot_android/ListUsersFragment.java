package com.brentdunklau.telepatriot_android;

import android.app.FragmentManager;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.PassInfo;
import com.google.firebase.database.FirebaseDatabase;

import java.util.Map;

/**
 * Created by bdunklau on 10/11/17.
 */

public class ListUsersFragment extends AdminFragment implements PassInfo {

    View myView;
    private UserListFragment userListFragment;
    private TextView text_admin, text_director, text_volunteer;
    private String useThisRole;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        try {
            myView = inflater.inflate(R.layout.list_users_fragment, container, false);
        }
        catch(Throwable t) {
            t.printStackTrace();
        }

        View cf = container.findViewById(R.id.content_frame);
        int rid = R.id.content_frame;
        int cid = cf.getId();

        setHasOptionsMenu(true);

        text_admin = myView.findViewById(R.id.text_admin);
        text_director = myView.findViewById(R.id.text_director);
        text_volunteer = myView.findViewById(R.id.text_volunteer);

        setOnClickListeners();

        FragmentManager fragmentManager = getChildFragmentManager();
        userListFragment = (UserListFragment) fragmentManager.findFragmentById(R.id.user_list_fragment);
        try {
            userListFragment.setDatabase(FirebaseDatabase.getInstance());
        }
        catch(Throwable t) {
            t.printStackTrace();
        }
/*
        String showTab = "Admin";
        if (getIntent().getExtras() != null && getIntent().getExtras().get("returnToTab") != null) {
            showTab = (String) getIntent().getExtras().get("returnToTab");
        }
        userListFragment.setRole(showTab);
        */
        String tag = userListFragment.getTag();

        return myView;
    }

    @Override
    public void onResume() {
        super.onResume();
        if(useThisRole != null) {
            userListFragment.setRole(useThisRole, getFragmentManager(), this);
            useThisRole = null;
        }
    }

    private void setOnClickListeners() {
        View.OnClickListener l = new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                String role = ((TextView) view).getText().toString();
                userListFragment.setRole(role, getFragmentManager(), ListUsersFragment.this);
            }
        };

        text_admin.setOnClickListener(l);
        text_director.setOnClickListener(l);
        text_volunteer.setOnClickListener(l);
    }

    public void pass(Map m) {
        if(m != null && m.containsKey("role")) {
            useThisRole = m.get("role").toString();
        }
    }
}
