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

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.UserBean;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.ValueEventListener;

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
            database.getReference("users").child(uid).addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot dataSnapshot) {
                    UserBean ub = null;
                    try {
                        ub = dataSnapshot.getValue(UserBean.class);
                    } catch(Throwable t) {
                        Log.d("d", "x");
                    }
                    updateLabel(R.id.text_name, ub.getName());
                    updateLabel(R.id.text_email, ub.getEmail());
                    isAdmin = ub.isRole("Admin");
                    isDirector = ub.isRole("Director");
                    isVolunteer = ub.isRole("Volunteer");
                    setSwitch(isAdmin, adminSwitch);
                    setSwitch(isDirector, directorSwitch);
                    setSwitch(isVolunteer, volunteerSwitch);
                }

                @Override
                public void onCancelled(DatabaseError databaseError) {

                }
            });
        }

        okButton = findViewById(R.id.button_ok);

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
