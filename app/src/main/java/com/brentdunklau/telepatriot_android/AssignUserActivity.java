package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.widget.SwitchCompat;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.CheckedTextView;
import android.widget.CompoundButton;

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
        currentActivity = this.getClass(); // get rid of this probably ...in all activity classes

        if (getIntent().getExtras() != null) {
            uid = (String)getIntent().getExtras().get("uid");
            String name = (String)getIntent().getExtras().get("name");
            String email = (String)getIntent().getExtras().get("email");
            updateLabel(R.id.text_name, name);
            updateLabel(R.id.text_email, email);
        }

        adminSwitch = findViewById(R.id.switch_admin);
        directorSwitch = findViewById(R.id.switch_director);
        volunteerSwitch = findViewById(R.id.switch_volunteer);
        okButton = findViewById(R.id.button_ok);

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
    }

    public void clickOk(View view) {
        if(isAdmin) {
            setRole("Admin");
        } else {
            unsetRole("Admin");
        }
        if(isDirector) {
            setRole("Director");
        } else {
            unsetRole("Director");
        }

        if(isVolunteer) {
            setRole("Volunteer");
        } else {
            unsetRole("Volunteer");
        }

        // as long is something is set, remove the record from the no_roles node
        if(isAdmin || isDirector || isVolunteer)
            database.getReference("no_roles/"+uid).removeValue();

        startActivity(new Intent(this, ListUsersActivity.class));
    }

    private void setRole(String role) {
        database.getReference("users/"+uid+"/roles/"+role).setValue("true");
    }

    private void unsetRole(String role) {
        database.getReference("users/"+uid+"/roles/"+role).removeValue();
    }

}
