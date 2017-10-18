package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.PhoneCampaignCreated;
import com.brentdunklau.telepatriot_android.util.User;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;

/**
 * Created by bdunklau on 10/17/17.
 */

public class MissionDetailsFragment extends Fragment {

    private TextView mission_name, mission_event_date, mission_event_type, mission_type, name, uid, mission_details;


    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.missiondetails_fragment, container, false);

        //String uid_date_status = User.getInstance().getUid()+"_"+
        mission_name = myView.findViewById(R.id.heading_mission_name);
        mission_details = myView.findViewById(R.id.text_mission_details);

        Query q = FirebaseDatabase.getInstance().getReference("missions")
                .orderByChild("uid").equalTo(User.getInstance().getUid()).limitToFirst(1);
        q.addChildEventListener(new ChildEventListener() {
            @Override
            public void onChildAdded(DataSnapshot dataSnapshot, String s) {
                PhoneCampaignCreated c = dataSnapshot.getValue(PhoneCampaignCreated.class);
                mission_name.setText(c.getMission_name());
                mission_details.setText(c.getMission_type()+" created "+c.getCreate_date());
            }

            @Override
            public void onChildChanged(DataSnapshot dataSnapshot, String s) { }

            @Override
            public void onChildRemoved(DataSnapshot dataSnapshot) { }

            @Override
            public void onChildMoved(DataSnapshot dataSnapshot, String s) { }

            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });


        //mission_name = myView.findViewById(R.i)


        setHasOptionsMenu(true);
        return myView;
    }

}
