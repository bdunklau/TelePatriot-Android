package com.brentdunklau.telepatriot_android;

import android.app.FragmentTransaction;
import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.support.constraint.ConstraintLayout;
import android.support.design.widget.NavigationView;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.ActionBarDrawerToggle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.User;

public class MainActivity extends AppCompatActivity
        implements NavigationView.OnNavigationItemSelectedListener {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        /**
         * KINDA NEAT - not sure how to use this right now.  But it's a little pink bubble/button
         with an email envelope image in it.

         So we could have something like this that would let users share this app with people
         or post to twitter or just about anything

         See app_bar_main.xml
         */
        /*
        FloatingActionButton fab = (FloatingActionButton) findViewById(R.id.fab);
        fab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Snackbar.make(view, "Replace with your own action", Snackbar.LENGTH_LONG)
                        .setAction("Action", null).show();
            }
        });
        */


        DrawerLayout drawer = (DrawerLayout) findViewById(R.id.drawer_layout);
        ActionBarDrawerToggle toggle = new ActionBarDrawerToggle(
                this, drawer, toolbar, R.string.navigation_drawer_open, R.string.navigation_drawer_close);
        drawer.setDrawerListener(toggle);
        toggle.syncState();

        NavigationView navigationView = (NavigationView) findViewById(R.id.nav_view);
        navigationView.setNavigationItemSelectedListener(this);
        //if(User.getInstance().isLoggedIn()) {
            View navHeaderView = navigationView.getHeaderView(0);  // https://stackoverflow.com/a/38418531
            final TextView text_user_name = (TextView)navHeaderView.findViewById(R.id.text_user_name);
            final TextView text_user_email = (TextView)navHeaderView.findViewById(R.id.text_user_email);
            Runnable r = new Runnable() {
                @Override
                public void run() {
                    text_user_name.setText(User.getInstance().getName());
                    text_user_email.setText(User.getInstance().getEmail());
                }
            };
            Handler h = new Handler();
            h.post(r);
        //}
    }

    @Override
    public void onBackPressed() {
        DrawerLayout drawer = (DrawerLayout) findViewById(R.id.drawer_layout);
        if (drawer.isDrawerOpen(GravityCompat.START)) {
            drawer.closeDrawer(GravityCompat.START);
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    @SuppressWarnings("StatementWithEmptyBody")
    @Override
    public boolean onNavigationItemSelected(MenuItem item) {
        // Handle navigation view item clicks here.
        int id = item.getItemId();
        android.app.FragmentManager fragmentManager = getFragmentManager();


        if (id == R.id.nav_volunteer_layout) {
            fragmentManager.beginTransaction().replace(R.id.content_frame, new VolunteerFragment()).commit();
        } else if (id == R.id.nav_director_layout) {
            fragmentManager.beginTransaction().replace(R.id.content_frame, new DirectorFragment()).commit();
        } else if (id == R.id.nav_admin_layout) {
            fragmentManager.beginTransaction().replace(R.id.content_frame, new AdminFragment()).commit();
        } else if (id == R.id.nav_chat && User.getInstance().isLoggedIn()) {
            String uid = User.getInstance().getUid();
            ChatFragment chatFragment = new ChatFragment();
            FragmentTransaction transaction = fragmentManager.beginTransaction();
            transaction.setCustomAnimations(R.animator.slide_from_right, R.animator.slide_to_left);
            transaction.replace(R.id.content_frame, chatFragment);
            transaction.addToBackStack(null);
            transaction.commit();
        } else if (id == R.id.nav_signout) {

        }

        DrawerLayout drawer = (DrawerLayout) findViewById(R.id.drawer_layout);
        drawer.closeDrawer(GravityCompat.START);
        return true;
    }
}
