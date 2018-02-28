package com.brentdunklau.telepatriot_android;

import android.app.Activity;
import android.app.Fragment;
import android.app.FragmentManager;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.os.Handler;
import android.support.annotation.Nullable;
import android.support.v4.app.ShareCompat;
import android.support.v4.content.res.ResourcesCompat;
import android.support.v7.widget.SwitchCompat;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.DbLog;
import com.brentdunklau.telepatriot_android.util.PassInfo;
import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.UserBean;
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

    private SwitchCompat enabledDisabledSwitch;
    private SwitchCompat adminSwitch;
    private SwitchCompat directorSwitch;
    private SwitchCompat volunteerSwitch;
    private Button okButton;
    private String uid;
    boolean isEnabled = true;
    boolean isAdmin, isDirector, isVolunteer;
    Boolean has_signed_petition, has_signed_confidentiality_agreement, is_banned;
    //View myView;
    private FragmentManager fragmentManager;
    private Fragment back;
    private UserBean usr;

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

        enabledDisabledSwitch = myView.findViewById(R.id.switch_enabled_disabled);
        adminSwitch = myView.findViewById(R.id.switch_admin);
        directorSwitch = myView.findViewById(R.id.switch_director);
        volunteerSwitch = myView.findViewById(R.id.switch_volunteer);

        adminSwitch.setSwitchPadding(100);


        enabledDisabledSwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean b) {
                enabledDisabledChanged(b);
            }
        });


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

        database.getReference("users").child(uid).addValueEventListener(new ValueEventListener() {
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
                    ub.setUid(uid);
                    updateLabel(R.id.text_name, ub.getName());
                    boolean underline = true;
                    updateLabel(R.id.text_email, ub.getEmail(), underline);
                    final UserBean ub2 = ub;
                    final String senderName = User.getInstance().getName();
                    TextView et = myView.findViewById(R.id.text_email);
                    et.setOnClickListener(new View.OnClickListener() {
                        @Override
                        public void onClick(View v) {
                            emailSetup(ub2, senderName);
                        }
                    });
                    isEnabled = ub.isEnabled();
                    isAdmin = ub.isRole("Admin");
                    isDirector = ub.isRole("Director");
                    isVolunteer = ub.isRole("Volunteer");
                    setSwitch(isEnabled, enabledDisabledSwitch);
                    setSwitch(isAdmin, adminSwitch);
                    setSwitch(isDirector, directorSwitch);
                    setSwitch(isVolunteer, volunteerSwitch);
                    has_signed_petition = ub.getHas_signed_petition();
                    has_signed_confidentiality_agreement = ub.getHas_signed_confidentiality_agreement();
                    is_banned = ub.getIs_banned();
                    setPetitionStatus(has_signed_petition);
                    setConfidentialityAgreementStatus(has_signed_confidentiality_agreement);
                    setBannedStatus(is_banned);

                    wireUpSegmentedControlButtons(ub);
                    usr = ub;
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

        setHasOptionsMenu(true);
    }


    /************************
     NOTE that disabling someone's account does not automatically remove them from the
     teams they're on.  That would make sense.  But the app just isn't programmed that way
     right now.  At one time, we cleared the user's list of teams whenever the enable/disable
     switch was moved to "disabled".  But that occurred before the user was saved.
     And I wanted to make sure we didn't lose team membership info prior to actually saving
     the user.  Otherwise, the admin could toggle to disabled, then back to enabled, never actually
     changing the state of the user but losing all the team info in the process.
     ************************/
    private void enabledDisabledChanged(boolean enabled) {

        if(enabled) {
            volunteerSwitch.setEnabled(true);
            directorSwitch.setEnabled(true);
            adminSwitch.setEnabled(true);
        }
        else {
            volunteerSwitch.setChecked(false);
            directorSwitch.setChecked(false);
            adminSwitch.setChecked(false);

            volunteerSwitch.setEnabled(false);
            directorSwitch.setEnabled(false);
            adminSwitch.setEnabled(false);
        }

        enabledDisabledSwitch.setText(enabled ? "Enabled" : "Disabled");
        usr.setEnabled(enabled);
    }

    /***
     * The email content needs to come from the database so that we don't have to put
     * this stuff on iOS also.
     * @param ub
     * @param senderName
     */
    private void emailSetup(UserBean ub, String senderName) {
        String greeting = "%s,<P/>";
        StringBuffer msg = new StringBuffer(greeting);
        StringBuffer body = new StringBuffer();
        if(Boolean.FALSE == ub.getHas_signed_petition()) {
            body.append("Please sign the Convention of States petition");
            body.append("<P/>https://www.conventionofstates.com");
        }
        if(Boolean.FALSE == ub.getHas_signed_confidentiality_agreement()) {
            body.append("<P/>Please sign the Confidentiality Agreement");
            body.append("<P/>https://esign.coslms.com:8443/S/COS/Transaction/Volunteer_Agreement_Manual");
        }

        String signature = "<P/>%s<br/>TelePatriot Admin<br/>Convention of States";
        //msg.append(body); // put this back in when you figure out how to construct the body from database queries
        msg.append(signature);
        String m = String.format(msg.toString(), ub.getName(), senderName);

        Activity activity = (Activity) myView.getContext();

        ShareCompat.IntentBuilder.from(activity)
                .setType("message/rfc822")
                .addEmailTo(ub.getEmail())
                .setSubject("Re: Your TelePatriot account")
                //.setText(m)
                .setHtmlText(m) //If you are using HTML in your body text
                .setChooserTitle("Send Email")
                .startChooser();
    }

    private void setPetitionStatus(Boolean b) {
        setSegmentedControl(b,
                R.id.button_petition_yes,
                R.id.button_petition_no,
                R.id.button_petition_unknown);
    }

    private void setConfidentialityAgreementStatus(Boolean b) {
        setSegmentedControl(b,
                R.id.button_confidentiality_agreement_yes,
                R.id.button_confidentiality_agreement_no,
                R.id.button_confidentiality_agreement_unknown);
    }

    private void setBannedStatus(Boolean b) {
        setSegmentedControl(b, R.id.button_banned_yes, R.id.button_banned_no, R.id.button_banned_unknown);
    }

    private void setSegmentedControl(Boolean triState, int id_yes, int id_no, int id_unknown) {
        Button yes = myView.findViewById(id_yes);
        Button no = myView.findViewById(id_no);
        Button unknown = myView.findViewById(id_unknown);
        if(triState == null) {
            sss(unknown, yes, no);
        }
        else if(Boolean.TRUE == triState.booleanValue()) {
            sss(yes, unknown, no);
        }
        else {
            sss(no, yes, unknown);
        }

    }

    private void sss(Button buttonSelected, Button... buttonsNotSelected) {
        Drawable selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_selected, null);
        Drawable not_selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_not_selected, null);

        buttonSelected.setBackground(selected);
        buttonSelected.setTextColor(0xFFFFFFFF);
        for(Button buttonNotSelected : buttonsNotSelected) {
            buttonNotSelected.setBackground(not_selected);
            buttonNotSelected.setTextColor(0xFF007AFF);
        }
    }

    private HashMap<String, String> reviewingEvent() {
        HashMap<String, String> evt = new HashMap<String, String>();
        String dt = new SimpleDateFormat("MMM d, yyyy h:mm a z").format(new Date());
        evt.put("date", dt);
        evt.put("event", "Admin ("+ User.getInstance().getName()+") is reviewing your account...");
        return evt;
    }

    public void clickOk(View view) {
        usr.setVolunteer(isVolunteer);
        usr.setDirector(isDirector);
        usr.setAdmin(isAdmin);
        usr.setHas_signed_petition(has_signed_petition);
        usr.setHas_signed_confidentiality_agreement(has_signed_confidentiality_agreement);
        usr.setIs_banned(is_banned);

        usr.update();

        String returnToTab = "Admin";
        if(isVolunteer) {
            returnToTab = "Volunteer";
            //setRole("Volunteer");
        } else {
            //unsetRole("Volunteer");
        }

        if(isDirector) {
            returnToTab = "Director";
            //setRole("Director");
        } else {
            //unsetRole("Director");
        }

        if(isAdmin) {
            returnToTab = "Admin";
            //setRole("Admin");
        } else {
            //unsetRole("Admin");
        }

        /****************
        setValue(uid, "has_signed_petition", has_signed_petition);
        setValue(uid, "has_signed_confidentiality_agreement", has_signed_confidentiality_agreement);
        setValue(uid, "is_banned", is_banned);
         ***********/


        // as long is something is set, remove the record from the no_roles node
        if(isAdmin || isDirector || isVolunteer)
            FirebaseDatabase.getInstance().getReference("no_roles/"+uid).removeValue();

        if(back instanceof PassInfo) {
            Map m = new HashMap();
            m.put("role", returnToTab);
            ((PassInfo) back).pass(m);
        }

        /********
        FragmentTransaction t1 = fragmentManager.beginTransaction();
        FragmentTransaction t2 = t1.replace(R.id.content_frame, back);
        t2.commit();
         ********/


        fragmentManager.beginTransaction()
                .replace(R.id.content_frame, back)
                .addToBackStack(back.getClass().getName())
                .commit();
    }

    private void setValue(String uid, String attribute, Boolean value) {
        FirebaseDatabase.getInstance().getReference("users/"+uid+"/"+attribute).setValue(value);
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

    private void wireUpSegmentedControlButtons(final UserBean ub) {
        final Button petition_yes = myView.findViewById(R.id.button_petition_yes);
        final Button petition_no = myView.findViewById(R.id.button_petition_no);
        final Button petition_unknown = myView.findViewById(R.id.button_petition_unknown);

        final Button confidentiality_agreement_yes = myView.findViewById(R.id.button_confidentiality_agreement_yes);
        final Button confidentiality_agreement_no = myView.findViewById(R.id.button_confidentiality_agreement_no);
        final Button confidentiality_agreement_unknown = myView.findViewById(R.id.button_confidentiality_agreement_unknown);

        final Button banned_yes = myView.findViewById(R.id.button_banned_yes);
        final Button banned_no = myView.findViewById(R.id.button_banned_no);
        final Button banned_unknown = myView.findViewById(R.id.button_banned_unknown);


        petition_yes.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // says: if the value is changing to true...
                if(Boolean.TRUE != ub.getHas_signed_petition()) {
                    Drawable selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_selected, null);
                    Drawable not_selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_not_selected, null);
                    petition_yes.setBackground(selected);
                    petition_yes.setTextColor(0xFFFFFFFF);
                    //ub.setHas_signed_petition(true);
                    has_signed_petition = true;

                    petition_no.setBackground(not_selected);
                    petition_no.setTextColor(0xFF007AFF);

                    petition_unknown.setBackground(not_selected);
                    petition_unknown.setTextColor(0xFF007AFF);
                }
            }
        });


        petition_no.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // says: if the value is changing to true...
                if(Boolean.FALSE != ub.getHas_signed_petition()) {
                    Drawable selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_selected, null);
                    Drawable not_selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_not_selected, null);
                    petition_no.setBackground(selected);
                    petition_no.setTextColor(0xFFFFFFFF);
                    //ub.setHas_signed_petition(false);
                    has_signed_petition = false;

                    petition_yes.setBackground(not_selected);
                    petition_yes.setTextColor(0xFF007AFF);

                    petition_unknown.setBackground(not_selected);
                    petition_unknown.setTextColor(0xFF007AFF);
                }
            }
        });


        petition_unknown.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // says: if the value is changing to true...
                if(ub.getHas_signed_petition() != null) {
                    Drawable selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_selected, null);
                    Drawable not_selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_not_selected, null);
                    petition_unknown.setBackground(selected);
                    petition_unknown.setTextColor(0xFFFFFFFF);
                    //ub.setHas_signed_petition(null);
                    has_signed_petition = null;

                    petition_yes.setBackground(not_selected);
                    petition_yes.setTextColor(0xFF007AFF);

                    petition_no.setBackground(not_selected);
                    petition_no.setTextColor(0xFF007AFF);
                }
            }
        });


        confidentiality_agreement_yes.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // says: if the value is changing to true...
                if(Boolean.TRUE != ub.getHas_signed_confidentiality_agreement()) {
                    Drawable selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_selected, null);
                    Drawable not_selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_not_selected, null);
                    confidentiality_agreement_yes.setBackground(selected);
                    confidentiality_agreement_yes.setTextColor(0xFFFFFFFF);
                    //ub.setHas_signed_confidentiality_agreement(true);
                    has_signed_confidentiality_agreement = true;

                    confidentiality_agreement_no.setBackground(not_selected);
                    confidentiality_agreement_no.setTextColor(0xFF007AFF);

                    confidentiality_agreement_unknown.setBackground(not_selected);
                    confidentiality_agreement_unknown.setTextColor(0xFF007AFF);
                }
            }
        });


        confidentiality_agreement_no.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // says: if the value is changing to true...
                if(Boolean.FALSE != ub.getHas_signed_confidentiality_agreement()) {
                    Drawable selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_selected, null);
                    Drawable not_selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_not_selected, null);
                    confidentiality_agreement_no.setBackground(selected);
                    confidentiality_agreement_no.setTextColor(0xFFFFFFFF);
                    //ub.setHas_signed_confidentiality_agreement(false);
                    has_signed_confidentiality_agreement = false;

                    confidentiality_agreement_yes.setBackground(not_selected);
                    confidentiality_agreement_yes.setTextColor(0xFF007AFF);

                    confidentiality_agreement_unknown.setBackground(not_selected);
                    confidentiality_agreement_unknown.setTextColor(0xFF007AFF);
                }
            }
        });


        confidentiality_agreement_unknown.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // says: if the value is changing to true...
                if(ub.getHas_signed_confidentiality_agreement() != null) {
                    Drawable selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_selected, null);
                    Drawable not_selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_not_selected, null);
                    confidentiality_agreement_unknown.setBackground(selected);
                    confidentiality_agreement_unknown.setTextColor(0xFFFFFFFF);
                    //ub.setHas_signed_confidentiality_agreement(null);
                    has_signed_confidentiality_agreement = null;

                    confidentiality_agreement_yes.setBackground(not_selected);
                    confidentiality_agreement_yes.setTextColor(0xFF007AFF);

                    confidentiality_agreement_no.setBackground(not_selected);
                    confidentiality_agreement_no.setTextColor(0xFF007AFF);
                }
            }
        });


        banned_yes.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // says: if the value is changing to true...
                if(Boolean.TRUE != ub.getIs_banned()) {
                    Drawable selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_selected, null);
                    Drawable not_selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_not_selected, null);
                    banned_yes.setBackground(selected);
                    banned_yes.setTextColor(0xFFFFFFFF);
                    //ub.setIs_banned(true);
                    is_banned = true;

                    banned_no.setBackground(not_selected);
                    banned_no.setTextColor(0xFF007AFF);

                    banned_unknown.setBackground(not_selected);
                    banned_unknown.setTextColor(0xFF007AFF);
                }
            }
        });


        banned_no.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // says: if the value is changing to true...
                if(Boolean.FALSE != ub.getIs_banned()) {
                    Drawable selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_selected, null);
                    Drawable not_selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_not_selected, null);
                    banned_no.setBackground(selected);
                    banned_no.setTextColor(0xFFFFFFFF);
                    //ub.setIs_banned(false);
                    is_banned = false;

                    banned_yes.setBackground(not_selected);
                    banned_yes.setTextColor(0xFF007AFF);

                    banned_unknown.setBackground(not_selected);
                    banned_unknown.setTextColor(0xFF007AFF);
                }
            }
        });


        banned_unknown.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                // says: if the value is changing to true...
                if(ub.getIs_banned() != null) {
                    Drawable selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_selected, null);
                    Drawable not_selected = ResourcesCompat.getDrawable(getResources(), R.drawable.segmented_control_not_selected, null);
                    banned_unknown.setBackground(selected);
                    banned_unknown.setTextColor(0xFFFFFFFF);
                    //ub.setIs_banned(null);
                    is_banned = null;

                    banned_yes.setBackground(not_selected);
                    banned_yes.setTextColor(0xFF007AFF);

                    banned_no.setBackground(not_selected);
                    banned_no.setTextColor(0xFF007AFF);
                }
            }
        });
    }

}
