package com.brentdunklau.telepatriot_android;

import android.app.Activity;
import android.app.Fragment;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.support.v7.widget.SimpleItemAnimator;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.Mission;
import com.brentdunklau.telepatriot_android.util.MissionDetail;
import com.brentdunklau.telepatriot_android.util.MissionDetailHolder;
import com.brentdunklau.telepatriot_android.util.MissionItemEvent;
import com.brentdunklau.telepatriot_android.util.User;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by bdunklau on 10/26/17.
 */

public class GetAMissionFragment extends Fragment {

    //private Mission mission;
    private MissionDetail missionDetail;
    private TextView mission_name, mission_event_date, mission_event_type, mission_type, name, uid, mission_description, mission_script;
    private Button getButton_call_person1;
    private Button button_call_person1;
    private String missionId;


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
                    String missionItemId = child.getKey();

                    MissionDetail missionDetail = child.getValue(MissionDetail.class);
                    if(missionDetail == null)
                        return; // we should indicate no missions available for the user

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




        /*
        FirebaseDatabase.getInstance().getReference("mission_items").orderByChild("active_and_accomplished").equalTo("true_new").limitToFirst(1).addChildEventListener(new ChildEventListener() {
            @Override
            public void onChildAdded(DataSnapshot dataSnapshot, String s) {
                MissionDetail missionDetail = dataSnapshot.getValue(MissionDetail.class);
                String missionName = missionDetail.getMission_name();
                String missionDescription = missionDetail.getDescription();
                String missionScript = missionDetail.getScript();

                mission_name.setText(missionName);
                mission_description.setText(missionDescription);
                mission_script.setText(missionScript);
                button_call_person1.setVisibility(View.VISIBLE);
                button_call_person1.setText(missionDetail.getName()+" "+missionDetail.getPhone());

                dataSnapshot.getRef().child("accomplished").setValue("in progress");
                dataSnapshot.getRef().child("active_and_accomplished").setValue("true_in progress");


            }

            @Override
            public void onChildChanged(DataSnapshot dataSnapshot, String s) {

            }

            @Override
            public void onChildRemoved(DataSnapshot dataSnapshot) {
                mission_name.setText("No Mission at this Time");
                mission_description.setText("(no mission)");
                mission_script.setText("(no mission)");
                button_call_person1.setVisibility(View.GONE);
            }

            @Override
            public void onChildMoved(DataSnapshot dataSnapshot, String s) {

            }

            @Override
            public void onCancelled(DatabaseError databaseError) {

            }
        });
        */






        /*
        FirebaseDatabase.getInstance().getReference("mission_items").orderByChild("active_and_accomplished").equalTo("true_new").limitToFirst(1).addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                if(dataSnapshot.getChildrenCount() == 0) {
                    // no missions ready to go - oops
                    // maybe send the user to some other screen/fragment that lets them know what's going on
                }
                else {
                    MissionDetail missionDetail = dataSnapshot.getValue(MissionDetail.class);
                    String missionName = missionDetail.getMission_name();
                    String missionDescription = missionDetail.getDescription();
                    String missionScript = missionDetail.getScript();

                    mission_name = myView.findViewById(R.id.heading_mission_name);
                    mission_name.setText(missionName);

                    mission_description = myView.findViewById(R.id.mission_description);
                    mission_description.setText(missionDescription);

                    mission_script = myView.findViewById(R.id.mission_script);
                    mission_script.setText(missionScript);

                    button_call_person1 = myView.findViewById(R.id.button_call_person1);
                    button_call_person1.setText(missionDetail.getName()+" "+missionDetail.getPhone());
                }
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {

            }
        });
*/


        setHasOptionsMenu(true);
        return myView;
    }


    private void wireUp(Button button, final MissionDetail missionDetail) {
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                call(missionDetail);
            }
        });
    }


    private void call(MissionDetail missionDetail) {
        checkPermission();
        Intent intent = new Intent(Intent.ACTION_CALL);
        intent.setData(Uri.parse("tel:" + missionDetail.getPhone()));
        intent.putExtra("mission", missionDetail.getMission_name());
        // WRITE THE BEGINNING OF THE CALL TO THE DATABASE HERE BECAUSE SOME CARRIERS LIKE
        // SPRINT BLOCK INTERNET ACCESS WHILE THE PHONE
        // IS OFFHOOK.
        // Writing to the database here just gives the directors the cool visual of seeing the
        // call start and then seeing it end

        DatabaseReference ref = FirebaseDatabase.getInstance().getReference("activity");
        String eventType = "is calling";
        MissionItemEvent m = new MissionItemEvent(new Date().toString(), eventType, User.getInstance().getUid(), User.getInstance().getName(), missionDetail.getMission_name(), missionDetail.getPhone());
        ref.push().setValue(m);
        ref.child(missionDetail.getPhone()).push().setValue(m);

        startActivity(intent);
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
