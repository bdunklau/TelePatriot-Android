package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.os.Bundle;
import android.support.annotation.Nullable;
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
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 10/26/17.
 */

public class GetAMissionFragment extends Fragment {

    private Mission mission;
    private MissionDetail missionDetail;
    private TextView mission_name, mission_event_date, mission_event_type, mission_type, name, uid, mission_description, mission_script;
    private Button getButton_call_person1;
    private Button button_call_person1;
    private String missionId;


    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.get_a_mission_fragment, container, false);

        //String uid_date_status = User.getInstance().getUid()+"_"+
        mission_name = myView.findViewById(R.id.heading_mission_name);
        mission_name.setText(mission.getMission_name());

        mission_description = myView.findViewById(R.id.mission_description);
        mission_description.setText(mission.getDescription());

        mission_script = myView.findViewById(R.id.mission_script);
        mission_script.setText(mission.getScript());

        button_call_person1 = myView.findViewById(R.id.button_call_person1);
        button_call_person1.setText(missionDetail.getName()+" "+missionDetail.getPhone());

        getMissionItem();

        setHasOptionsMenu(true);
        return myView;
    }


    public void getMissionItem() {

        if(missionId == null)
            return;

        try {
            final DatabaseReference ref = FirebaseDatabase.getInstance().getReference("/missions/"+missionId);

            ValueEventListener v2 = new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot dataSnapshot) {
                    //doit(ref);
                }
                @Override
                public void onCancelled(DatabaseError databaseError) { }
            };

            ref/*.limitToFirst(25) limit somehow? */.addValueEventListener(v2);


        } catch(Throwable t) {
            int i=0;
        }

    }

    public void setMissionId(String missionId) {
        this.missionId = missionId;
    }

    public void setMission(Mission mission) {
        this.mission = mission;
    }

}
