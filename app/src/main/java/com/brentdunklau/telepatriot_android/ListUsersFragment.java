package com.brentdunklau.telepatriot_android;

import android.app.FragmentManager;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.google.firebase.database.FirebaseDatabase;

/**
 * Created by bdunklau on 10/11/17.
 */

public class ListUsersFragment extends AdminFragment {

    View myView;
    private UserListFragment userListFragment;
    private TextView text_admin, text_director, text_volunteer;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        try {
            myView = inflater.inflate(R.layout.list_users_fragment, container, false);
        }
        catch(Throwable t) {
            t.printStackTrace();
        }

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

    public void onClickRole(String role) {
        /*
        int id = myView.getId();
        TextView textView = (TextView) myView.findViewById(view.getId());
        String role = textView.getText().toString();
        */
        userListFragment.setRole(role);
    }

    private void setOnClickListeners() {
        View.OnClickListener l = new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                String role = ((TextView) view).getText().toString();
                userListFragment.setRole(role);
            }
        };

        text_admin.setOnClickListener(l);
        text_director.setOnClickListener(l);
        text_volunteer.setOnClickListener(l);
    }
}
