package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.content.DialogInterface;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.app.AlertDialog;
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
import com.brentdunklau.telepatriot_android.util.User;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 10/17/17.
 */

public class MissionDetailsFragment extends BaseFragment {

    private Mission mission;
    private TextView mission_name, mission_event_date, mission_event_type, mission_type, name, uid, mission_description, mission_script;
    private Button button_delete_mission;
    private String missionId;
    private FirebaseRecyclerAdapter<MissionDetail, MissionDetailHolder> mAdapter;
    private RecyclerView mission_items;

    View myView;

    @Nullable
    @Override
    // called by MissionListFragment
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.missiondetails_fragment, container, false);

        //String uid_date_status = User.getInstance().getUid()+"_"+
        mission_name = myView.findViewById(R.id.heading_mission_name);
        mission_name.setText(mission.getMission_name());

        mission_description = myView.findViewById(R.id.mission_description);
        mission_description.setText(mission.getDescription());

        mission_script = myView.findViewById(R.id.mission_script);
        mission_script.setText(mission.getScript());

        button_delete_mission = myView.findViewById(R.id.button_delete_mission);
        button_delete_mission.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if(mission == null)
                    return;
                alertDeleteMission(mission);
            }
        });

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        mission_items = (RecyclerView) myView.findViewById(R.id.mission_items);
        mission_items.setLayoutManager(new LinearLayoutManager(myView.getContext()));

        getMissionItems();

        setHasOptionsMenu(true);
        return myView;
    }


    private void alertDeleteMission(Mission m) {
        // Use the Builder class for convenient dialog construction
        // R.style.AppCompatAlertDialogStyle is defined in styles.xml
        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity(), R.style.AppCompatAlertDialogStyle);
        builder.setTitle("Delete Mission");
        builder.setMessage("Are you SURE you want to delete this Mission?\n\nBecause once it's gone - it's GONE")
                .setPositiveButton("Yes, Delete", new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        // FIRE ZE MISSILES!
                    }
                })
                .setNegativeButton("Don't Delete", new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface dialog, int id) {
                        // User cancelled the dialog
                    }
                });
        // Create the AlertDialog object and return it
        AlertDialog dlg = builder.create();
        dlg.show();
    }


    public void getMissionItems() {

        if(missionId == null)
            return;

        try {
            String team = User.getInstance().getCurrentTeamName();
            final Query ref = FirebaseDatabase.getInstance().getReference("/teams/"+team+"/missions/"+missionId+"/mission_items");

            ValueEventListener v2 = new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot dataSnapshot) {
                    doit(ref);
                }
                @Override
                public void onCancelled(DatabaseError databaseError) { }
            };

            ref/*.limitToFirst(25) limit somehow? */.addValueEventListener(v2);


        } catch(Throwable t) {
            int i=0;
        }

    }

    private void doit(Query ref) {

        // see:  https://www.youtube.com/watch?v=ynKWnC0XiXk
        mAdapter = new FirebaseRecyclerAdapter<MissionDetail, MissionDetailHolder>(
                MissionDetail.class,
                R.layout.mission_item,  // see 0:42 of https://www.youtube.com/watch?v=A-_hKWMA7mk
                MissionDetailHolder.class,
                ref/*.child("data")*//*.orderByKey()*//*.limitToFirst(10)*/) {
            @Override
            public void populateViewHolder(MissionDetailHolder holder, MissionDetail missionDetail, int position) {
                holder.setMissionDetail(missionDetail);

                // nested FirebaseRecyclerAdapter...
                // https://stackoverflow.com/q/42498647
            }


            /*
            // https://stackoverflow.com/a/41629505
            @Override
            public MissionDetailHolder onCreateViewHolder(ViewGroup parent, int viewType) {
                MissionDetailHolder viewHolder = super.onCreateViewHolder(parent, viewType);
                viewHolder.setOnClickListener(new MissionDetailHolder.ClickListener() {
                    @Override
                    public void onItemClick(View view, int position) {
                        mAdapter.getRef(position).orderByKey().addListenerForSingleValueEvent(new ValueEventListener() {
                            @Override
                            public void onDataChange(DataSnapshot dataSnapshot) {

                            }

                            @Override
                            public void onCancelled(DatabaseError databaseError) {

                            }
                        });
                    }

                    @Override
                    public void onItemLongClick(View view, int position) {
                    }
                });
                return viewHolder;
            }
            */
        };
        mission_items.setAdapter(mAdapter);
    }

    public void setMissionId(String missionId) {
        this.missionId = missionId;
    }

    public void setMission(Mission mission) {
        this.mission = mission;
    }

}
