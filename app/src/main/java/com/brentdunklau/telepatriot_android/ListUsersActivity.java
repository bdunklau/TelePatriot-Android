package com.brentdunklau.telepatriot_android;

import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

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
        setContentView(R.layout.list_users_fragment);
        textAdmin = findViewById(R.id.text_admin);
        textDirector = findViewById(R.id.text_director);
        textVolunteer = findViewById(R.id.text_volunteer);

        // We WERE using getSupportFragmentManager() but that returns a FragmentManager in one of those v4 compatibility packages
        // Not sure which to use right now.  Just getting stuff to compile.
        userListFragment = (UserListFragment) getFragmentManager().findFragmentById(R.id.user_list_fragment);

        String showTab = "Admin";
        if (getIntent().getExtras() != null && getIntent().getExtras().get("returnToTab") != null) {
            showTab = (String) getIntent().getExtras().get("returnToTab");
        }
        //userListFragment.setRole(showTab);
    }

    public void onClickRole(View view) {
        int id = view.getId();
        TextView textView = (TextView) findViewById(view.getId());
        String role = textView.getText().toString();
        //userListFragment.setRole(role);
    }
}
