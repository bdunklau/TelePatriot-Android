package com.brentdunklau.telepatriot_android;

import android.Manifest;
import android.app.Activity;
import android.app.Fragment;
import android.app.FragmentManager;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.annotation.RequiresApi;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.telecom.TelecomManager;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.citizenbuilder.CBMissionDetail;
import com.brentdunklau.telepatriot_android.citizenbuilder.CBTeam;
import com.brentdunklau.telepatriot_android.util.AppLog;
import com.brentdunklau.telepatriot_android.util.Configuration;
import com.brentdunklau.telepatriot_android.util.Mission;
import com.brentdunklau.telepatriot_android.util.MissionDetail;
import com.brentdunklau.telepatriot_android.util.MissionItemEvent;
import com.brentdunklau.telepatriot_android.util.TeamAdapter;
import com.brentdunklau.telepatriot_android.util.User;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Created by bdunklau on 10/26/17.
 */

public class MyMissionFragment extends BaseFragment {

    private String TAG = "MyMissionFragment";
    private MissionDetail missionDetail;
    private TextView mission_name, mission_event_date, mission_event_type, mission_type, name, uid, mission_description, mission_script;
    private TextView heading_mission_progress;
    private Button button_call_person1, button_call_person2, button_switch_teams;
    private String missionId, missionItemId;
    private String readPhoneState;


    View myView;

    @Nullable
    @Override
    /**
     * ALL mission items are under the /mission_items node.  So now, all we have to do for the volunteers is do a
     * limitToFirst(1) query for the mission that has the following criteria:
     * active_and_accomplished: true_new
     *
     *
     */
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.my_mission_fragment, container, false);

//        mission_name = myView.findViewById(R.id.heading_mission_name);
//        heading_mission_progress = myView.findViewById(R.id.heading_mission_progress);
//        mission_description = myView.findViewById(R.id.mission_description);
//        mission_script = myView.findViewById(R.id.mission_script);
//        button_call_person1 = myView.findViewById(R.id.button_call_person1);
//        button_call_person2 = myView.findViewById(R.id.button_call_person2);
//
//        button_switch_teams = myView.findViewById(R.id.button_switch_teams);
//        button_switch_teams.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//                Fragment fragment = new SwitchTeamsFragment();
//                FragmentManager fragmentManager = getFragmentManager();
//                fragmentManager.beginTransaction().replace(R.id.content_frame, fragment).addToBackStack(fragment.getClass().getName()).commit();
//            }
//        });
//
//
//
//        // BUG FIX:  If you choose My Mission, then swipe to get the menu, then touch My Mission again, you will "orphan"
//        // the mission you were currently working.  That orphan mission will be stuck in an in-progress state with a group_number
//        // of 999999 meaning no one else will be assigned that mission either.
//        //
//        // To fix, just check and see if the user already has a current mission item and use it if they do
//        MissionDetail missionItem = User.getInstance().getCurrentMissionItem();
//        if (missionItem != null) {
//            workThis(missionItem);
//        } else {
//
//
//            // just start out this way by default so we don't get the ugly screen flash
//            // that shows the user buttons and labels that don't make sense
//            indicateNoMissionsAvailable();
//
//
//            getMission_fromTelePatriot();
//
//
//        } // else  that belongs to if(missionItem != null) {
//
//
//        //setHasOptionsMenu(true);
        return myView;
    }

