package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.os.Bundle;
import android.os.Handler;
import android.support.annotation.Nullable;
import android.support.v7.widget.SwitchCompat;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.DbLog;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.PassInfo;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.UserBean;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by bdunklau on 10/5/2017.
 */

public class AssignUserFragment extends AdminFragment {

    private SwitchCompat adminSwitch;
    private SwitchCompat directorSwitch;
    private SwitchCompat volunteerSwitch;
    private Button okButton, chatButton;
    private String uid;
    boolean isAdmin, isDirector, isVolunteer;
    View myView;
    private FragmentManager fragmentManager;
    private Fragment back;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.assignuser_fragment, container, false);
        setUI();
        return myView;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public void setFragmentManager(FragmentManager fragmentManager, Fragment back) {
        this.fragmentManager = fragmentManager;
        this.back = back;
    }

    private void setUI() {

        adminSwitch = myView.findViewById(R.id.switch_admin);
        directorSwitch = myView.findViewById(R.id.switch_director);
        volunteerSwitch = myView.findViewById(R.id.switch_volunteer);

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

        // So we've come to this place because the Admin has clicked a user's name so the Admin
        // can assign him to a group/role.  Clicking the user's name is an event that we want to log
        // to the database: /users/${uid}/account_status_events
        // because the user is probably looking at his screen (LimboActivity) and seeing an Account Status message
        // that says "Admin has been notified".
        // So here, we generate another event that says "Admin is reviewing" or something to that effect
        // This additional notification gives the user a realtime update on his account
        FirebaseDatabase database = FirebaseDatabase.getInstance();
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

        okButton = myView.findViewById(R.id.button_ok);
        okButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                clickOk(view);
            }
        });

        chatButton = myView.findViewById(R.id.chat_button);
        chatButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // This is a director or admin starting or joining a chat with someone
                ChatFragment chatFragment = new ChatFragment();
                chatFragment.setTo(uid);
                FragmentTransaction transaction = fragmentManager.beginTransaction();
                transaction.setCustomAnimations(R.animator.slide_from_right, R.animator.slide_to_left);
                transaction.replace(R.id.content_frame, chatFragment);
                transaction.addToBackStack(null);
                transaction.commit();
            }
        });

        setHasOptionsMenu(true);
    }

    private HashMap<String, String> reviewingEvent() {
        HashMap<String, String> evt = new HashMap<String, String>();
        String dt = new SimpleDateFormat("MMM d, yyyy h:mm a z").format(new Date());
        evt.put("date", dt);
        evt.put("event", "Admin ("+ User.getInstance().getName()+") is reviewing your account...");
        return evt;
    }

    public void clickOk(View view) {
        String returnToTab = "Admin";
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
            FirebaseDatabase.getInstance().getReference("no_roles/"+uid).removeValue();

        if(back instanceof PassInfo) {
            Map m = new HashMap();
            m.put("role", returnToTab);
            ((PassInfo) back).pass(m);
        }

        FragmentTransaction t1 = fragmentManager.beginTransaction();
        FragmentTransaction t2 = t1.replace(R.id.content_frame, back);
        t2.commit();

    }

    private void setRole(String role) {
        FirebaseDatabase.getInstance().getReference("users/"+uid+"/roles/"+role).setValue("true");
    }

    private void unsetRole(String role) {
        FirebaseDatabase.getInstance().getReference("users/"+uid+"/roles/"+role).removeValue();
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
                ((TextView)myView.findViewById(Rid)).setText(text);
            }
        });
    }

}
