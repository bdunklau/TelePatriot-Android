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
import com.brentdunklau.telepatriot_android.util.User;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 10/18/2017.
 */

public class MyActiveMissionsFragment extends Fragment {

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
        missions.setLayoutManager(mLinearLayoutManager);

        header_mission_list = (TextView) myView.findViewById(R.id.header_mission_list);
        header_mission_list.setText("My Active Missions");

        showMissions();

        setHasOptionsMenu(true);
        return myView;
    }


    private void showMissions() {
        final DatabaseReference ref = FirebaseDatabase.getInstance().getReference("missions");
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
                ref.orderByChild("uid_and_active").equalTo(User.getInstance().getUid()+"_true")) {
            @Override
            public void populateViewHolder(MissionHolder holder, Mission mission, int position) {
                holder.setMission(mission);
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
                int friendlyMessageCount = mAdapter.getItemCount();
                int lastVisiblePosition =
                        mLinearLayoutManager.findLastCompletelyVisibleItemPosition();
                // If the recycler view is initially being loaded or the
                // user is at the bottom of the list, scroll to the bottom
                // of the list to show the newly added message.
                if (lastVisiblePosition == -1 ||
                        (positionStart >= (friendlyMessageCount - 1) &&
                                lastVisiblePosition == (positionStart - 1))) {
                    missions.scrollToPosition(positionStart);
                }
            }
        });



        missions.setAdapter(mAdapter);
    }

}
