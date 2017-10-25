package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.os.Bundle;
import android.provider.ContactsContract;
import android.support.annotation.Nullable;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.MissionDetails;
import com.brentdunklau.telepatriot_android.util.MissionDetailsHolder;
import com.brentdunklau.telepatriot_android.util.PhoneCampaignCreated;
import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.UserBean;
import com.brentdunklau.telepatriot_android.util.UserHolder;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 10/17/17.
 */

public class MissionDetailsFragment extends Fragment {

    private TextView mission_name, mission_event_date, mission_event_type, mission_type, name, uid;
    private String missionId;
    private FirebaseRecyclerAdapter<MissionDetails, MissionDetailsHolder> mAdapter;
    private RecyclerView mission_items;

    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.missiondetails_fragment, container, false);

        //String uid_date_status = User.getInstance().getUid()+"_"+
        mission_name = myView.findViewById(R.id.heading_mission_name);

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        mission_items = (RecyclerView) myView.findViewById(R.id.mission_items);
        mission_items.setLayoutManager(new LinearLayoutManager(myView.getContext()));


        /* This might BE what we want...
        Query q = FirebaseDatabase.getInstance().getReference("missions/"+missionId).limitToFirst(1);
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
*/

        //mission_name = myView.findViewById(R.i)

        getMissionItems();

        setHasOptionsMenu(true);
        return myView;
    }


    public void getMissionItems() {

        try {
            final DatabaseReference ref = FirebaseDatabase.getInstance().getReference("/missions/"+missionId);

            ValueEventListener v2 = new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot dataSnapshot) {
                    doit(ref);
                }
                @Override
                public void onCancelled(DatabaseError databaseError) { }
            };

            ref.orderByChild("name")/*.limitToFirst(25) limit somehow? */.addValueEventListener(v2);


        } catch(Throwable t) {
            int i=0;
        }

    }

    private void doit(DatabaseReference ref) {

        // see:  https://www.youtube.com/watch?v=ynKWnC0XiXk
        mAdapter = new FirebaseRecyclerAdapter<MissionDetails, MissionDetailsHolder>(
                MissionDetails.class,
                R.layout.mission_item,  // see 0:42 of https://www.youtube.com/watch?v=A-_hKWMA7mk
                MissionDetailsHolder.class,
                ref) {
            @Override
            public void populateViewHolder(MissionDetailsHolder holder, MissionDetails missionDetails, int position) {
                holder.setMissionDetails(missionDetails);
            }


            // https://stackoverflow.com/a/41629505
            @Override
            public MissionDetailsHolder onCreateViewHolder(ViewGroup parent, int viewType) {
                MissionDetailsHolder viewHolder = super.onCreateViewHolder(parent, viewType);
                viewHolder.setOnClickListener(new MissionDetailsHolder.ClickListener() {
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
        };
        mission_items.setAdapter(mAdapter);
    }

    public void setMissionId(String missionId) {
        this.missionId = missionId;
    }

}
