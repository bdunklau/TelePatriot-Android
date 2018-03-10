package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.support.annotation.NonNull;
import android.support.design.widget.NavigationView;
import android.support.v4.view.GravityCompat;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.ActionBarDrawerToggle;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.util.Log;
import android.view.Gravity;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.brentdunklau.telepatriot_android.util.AccountStatusEvent;
import com.brentdunklau.telepatriot_android.util.User;
import com.firebase.ui.auth.AuthUI;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.database.FirebaseDatabase;
import com.squareup.picasso.Picasso;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends AppCompatActivity
        implements NavigationView.OnNavigationItemSelectedListener, AccountStatusEvent.Listener,
        MissionItemWrapUpFragment.QuitListener {

    private String TAG = "MainActivity";

    TextView text_user_name;
    TextView text_user_email;
    ImageView image_profile_pic;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_main);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        User.getInstance().addAccountStatusEventListener(this);


/*
        Holdover from back when everything was an activity.  This is how we were closing down the
        app.  If we don't end up needing this soon (10/12/17), then just delete it.

        // https://stackoverflow.com/a/14002030
        if (getIntent().getBooleanExtra("EXIT", false)) {
            finish();
        }
        */



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
        drawer.openDrawer(Gravity.START);

        NavigationView navigationView = (NavigationView) findViewById(R.id.nav_view);
        navigationView.setNavigationItemSelectedListener(this);


        View navHeaderView = navigationView.getHeaderView(0);  // https://stackoverflow.com/a/38418531
        text_user_name = (TextView)navHeaderView.findViewById(R.id.text_user_name);
        text_user_email = (TextView)navHeaderView.findViewById(R.id.text_user_email);
        image_profile_pic = (ImageView)navHeaderView.findViewById(R.id.image_profile_pic);

        Runnable r = new Runnable() {
            @Override
            public void run() {
                // This is where we set the name, email and profile pick in the Navigation Drawer
                text_user_name.setText(User.getInstance().getName());
                text_user_email.setText(User.getInstance().getEmail());
                if(User.getInstance().isEmailMissing()) {
                    text_user_email.setTextColor(0xFFFFFF00);
                }
                String photoUrl = User.getInstance().getPhotoURL();
                System.out.println(photoUrl);
                Log.d("MainActivity", photoUrl);
                try {
                    Context ctx = getApplicationContext();
                    Picasso.with(ctx).setLoggingEnabled(true);
                    Picasso.with(MainActivity.this).load(photoUrl).fit().into(image_profile_pic);

      // dev:  OK      https://scontent.xx.fbcdn.net/v/t1.0-1/p100x100/15439743_10153884236291370_5482786558312089303_n.jpg?oh=6ed5db40855629a3253f222e3c69e914&oe=5AD064B1
      // prod: NOT OK  https://scontent.xx.fbcdn.net/v/t1.0-1/p100x100/15439743_10153884236291370_5482786558312089303_n.jpg?oh=447d44d77c8f56f6eb619a21f8ee83ae&oe=5A814AB1

                } catch(Throwable t) {
                    String msg = t.getMessage();
                    t.printStackTrace();
                }
            }
        };
        Handler h = new Handler();
        h.post(r);

        text_user_name.setOnClickListener(beginEditingMyAccount());
        text_user_email.setOnClickListener(beginEditingMyAccount());
        image_profile_pic.setOnClickListener(beginEditingMyAccount());
    }


    private View.OnClickListener beginEditingMyAccount() {
        return new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                editMyAccount();
            }
        };
    }


    private void editMyAccount() {
        final boolean emailWasMissing = User.getInstance().isEmailMissing(); // not sure exactly what it's going to equal
        // but this method was originally added specifically for the user's that didn't get their Facebook emails
        // passed over.  For these people, they never got sent to the Limbo screen.  So that's where we need to send them
        // once they provide an email address here.

        android.app.FragmentManager fragmentManager = getFragmentManager();
        EditMyAccountFragment fragment = new EditMyAccountFragment();
        fragment.setOnCompleteListener(new OnCompleteListener<Void>() {
            @Override
            public void onComplete(@NonNull Task<Void> task) {
                boolean successful = task.isSuccessful();
                if (successful) {
                    text_user_name.setText(User.getInstance().getName());
                    text_user_email.setText(User.getInstance().getEmail());
                    String photoUrl = User.getInstance().getPhotoURL();
                    Context ctx = getApplicationContext();
                    Picasso.with(ctx).setLoggingEnabled(true);
                    Picasso.with(MainActivity.this).load(photoUrl).fit().into(image_profile_pic);
                    Toast.makeText(getApplicationContext(), "Save Successful", Toast.LENGTH_SHORT).show();
                    if(emailWasMissing) {
                        // if the email WAS missing, we have to write a record under the /no_roles node
                        // see this line:
                        //      var userrecord = {name:name, photoUrl:photoUrl, email:email, created: created, account_disposition: "enabled"}
                        // from: userCreated.js
                        Map userValues = new HashMap();
                        userValues.put("name", User.getInstance().getName());
                        userValues.put("photoUrl", User.getInstance().getPhotoURL());
                        userValues.put("email", User.getInstance().getEmail());
                        userValues.put("created", new SimpleDateFormat("MMM d, yyyy h:mm a z").format(new Date()));
                        userValues.put("account_disposition", "enabled");
                        FirebaseDatabase.getInstance().getReference("/no_roles/"+User.getInstance().getUid()).setValue(userValues);

                        // put the same user data here also because we may only have account_status_event's and nothing else
                        FirebaseDatabase.getInstance().getReference("/users/"+User.getInstance().getUid()).updateChildren(userValues);

                        // And we need to send the user to the Limbo screen because
                        // they never had to pass through that screen
                        MainActivity.this.startActivity(new Intent(MainActivity.this, LimboActivity.class));

                    }
                }
            }
        });
        fragmentManager.beginTransaction().replace(R.id.content_frame, fragment).addToBackStack(fragment.getClass().getName()).commit();
        DrawerLayout drawer = findViewById(R.id.drawer_layout);
        drawer.closeDrawer(GravityCompat.START);
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

        return super.onOptionsItemSelected(item);
    }

    @SuppressWarnings("StatementWithEmptyBody")
    @Override
    public boolean onNavigationItemSelected(MenuItem item) {
        // Handle navigation view item clicks here.
        int id = item.getItemId();
        android.app.FragmentManager fragmentManager = getFragmentManager();

        if (id == R.id.nav_switch_teams) {
            Fragment fragment = new SwitchTeamsFragment();
            fragmentManager.beginTransaction().replace(R.id.content_frame, fragment).addToBackStack(fragment.getClass().getName()).commit();
        }
        else if (id == R.id.nav_volunteer_layout) {
            Fragment fragment = new MyMissionFragment();
            fragmentManager.beginTransaction().replace(R.id.content_frame, fragment).addToBackStack(fragment.getClass().getName()).commit();
        } else if (id == R.id.nav_director_layout) {
            //Fragment fragment = new DirectorFragment(); // maybe this will go back in at some point.  It shows "Missions" button and "Teams" button
            Fragment fragment = new MissionsFragment();
            fragmentManager.beginTransaction().replace(R.id.content_frame, fragment).addToBackStack(fragment.getClass().getName()).commit();
        } else if (id == R.id.nav_admin_layout) {
            Fragment fragment = new AdminFragment();
            fragmentManager.beginTransaction().replace(R.id.content_frame, fragment).addToBackStack(fragment.getClass().getName()).commit();
        }
        /***** take out till it's you now the petition link is correct
        else if( id == R.id.nav_send_petition) {
            Fragment fragment = new SendPetitionFragment();
            fragmentManager.beginTransaction().replace(R.id.content_frame, fragment).addToBackStack(fragment.getClass().getName()).commit();
        }
         *****/
        /******
        else if (id == R.id.nav_chat && User.getInstance().isLoggedIn()) {
            doChat();
        } *****/
        else if (id == R.id.nav_signout) {
            signOut();
        }

        DrawerLayout drawer = (DrawerLayout) findViewById(R.id.drawer_layout);
        drawer.closeDrawer(GravityCompat.START);
        return true;
    }

    /**
     * This method figures out which chat screen we should go to.  If the user is a
     * volunteer, we send them to ChatFragment.  If the user is a director or admin,
     * we send them to ChatAllFragment.  ChatAllFragment is where we show a list of users
     * that the admin/director can then choose from to engage.
     */
    private void doChat() {

        FragmentManager fragmentManager = getFragmentManager();
        if(User.getInstance().isVolunteerOnly()) {
            ChatFragment chatFragment = new ChatFragment();
            chatFragment.userNeedsHelp();
            FragmentTransaction transaction = fragmentManager.beginTransaction();
            transaction.setCustomAnimations(R.animator.slide_from_right, R.animator.slide_to_left);
            transaction.replace(R.id.content_frame, chatFragment);
            transaction.addToBackStack(chatFragment.getClass().getName());
            transaction.commit();
        }
        else {
            ChatAllFragment chatAllFragment = new ChatAllFragment();
            FragmentTransaction transaction = fragmentManager.beginTransaction();
            transaction.setCustomAnimations(R.animator.slide_from_right, R.animator.slide_to_left);
            transaction.replace(R.id.content_frame, chatAllFragment);
            transaction.addToBackStack(chatAllFragment.getClass().getName());
            transaction.commit();
        }
    }


    // per MissionItemWrapUpFragment.QuitListener
    public void quit() {
        signOut();
    }

    private void signOut() {
        AuthUI aui = AuthUI.getInstance();
        aui.signOut(this)
                .addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        Log.d("MainActivity", "USER LOGGED OUT");
                        finishAffinity();
                    }
                });
    }

    @Override
    protected void onPause() {
        super.onPause();
        Log.d(TAG, "onPause");
        //handleCurrentMissionItem();
    }

    @Override
    protected void onStop() {
        super.onStop();
        Log.d(TAG, "onStop");
        //handleCurrentMissionItem();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "onDestroy");
        handleCurrentMissionItem();
    }

    private boolean userInTheMiddleOfSomething() {
        boolean hasMission = User.getInstance().getCurrentMissionItem() != null;
        return hasMission;
    }

    private void unassignMissionItem() {
        User.getInstance().unassignCurrentMissionItem();
    }

    private void handleCurrentMissionItem() {
        if(userInTheMiddleOfSomething()) {
            // alert the user that he should skip/dismiss the current mission?
            // why do that?  why can't we just un-assign the mission FOR them?
            Log.d(TAG, "un-assigning mission item");
            unassignMissionItem();
        }
    }

    // per AccountStatusEvent.Listener
    @Override
    public void fired(AccountStatusEvent evt) {
        if(evt instanceof AccountStatusEvent.NoRoles)
            startActivity(new Intent(this, LimboActivity.class));
    }
}