//    private void getMission_fromTelePatriot() {
//        final String team = User.getInstance().getCurrentTeamName();    // nodes here should ALWAYS be "true_new" - this is a change to how we used to do things 12/8/17.  If it's in this node, it is ready to be worked.
//
//        FirebaseDatabase.getInstance().getReference("teams/" + team + "/mission_items").orderByChild("group_number").limitToFirst(1).addListenerForSingleValueEvent(new ValueEventListener() {
//            @Override
//            public void onDataChange(DataSnapshot dataSnapshot) {
//                if (dataSnapshot.getChildrenCount() == 0) {
//                    indicateNoMissionsAvailable();
//                    return; // we should indicate no missions available for the user
//                }
//
//                try {
//                    for (DataSnapshot child : dataSnapshot.getChildren()) {
//                        missionItemId = child.getKey();
//
//                        missionDetail = child.getValue(MissionDetail.class);
//
//                        AppLog.debug(User.getInstance(), TAG, "onCreateView", "Mission: " + missionDetail.getMission_name() + ", Name: " + missionDetail.getName() + ", Phone: " + missionDetail.getPhone());
//
//                        // if all we got was a 999999, then this item is being worked by someone else and
//                        // there basically are no more missions for this user
//                        if (missionDetail == null || missionDetail.getGroup_number() == 999999) {
//                            indicateNoMissionsAvailable();
//                            return; // we should indicate no missions available for the user
//                        }
//
//                        // Get progress info from mission object (have to query for that unfortunately)
//                        // TODO This is an expensive query too.  It returns all mission items for this mission because
//                        // we keep mission_items under each mission
//                        FirebaseDatabase.getInstance().getReference("teams/" + team + "/missions/").orderByKey().equalTo(missionDetail.getMission_id()).limitToFirst(1).addValueEventListener(new ValueEventListener() {
//                            @Override
//                            public void onDataChange(DataSnapshot dataSnapshot) {
//                                try {
//                                    for (DataSnapshot child : dataSnapshot.getChildren()) {
//
//                                        Mission mission = child.getValue(Mission.class);
//                                        Integer total_rows_completed = mission.getTotal_rows_completed();
//                                        Integer total_rows_with_phone = mission.getTotal_rows_in_spreadsheet_with_phone();
//                                        if (total_rows_completed != null && total_rows_with_phone != null) {
//                                            int calls_remaining = total_rows_with_phone - total_rows_completed;
//                                            Integer percent_complete = mission.getPercent_complete();
//                                            //  have to double up the % sign to escape it ----v
//                                            heading_mission_progress.setText(String.format("%d%% Complete (%d calls remaining)", percent_complete, calls_remaining));
//                                        }
//                                    }
//                                }
//                                catch(Throwable t) {
//                                    AppLog.error(User.getInstance(), TAG, "getMission_fromTelePatriot().onDataChange().onDataChange()", "Throwable: " + t.getMessage());
//                                }
//
//                            }
//
//                            @Override
//                            public void onCancelled(DatabaseError databaseError) {
//                            }
//                        });
//
//                        // set fields back to visible if they were previously set to View.GONE
//                        setFieldsVisible();
//
//                        User.getInstance().setCurrentMissionItem(missionItemId, missionDetail);
//
//                        String missionName = missionDetail.getMission_name();
//                        String missionDescription = missionDetail.getDescription();
//                        String missionScript = missionDetail.getScript();
//
//                        mission_name.setText(missionName);
//                        mission_description.setText(missionDescription);
//                        mission_script.setText(missionScript);
//                        button_call_person1.setVisibility(View.VISIBLE);
//                        button_call_person1.setText(missionDetail.getName() + " " + missionDetail.getPhone());
//                        wireUp(button_call_person1, missionDetail);
//
//                        prepareFor3WayCallIfNecessary(missionDetail, button_call_person2);
//
//                        missionDetail.setAccomplished("in progress");
//                        missionDetail.setActive_and_accomplished("true_in progress");
//
//                        // kinda sneaky, kinda hacky - change the group_number to something really high so that it won't come up first in anyone's queue
//                        // and save the original value in group_number_was
//                        missionDetail.setGroup_number_was(missionDetail.getGroup_number());
//                        missionDetail.setGroup_number(999999);
//
//                        dataSnapshot.getRef().child(missionItemId).setValue(missionDetail);
//                    }
//                }
//                catch(Throwable t) {
//                    AppLog.error(User.getInstance(), TAG, "getMission_fromTelePatriot().onDataChange()", "Throwable: " + t.getMessage());
//                }
//
//            }
//
//            @Override
//            public void onCancelled(DatabaseError databaseError) {
//
//            }
//        });
//    }
//
//    private void setFieldsVisible() {
//        button_call_person1.setVisibility(View.VISIBLE);
//        button_call_person2.setVisibility(View.VISIBLE);
//        mission_name.setVisibility(View.VISIBLE);
//        mission_script.setVisibility(View.VISIBLE);
//        myView.findViewById(R.id.heading_mission_description).setVisibility(View.VISIBLE);
//        myView.findViewById(R.id.heading_mission_script).setVisibility(View.VISIBLE);
//    }
//
//    private void indicateNoMissionsAvailable() {
//        // hide the call buttons
//        button_call_person1.setVisibility(View.GONE);
//        button_call_person2.setVisibility(View.GONE);
//        // hide the description and the script fields
//        mission_name.setVisibility(View.GONE);
//        mission_script.setVisibility(View.GONE);
//        myView.findViewById(R.id.heading_mission_description).setVisibility(View.GONE);
//        myView.findViewById(R.id.heading_mission_script).setVisibility(View.GONE);
//
//        // leave the switch teams button visible
//
//        // rather than hide the mission description TextView, we'll repurpose
//        // it to show a message to the user indicating that there are no missions
//        // in this team at this time.
//        // This is the same text you'll see on the iPhone version - MyMissionViewController
//        mission_description.setText("No missions found yet for this team...");
//    }
//
//    @Override
//    public void onRequestPermissionsResult(int requestCode,
//                                           String permissions[], int[] grantResults) {
//
//        try {
//            // only checking for CALL_PHONE permission
//            if (permissions.length == 0
//                    || !permissions[0].equalsIgnoreCase(android.Manifest.permission.CALL_PHONE)
//                    || grantResults.length == 0
//                    || grantResults[0] != PackageManager.PERMISSION_GRANTED
//                    || User.getInstance().getCurrentMissionItem() == null) {
//                AppLog.debug(User.getInstance(), TAG, "onRequestPermissionsResult", "permission denied to make phone calls");
//                return;
//            }
//
//            AppLog.debug(User.getInstance(), TAG, "onRequestPermissionsResult", "permission granted to make phone calls");
//            call(User.getInstance().getCurrentMissionItem());
//        }
//        catch(Throwable t) {
//            AppLog.error(User.getInstance(), TAG, "onRequestPermissionsResult", "Throwable: " + t.getMessage());
//        }
//    }
//
//    private void wireUp(Button button, final MissionDetail missionDetail) {
//        button.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//                call(missionDetail);
//            }
//        });
//    }
//
//    private void prepareFor3WayCallIfNecessary(MissionDetail missionDetail, Button button) {
//        if (missionDetail.getName2() != null && missionDetail.getPhone2() != null) {
//            // we have a 3way call scenario
//            button.setText(missionDetail.getName2() + " " + missionDetail.getPhone2());
//            wireUp2(button, missionDetail);
//        } else {
//            // not a 3way call scenario, so hide the second phone button
//            button.setVisibility(View.GONE);
//        }
//    }
//
//    private void call(MissionDetail missionDetail) {
//        call(missionDetail.getMission_name(), missionDetail.getName(), missionDetail.getPhone());
//    }
//
//    // call the name2/phone2 person
//    private void call2(MissionDetail missionDetail) {
//        call(missionDetail.getMission_name(), missionDetail.getName2(), missionDetail.getPhone2());
//    }
//
//    private void call(String mission_name, String name, String phone) {
//        if(permittedToCall()) {
//            placeCall(mission_name, name, phone);
//        }
//        else {
//            requestPermissionToCall();
//        }
//    }
//
//    private void placeCall(String mission_name, String name, String phone) {
//        try {
//            Uri uri = Uri.fromParts("tel", phone, null);
//            Bundle extras = new Bundle();
//            TelecomManager telephony = (TelecomManager)myView.getContext().getSystemService(Context.TELECOM_SERVICE);
//            try {
//                telephony.placeCall(uri, extras);
//            }
//            catch(SecurityException se) {
//                AppLog.error(User.getInstance(), TAG, "placeCall", se.getMessage());
//                return;
//            }
//
//            String team = User.getInstance().getCurrentTeamName();
//            DatabaseReference ref = FirebaseDatabase.getInstance().getReference("teams/" + team + "/activity");
//            String eventType = "is calling";
//            MissionItemEvent m = new MissionItemEvent(eventType, User.getInstance().getUid(), User.getInstance().getName(), mission_name, phone, /*volunteerPhone, */name);
//            ref.child("all").push().setValue(m);
//            AppLog.debug(User.getInstance(), TAG, "placeCall", "Mission: "+mission_name+", Name: "+name+", Phone: "+phone+" - started call");
//        } catch(Throwable t) {
//            System.out.println(t.getMessage());
//            AppLog.error(User.getInstance(), TAG, "placeCall", t.getMessage());
//        }
//    }
//
//    private void wireUp2(Button button, final MissionDetail missionDetail) {
//        button.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//                call2(missionDetail);
//            }
//        });
//    }
//
//    private void workThis(MissionDetail missionItem) {
//
//        // set fields back to visible if they were previously set to View.GONE
//        setFieldsVisible();
//
//        String missionName = missionItem.getMission_name();
//        String missionDescription = missionItem.getDescription();
//        String missionScript = missionItem.getScript();
//
//        mission_name.setText(missionName);
//        mission_description.setText(missionDescription);
//        mission_script.setText(missionScript);
//        button_call_person1.setVisibility(View.VISIBLE);
//        button_call_person1.setText(missionItem.getName() + " " + missionItem.getPhone());
//        wireUp(button_call_person1, missionItem);
//
//        prepareFor3WayCallIfNecessary(missionItem, button_call_person2);
//    }
//
//    // called when we come back from a call
//    @Override
//    public void onResume() {
//        doSuper = false; // see BaseFragment
//        super.onResume();
//        Log.d(TAG, "onResume: missionDetail.getActive_and_accomplished() = " + (missionDetail == null ? "null" : missionDetail.getActive_and_accomplished()));
//        // what do we do here?
//        // when does this get called?  When the user returns from a call
//        //      but also when the user returns here from anywhere
//        // but we DO now have the current mission item stored in the User object
//        // If we are resuming on a mission that is  active_and_accomplished: true_complete,
//        // then we need to send the user on to a fragment where they can enter notes on the
//        // call
//        if (missionDetail == null)
//            return;
//        if (!missionDetail._isAccomplished())
//            return;
//
//        FragmentManager fragmentManager = getFragmentManager();
//        Fragment fragment = new MissionItemWrapUpFragment();
//        fragmentManager.beginTransaction().replace(R.id.content_frame, fragment).addToBackStack(fragment.getClass().getName()).commit();
//
//    }
//
//    @Override
//    public void onPause() {
//        doSuper = false; // see BaseFragment
//        super.onPause();
//        Log.d(TAG, "onPause");
//    }
//
//    @Override
//    public void onStop() {
//        doSuper = false; // see BaseFragment
//        super.onStop();
//        Log.d(TAG, "onStop");
//    }
//
//    @Override
//    public void onDestroyView() {
//        doSuper = false; // see BaseFragment
//        super.onDestroyView();
//        Log.d(TAG, "onDestroyView");
//    }
//
//    @Override
//    public void onDestroy() {
//        doSuper = false; // see BaseFragment
//        super.onDestroy();
//        Log.d(TAG, "onDestroy");
//    }


}
