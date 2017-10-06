package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SlideIt;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.SwipeAdapter;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.User;

/**
 * Created by bdunklau on 10/2/17.
 */

public class AdminActivity extends BaseActivity
        //implements SlideIt
{

    private final static String TAG = "AdminActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin);
        //swipeAdapter = new SwipeAdapter(this, this);
        user = User.getInstance();
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.d(TAG, "resume");
    }

    @Override
    protected void onStart() {
        super.onStart();
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch(item.getItemId()) {
            case(R.id.list_unassigned_users):
                listUnassignedUsers();
                return true;
            case(R.id.list_users):
                listUsers();
                return true;
            case(R.id.chat_help):
                return true;
            case(R.id.sign_out_menu):
                signOut();
                return true;
            default: return super.onOptionsItemSelected(item);
        }
    }

    void listUsers() {
        Intent it = new Intent(this, ListUsersActivity.class);
        startActivity(it);
    }

    void listUnassignedUsers() {
        Intent it = new Intent(this, UnassignedUsersActivity.class);
        startActivity(it);
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.admin_menu, menu);
        //return true;
        return super.onCreateOptionsMenu(menu);
    }
}
