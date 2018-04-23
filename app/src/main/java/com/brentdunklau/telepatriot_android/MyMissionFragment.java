package com.brentdunklau.telepatriot_android;

import android.Manifest;
import android.app.Activity;
import android.app.Fragment;
import android.app.FragmentManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.Mission;
import com.brentdunklau.telepatriot_android.util.MissionDetail;
import com.brentdunklau.telepatriot_android.util.MissionItemEvent;
import com.brentdunklau.telepatriot_android.util.User;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

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

        mission_name = myView.findViewById(R.id.heading_mission_name);
        heading_mission_progress = myView.findViewById(R.id.heading_mission_progress);
        mission_description = myView.findViewById(R.id.mission_description);
        mission_script = myView.findViewById(R.id.mission_script);
        button_call_person1 = myView.findViewById(R.id.button_call_person1);
        button_call_person2 = myView.findViewById(R.id.button_call_person2);

        button_switch_teams = myView.findViewById(R.id.button_switch_teams);
        button_switch_teams.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Fragment fragment = new SwitchTeamsFragment();
                FragmentManager fragmentManager = getFragmentManager();
                fragmentManager.beginTransaction().replace(R.id.content_frame, fragment).addToBackStack(fragment.getClass().getName()).commit();
            }
        });


        // BUG FIX:  If you choose My Mission, then swipe to get the menu, then touch My Mission again, you will "orphan"
        // the mission you were currently working.  That orphan mission will be stuck in an in-progress state with a group_number
        // of 999999 meaning no one else will be assigned that mission either.
        //
        // To fix, just check and see if the user already has a current mission item and use it if they do
        MissionDetail missionItem = User.getInstance().getCurrentMissionItem();
        if (missionItem != null) {
            workThis(missionItem);
        } else {


            // just start out this way by default so we don't get the ugly screen flash
            // that shows the user buttons and labels that don't make sense
            indicateNoMissionsAvailable();


            final String team = User.getInstance().getCurrentTeamName();    // nodes here should ALWAYS be "true_new" - this is a change to how we used to do things 12/8/17.  If it's in this node, it is ready to be worked.

            FirebaseDatabase.getInstance().getReference("teams/" + team + "/mission_items").orderByChild("group_number").limitToFirst(1).addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot dataSnapshot) {
                    if (dataSnapshot.getChildrenCount() == 0) {
                        indicateNoMissionsAvailable();
                        return; // we should indicate no missions available for the user
                    }

                    for (DataSnapshot child : dataSnapshot.getChildren()) {
                        missionItemId = child.getKey();

                        missionDetail = child.getValue(MissionDetail.class);

                        // if all we got was a 999999, then this item is being worked by someone else and
                        // there basically are no more missions for this user
                        if (missionDetail == null || missionDetail.getGroup_number() == 999999) {
                            indicateNoMissionsAvailable();
                            return; // we should indicate no missions available for the user
                        }

                        // Get progress info from mission object (have to query for that unfortunately)
                        // TODO This is an expensive query too.  It returns all mission items for this mission because
                        // we keep mission_items under each mission
                        FirebaseDatabase.getInstance().getReference("teams/" + team + "/missions/").orderByKey().equalTo(missionDetail.getMission_id()).limitToFirst(1).addValueEventListener(new ValueEventListener() {
                            @Override
                            public void onDataChange(DataSnapshot dataSnapshot) {

                                for (DataSnapshot child : dataSnapshot.getChildren()) {

                                    Mission mission = child.getValue(Mission.class);
                                    Integer total_rows_completed = mission.getTotal_rows_completed();
                                    Integer total_rows_with_phone = mission.getTotal_rows_in_spreadsheet_with_phone();
                                    if (total_rows_completed != null && total_rows_with_phone != null) {
                                        int calls_remaining = total_rows_with_phone - total_rows_completed;
                                        Integer percent_complete = mission.getPercent_complete();
                                        //  have to double up the % sign to escape it ----v
                                        heading_mission_progress.setText(String.format("%d%% Complete (%d calls remaining)", percent_complete, calls_remaining));
                                    }
                                }

                            }

                            @Override
                            public void onCancelled(DatabaseError databaseError) {
                            }
                        });

                        // set fields back to visible if they were previously set to View.GONE
                        setFieldsVisible();

                        User.getInstance().setCurrentMissionItem(missionItemId, missionDetail);

                        String missionName = missionDetail.getMission_name();
                        String missionDescription = missionDetail.getDescription();
                        String missionScript = missionDetail.getScript();

                        mission_name.setText(missionName);
                        mission_description.setText(missionDescription);
                        mission_script.setText(missionScript);
                        button_call_person1.setVisibility(View.VISIBLE);
                        button_call_person1.setText(missionDetail.getName() + " " + missionDetail.getPhone());
                        wireUp(button_call_person1, missionDetail);

                        prepareFor3WayCallIfNecessary(missionDetail, button_call_person2);

                        missionDetail.setAccomplished("in progress");
                        missionDetail.setActive_and_accomplished("true_in progress");

                        // kinda sneaky, kinda hacky - change the group_number to something really high so that it won't come up first in anyone's queue
                        // and save the original value in group_number_was
                        missionDetail.setGroup_number_was(missionDetail.getGroup_number());
                        missionDetail.setGroup_number(999999);

                        dataSnapshot.getRef().child(missionItemId).setValue(missionDetail);
                    }

                }

                @Override
                public void onCancelled(DatabaseError databaseError) {

                }
            });


        } // else  that belongs to if(missionItem != null) {


        setHasOptionsMenu(true);
        return myView;
    }

    private void workThis(MissionDetail missionItem) {

        // set fields back to visible if they were previously set to View.GONE
        setFieldsVisible();

        String missionName = missionItem.getMission_name();
        String missionDescription = missionItem.getDescription();
        String missionScript = missionItem.getScript();

        mission_name.setText(missionName);
        mission_description.setText(missionDescription);
        mission_script.setText(missionScript);
        button_call_person1.setVisibility(View.VISIBLE);
        button_call_person1.setText(missionItem.getName() + " " + missionItem.getPhone());
        wireUp(button_call_person1, missionItem);

        prepareFor3WayCallIfNecessary(missionItem, button_call_person2);
    }

    private void indicateNoMissionsAvailable() {
        // hide the call buttons
        button_call_person1.setVisibility(View.GONE);
        button_call_person2.setVisibility(View.GONE);
        // hide the description and the script fields
        mission_name.setVisibility(View.GONE);
        mission_script.setVisibility(View.GONE);
        myView.findViewById(R.id.heading_mission_description).setVisibility(View.GONE);
        myView.findViewById(R.id.heading_mission_script).setVisibility(View.GONE);

        // leave the switch teams button visible

        // rather than hide the mission description TextView, we'll repurpose
        // it to show a message to the user indicating that there are no missions
        // in this team at this time.
        // This is the same text you'll see on the iPhone version - MyMissionViewController
        mission_description.setText("No missions found yet for this team...");
    }

    private void setFieldsVisible() {
        button_call_person1.setVisibility(View.VISIBLE);
        button_call_person2.setVisibility(View.VISIBLE);
        mission_name.setVisibility(View.VISIBLE);
        mission_script.setVisibility(View.VISIBLE);
        myView.findViewById(R.id.heading_mission_description).setVisibility(View.VISIBLE);
        myView.findViewById(R.id.heading_mission_script).setVisibility(View.VISIBLE);
    }

    private void prepareFor3WayCallIfNecessary(MissionDetail missionDetail, Button button) {
        if (missionDetail.getName2() != null && missionDetail.getPhone2() != null) {
            // we have a 3way call scenario
            button.setText(missionDetail.getName2() + " " + missionDetail.getPhone2());
            wireUp2(button, missionDetail);
        } else {
            // not a 3way call scenario, so hide the second phone button
            button.setVisibility(View.GONE);
        }
    }

    // called when we come back from a call
    @Override
    public void onResume() {
        doSuper = false; // see BaseFragment
        super.onResume();
        Log.d(TAG, "onResume: missionDetail.getActive_and_accomplished() = " + (missionDetail == null ? "null" : missionDetail.getActive_and_accomplished()));
        // what do we do here?
        // when does this get called?  When the user returns from a call
        //      but also when the user returns here from anywhere
        // but we DO now have the current mission item stored in the User object
        // If we are resuming on a mission that is  active_and_accomplished: true_complete,
        // then we need to send the user on to a fragment where they can enter notes on the
        // call
        if (missionDetail == null)
            return;
        if (!missionDetail._isAccomplished())
            return;

        FragmentManager fragmentManager = getFragmentManager();
        Fragment fragment = new MissionItemWrapUpFragment();
        fragmentManager.beginTransaction().replace(R.id.content_frame, fragment).addToBackStack(fragment.getClass().getName()).commit();

    }

    @Override
    public void onPause() {
        doSuper = false; // see BaseFragment
        super.onPause();
        Log.d(TAG, "onPause");
    }

    @Override
    public void onStop() {
        doSuper = false; // see BaseFragment
        super.onStop();
        Log.d(TAG, "onStop");
    }

    @Override
    public void onDestroyView() {
        doSuper = false; // see BaseFragment
        super.onDestroyView();
        Log.d(TAG, "onDestroyView");
    }

    @Override
    public void onDestroy() {
        doSuper = false; // see BaseFragment
        super.onDestroy();
        Log.d(TAG, "onDestroy");
    }

    private void setMissionItemState(String state) {
        missionDetail.setState(state, missionItemId);
    }

    private void wireUp(Button button, final MissionDetail missionDetail) {
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                call(missionDetail);
            }
        });
    }

    private void wireUp2(Button button, final MissionDetail missionDetail) {
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                call2(missionDetail);
            }
        });
    }

    private void call(MissionDetail missionDetail) {
        checkPermission();
        setMissionItemState("calling");
        Intent intent = new Intent(Intent.ACTION_CALL);
        intent.setData(Uri.parse("tel:" + missionDetail.getPhone()));

        //intent.putExtra("mission", missionDetail.getMission_name()); // don't need this
        // WRITE THE BEGINNING OF THE CALL TO THE DATABASE HERE BECAUSE SOME CARRIERS LIKE
        // SPRINT BLOCK INTERNET ACCESS WHILE THE PHONE
        // IS OFFHOOK.
        // Writing to the database here just gives the directors the cool visual of seeing the
        // call start and then seeing it end

        String team = User.getInstance().getCurrentTeamName();
        DatabaseReference ref = FirebaseDatabase.getInstance().getReference("teams/" + team + "/activity");
        String eventType = "is calling";
        String volunteerPhone = getVolunteerPhone();
        String supporterName = missionDetail.getName();
        MissionItemEvent m = new MissionItemEvent(eventType, User.getInstance().getUid(), User.getInstance().getName(), missionDetail.getMission_name(), missionDetail.getPhone(), volunteerPhone, supporterName);
        ref.child("all").push().setValue(m);
        ref.child("by_phone_number").child(missionDetail.getPhone()).push().setValue(m);

        startActivity(intent);
    }

    // call the name2/phone2 person
    private void call2(MissionDetail missionDetail) {
        checkPermission();
        //setMissionItemState("calling");
        Intent intent = new Intent(Intent.ACTION_CALL);
        intent.setData(Uri.parse("tel:" + missionDetail.getPhone2()));

        String team = User.getInstance().getCurrentTeamName();
        DatabaseReference ref = FirebaseDatabase.getInstance().getReference("teams/" + team + "/activity");
        String eventType = "is calling";
        String volunteerPhone = getVolunteerPhone();
        String name2 = missionDetail.getName2();
        MissionItemEvent m = new MissionItemEvent(eventType, User.getInstance().getUid(), User.getInstance().getName(), missionDetail.getMission_name(), missionDetail.getPhone2(), volunteerPhone, name2);
        ref.child("all").push().setValue(m);
        ref.child("by_phone_number").child(missionDetail.getPhone()).push().setValue(m);

        startActivity(intent);
    }

    private String getVolunteerPhone() {

        TelephonyManager mTelephonyMgr;
        mTelephonyMgr = (TelephonyManager)
                myView.getContext().getSystemService(Context.TELEPHONY_SERVICE);


        if (ActivityCompat.checkSelfPermission(getActivity(), Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {

                // Should we show an explanation?
                if (ActivityCompat.shouldShowRequestPermissionRationale((Activity) myView.getContext(), readPhoneState)) {

                    // Show an explanation to the user *asynchronously* -- don't block
                    // this thread waiting for the user's response! After the user
                    // sees the explanation, try again to request the permission.

                } else {

                    // No explanation needed, we can request the permission.

                    ActivityCompat.requestPermissions((Activity) myView.getContext(),
                            new String[]{readPhoneState},
                            1 /*MY_PERMISSIONS_REQUEST_READ_CONTACTS*/);

                    // MY_PERMISSIONS_REQUEST_READ_CONTACTS is an
                    // app-defined int constant. The callback method gets the
                    // result of the request.
                }
            }

        String tel = mTelephonyMgr.getLine1Number();
        return tel;
    }


    // I moved these 2 methods over to LauncherActivity because, in production, I'm getting
    // an app crash on the very first phone call.  Thinking that I'm requesting permission
    // too late ... ?
    // https://developer.android.com/training/permissions/requesting.html
    private void checkPermission() {
        checkPermission(android.Manifest.permission.CALL_PHONE);
    }

    // I moved these 2 methods over to LauncherActivity because, in production, I'm getting
    // an app crash on the very first phone call.  Thinking that I'm requesting permission
    // too late ... ?
    private void checkPermission(String androidPermission) {// Here, thisActivity is the current activity
        if (ContextCompat.checkSelfPermission(myView.getContext(), androidPermission)
                != PackageManager.PERMISSION_GRANTED) {

            // Should we show an explanation?
            if (ActivityCompat.shouldShowRequestPermissionRationale((Activity) myView.getContext(), androidPermission)) {

                // Show an explanation to the user *asynchronously* -- don't block
                // this thread waiting for the user's response! After the user
                // sees the explanation, try again to request the permission.

            } else {

                // No explanation needed, we can request the permission.

                ActivityCompat.requestPermissions((Activity) myView.getContext(),
                        new String[]{androidPermission},
                        1 /*MY_PERMISSIONS_REQUEST_READ_CONTACTS*/);

                // MY_PERMISSIONS_REQUEST_READ_CONTACTS is an
                // app-defined int constant. The callback method gets the
                // result of the request.
            }
        }
    }

}
