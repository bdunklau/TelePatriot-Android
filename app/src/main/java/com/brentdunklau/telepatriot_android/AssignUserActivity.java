package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.support.v7.widget.SwitchCompat;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.CheckedTextView;
import android.widget.CompoundButton;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.DbLog;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.UserBean;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.ValueEventListener;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;

/**
 * Created by bdunklau on 10/5/2017.
 */

public class AssignUserActivity extends BaseActivity {

    private SwitchCompat adminSwitch;
    private SwitchCompat directorSwitch;
    private SwitchCompat volunteerSwitch;
    private Button okButton;
    private String uid;
    boolean isAdmin, isDirector, isVolunteer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_assignuser);

        adminSwitch = findViewById(R.id.switch_admin);
        directorSwitch = findViewById(R.id.switch_director);
        volunteerSwitch = findViewById(R.id.switch_volunteer);

        adminSwitch.setSwitchPadding(100);


        adminSwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean b) {
                isAdmin = b;
            }
        });

        directorSwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean b) {
                isDirector = b;
            }
        });

        volunteerSwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean b) {
                isVolunteer = b;
            }
        });


        if (getIntent().getExtras() != null) {
            uid = (String)getIntent().getExtras().get("uid");

            // So we've come to this place because the Admin has clicked a user's name so the Admin
            // can assign him to a group/role.  Clicking the user's name is an event that we want to log
            // to the database: /users/${uid}/account_status_events
            // because the user is probably looking at his screen (LimboActivity) and seeing an Account Status message
            // that says "Admin has been notified".
            // So here, we generate another event that says "Admin is reviewing" or something to that effect
            // This additional notification gives the user a realtime update on his account
            database.getReference("users/"+uid+"/account_status_events").push().setValue(reviewingEvent());

            database.getReference("users").child(uid).addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot dataSnapshot) {
                    UserBean ub = null;
                    try {
                        ub = dataSnapshot.getValue(UserBean.class);
                    } catch(Throwable t) {
                        DbLog.e("UserBean ub = dataSnapshot.getValue(UserBean.class) <- this threw this exception: "+t
                                +"  And because of this exception, 'ub' is null which means we can't do anything else on this screen." +
                                "  At least we check again for null 'ub' object so we don't blow something else up.");
                    }

                    if(ub != null) {
                        updateLabel(R.id.text_name, ub.getName());
                        updateLabel(R.id.text_email, ub.getEmail());
                        isAdmin = ub.isRole("Admin");
                        isDirector = ub.isRole("Director");
                        isVolunteer = ub.isRole("Volunteer");
                        setSwitch(isAdmin, adminSwitch);
                        setSwitch(isDirector, directorSwitch);
                        setSwitch(isVolunteer, volunteerSwitch);
                    }
                }

                @Override
                public void onCancelled(DatabaseError databaseError) {

                }
            });
        }

        okButton = findViewById(R.id.button_ok);

    }

    private HashMap<String, String> reviewingEvent() {
        HashMap<String, String> evt = new HashMap<String, String>();
        String dt = new SimpleDateFormat("MM/dd/yyyy hh:mm a").format(new Date());
        evt.put("date", dt);
        evt.put("event", "Admin ("+ User.getInstance().getName()+") is reviewing your account...");
        return evt;
    }

    public void clickOk(View view) {
        String returnToTab = null;
        if(isVolunteer) {
            returnToTab = "Volunteer";
            setRole("Volunteer");
        } else {
            unsetRole("Volunteer");
        }

        if(isDirector) {
            returnToTab = "Director";
            setRole("Director");
        } else {
            unsetRole("Director");
        }

        if(isAdmin) {
            returnToTab = "Admin";
            setRole("Admin");
        } else {
            unsetRole("Admin");
        }


        // as long is something is set, remove the record from the no_roles node
        if(isAdmin || isDirector || isVolunteer)
            database.getReference("no_roles/"+uid).removeValue();

        // Send the Admin back to the right "tab" (Admin, Director or Volunteer) on
        // ListUsersActivity so he can see the person he just added !
        Intent it = new Intent(this, ListUsersActivity.class);
        it.putExtra("returnToTab", returnToTab);
        startActivity(it);
    }

    private void setRole(String role) {
        database.getReference("users/"+uid+"/roles/"+role).setValue("true");
    }

    private void unsetRole(String role) {
        database.getReference("users/"+uid+"/roles/"+role).removeValue();
    }

    private void setSwitch(final boolean value, final SwitchCompat switchCompat) {
        Handler h = new Handler();
        h.post(new Runnable() {
            @Override
            public void run() {
                switchCompat.setChecked(value);
            }
        });
    }

    protected void updateLabel(final int Rid, final String text) {
        Handler h = new Handler();
        h.post(new Runnable() {
            @Override
            public void run() {
                ((TextView)findViewById(Rid)).setText(text);
            }
        });
    }

}
