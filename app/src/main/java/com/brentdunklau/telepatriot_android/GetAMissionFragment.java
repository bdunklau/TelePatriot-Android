package com.brentdunklau.telepatriot_android;

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

public class GetAMissionFragment extends BaseFragment {

    private String TAG = "GetAMissionFragment";
    private MissionDetail missionDetail;
    private TextView mission_name, mission_event_date, mission_event_type, mission_type, name, uid, mission_description, mission_script;
    private Button button_call_person1;
    private String missionId, missionItemId;


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
        myView = inflater.inflate(R.layout.get_a_mission_fragment, container, false);

        mission_name = myView.findViewById(R.id.heading_mission_name);
        mission_description = myView.findViewById(R.id.mission_description);
        mission_script = myView.findViewById(R.id.mission_script);
        button_call_person1 = myView.findViewById(R.id.button_call_person1);


        FirebaseDatabase.getInstance().getReference("mission_items").orderByChild("active_and_accomplished").equalTo("true_new").limitToFirst(1).addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                for (DataSnapshot child : dataSnapshot.getChildren()) {
                    missionItemId = child.getKey();

                    missionDetail = child.getValue(MissionDetail.class);
                    if(missionDetail == null)
                        return; // we should indicate no missions available for the user

                    User.getInstance().setCurrentMissionItem(missionItemId, missionDetail);

                    String missionName = missionDetail.getMission_name();
                    String missionDescription = missionDetail.getDescription();
                    String missionScript = missionDetail.getScript();

                    mission_name.setText(missionName);
                    mission_description.setText(missionDescription);
                    mission_script.setText(missionScript);
                    button_call_person1.setVisibility(View.VISIBLE);
                    button_call_person1.setText(missionDetail.getName()+" "+missionDetail.getPhone());
                    wireUp(button_call_person1, missionDetail);

                    missionDetail.setAccomplished("in progress");
                    missionDetail.setActive_and_accomplished("true_in progress");

                    dataSnapshot.getRef().child(missionItemId).setValue(missionDetail);
                }

            }

            @Override
            public void onCancelled(DatabaseError databaseError) {

            }
        });


        setHasOptionsMenu(true);
        return myView;
    }

    // called when we come back from a call
    @Override
    public void onResume() {
        doSuper = false; // see BaseFragment
        super.onResume();
        Log.d(TAG, "onResume: missionDetail.getActive_and_accomplished() = "+(missionDetail==null ? "null" :  missionDetail.getActive_and_accomplished()));
        // what do we do here?
        // when does this get called?  When the user returns from a call
        //      but also when the user returns here from anywhere
        // but we DO now have the current mission item stored in the User object
        // If we are resuming on a mission that is  active_and_accomplished: true_complete,
        // then we need to send the user on to a fragment where they can enter notes on the
        // call
        if(missionDetail != null && missionDetail._isAccomplished()) {
            FragmentManager fragmentManager = getFragmentManager();

            fragmentManager.beginTransaction().replace(R.id.content_frame, new MissionItemWrapUpFragment()).commit();
        }
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

    /*
    private void completeCallIfAppropriate() {
        if(missionDetail == null)
            return;
        if("new".equalsIgnoreCase(missionDetail.getAccomplished()))
            return;
        if("in progress".equalsIgnoreCase(missionDetail.getAccomplished()))
            return;
        setMissionItemState("complete");
    }
    */

    /*
    private void makeMissionItemAvailable() {
        if(missionDetail == null)
            return;
        if("new".equalsIgnoreCase(missionDetail.getAccomplished()))
            return;
        if("calling".equalsIgnoreCase(missionDetail.getAccomplished()))
            return;
        setMissionItemState("new");
    }
    */

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

        DatabaseReference ref = FirebaseDatabase.getInstance().getReference("activity");
        String eventType = "is calling";
        String volunteerPhone = getVolunteerPhone();
        String supporterName = missionDetail.getName();
        MissionItemEvent m = new MissionItemEvent(eventType, User.getInstance().getUid(), User.getInstance().getName(), missionDetail.getMission_name(), missionDetail.getPhone(), volunteerPhone, supporterName);
        ref.push().setValue(m);
        ref.child(missionDetail.getPhone()).push().setValue(m);

        startActivity(intent);
    }

    private String getVolunteerPhone() {
        TelephonyManager mTelephonyMgr;
        mTelephonyMgr = (TelephonyManager)
                myView.getContext().getSystemService(Context.TELEPHONY_SERVICE);
        String tel = mTelephonyMgr.getLine1Number();
        return tel;
    }


    // https://developer.android.com/training/permissions/requesting.html
    private void checkPermission() {
        checkPermission(android.Manifest.permission.CALL_PHONE);
    }

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
