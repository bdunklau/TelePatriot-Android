package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.Mission;
import com.brentdunklau.telepatriot_android.util.MissionHolder;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 10/19/17.
 *
 * Created this class to consolidate duplicated code in 4 other classes:
 * AllMissionsFragment, AllMyMissionsFragment, MyActiveMissionsFragment and AllActiveMissionsFragment
 * Almost everything in these classes is duplicated code.  The only thing that's different is
 * the stuff we now pass in from each of their constructors
 */

public class MissionListFragment extends Fragment {
    protected String title;
    protected DatabaseReference ref;
    protected Query query;

    public MissionListFragment() {

    }


    private TextView header_mission_list;
    private FirebaseRecyclerAdapter<Mission, MissionHolder> mAdapter;
    private LinearLayoutManager mLinearLayoutManager;
    private RecyclerView missions;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.mission_list_fragment, container, false);

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        missions = (RecyclerView) myView.findViewById(R.id.all_missions_list);
        mLinearLayoutManager = new LinearLayoutManager(myView.getContext());
        mLinearLayoutManager.setReverseLayout(true); // puts the most recent inserts at the top
        missions.setLayoutManager(mLinearLayoutManager);

        header_mission_list = myView.findViewById(R.id.header_mission_list);
        header_mission_list.setText(title);

        showMissions();

        setHasOptionsMenu(true);
        return myView;
    }


    private void showMissions() {
        //final DatabaseReference ref = FirebaseDatabase.getInstance().getReference("missions");
        ref.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                doit(ref);
            }

            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });
    }


    private void doit(DatabaseReference ref) {

        // see:  https://www.youtube.com/watch?v=ynKWnC0XiXk
        mAdapter = new FirebaseRecyclerAdapter<Mission, MissionHolder>(
                Mission.class,
                R.layout.mission_summary,  // see 0:42 of https://www.youtube.com/watch?v=A-_hKWMA7mk
                MissionHolder.class,
                query) {
            @Override
            public void populateViewHolder(MissionHolder holder, Mission mission, int position) {
                holder.setMission(mission, this.getRef(position)); // https://stackoverflow.com/a/45731532
            }


            // https://stackoverflow.com/a/41629505
            @Override
            public MissionHolder onCreateViewHolder(ViewGroup parent, int viewType) {
                MissionHolder viewHolder = super.onCreateViewHolder(parent, viewType);
                viewHolder.setOnClickListener(new MissionHolder.ClickListener() {
                    @Override
                    public void onItemClick(View view, int position) {
                        mAdapter.getRef(position).orderByKey().addListenerForSingleValueEvent(new ValueEventListener() {
                            @Override
                            public void onDataChange(DataSnapshot dataSnapshot) {
                                // This is when you touch a mission to see just that mission
                                // See UserListFragment
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


        // automatically scrolls to the last (most recent) mission - easier than reverse ordering
        // see also ChatFragment
        mAdapter.registerAdapterDataObserver(new RecyclerView.AdapterDataObserver() {
            @Override
            public void onItemRangeInserted(int positionStart, int itemCount) {
                super.onItemRangeInserted(positionStart, itemCount);
                missions.scrollToPosition(0);
            }
        });

        missions.setAdapter(mAdapter);
    }

}
