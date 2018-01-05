package com.brentdunklau.telepatriot_android;

import android.app.Activity;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.graphics.Color;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.Mission;
import com.brentdunklau.telepatriot_android.util.MissionHolder;
import com.brentdunklau.telepatriot_android.util.Team;
import com.brentdunklau.telepatriot_android.util.TeamHolder;
import com.brentdunklau.telepatriot_android.util.User;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 12/15/2017.
 */

public class SwitchTeamsFragment extends BaseFragment {

    private TextView header_team_list;
    private RecyclerView teams;
    private LinearLayoutManager mLinearLayoutManager;
    private DatabaseReference ref;
    //private Query query; // Ex: this.query = this.ref.orderByChild("uid").equalTo(User.getInstance().getUid());
    private FirebaseRecyclerAdapter<Team, TeamHolder> mAdapter;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.switch_teams_fragment, container, false);

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        teams = (RecyclerView) myView.findViewById(R.id.all_teams_list);
        mLinearLayoutManager = new LinearLayoutManager(myView.getContext());
        teams.setLayoutManager(mLinearLayoutManager);

        header_team_list = myView.findViewById(R.id.header_team_list);
        header_team_list.setText("Switch Teams");

        ref = FirebaseDatabase.getInstance().getReference("users/"+User.getInstance().getUid()+"/teams");
        showTeams(ref);

        setHasOptionsMenu(true);
        return myView;
    }


    private void showTeams(final DatabaseReference ref) {

        // ref is instantiated in the subclasses
        ref.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                doit(ref);
            }

            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });

    }


    /**
     * OOOPS - Nasty bug because I used the team name as the key.  Probably should have used
     * auto-generated key.  Got NPE way down in Looper saying could not convert Boolean to Team
     * which makes sense because I'm storing team info as  team:true, i.e. The Cavalry:true
     */
    private void doit(DatabaseReference ref) {

        final FragmentManager fragmentManager = getFragmentManager();

        // see:  https://www.youtube.com/watch?v=ynKWnC0XiXk
        mAdapter = new FirebaseRecyclerAdapter<Team, TeamHolder>(
                Team.class,
                R.layout.team_summary,  // see 0:42 of https://www.youtube.com/watch?v=A-_hKWMA7mk
                TeamHolder.class,
                ref) {


            @Override
            public void populateViewHolder(TeamHolder holder, Team team, int position) {
                holder.setTeam_name(team, this.getRef(position)); // https://stackoverflow.com/a/45731532
            }


            // https://stackoverflow.com/a/41629505
            @Override
            public TeamHolder onCreateViewHolder(ViewGroup parent, int viewType) {
                TeamHolder viewHolder = super.onCreateViewHolder(parent, viewType);
                viewHolder.setOnClickListener(new TeamHolder.ClickListener() {

                    /**
                     * touching one of the teams switches you over to that team
                     */
                    @Override
                    public void onItemClick(final View view, int position) {
                        // can't put breakpoint here ---v  Crashes the app :(
                        mAdapter.getRef(position).orderByKey().addListenerForSingleValueEvent(new ValueEventListener() {
                            @Override
                            public void onDataChange(DataSnapshot dataSnapshot) {

                                if(dataSnapshot == null) {
                                    return;
                                }

                                // the team name is the key in this case
                                String teamName = dataSnapshot.getKey();
                                Team team = new Team(teamName);
                                User.getInstance().setCurrentTeam(team);

                                Activity act = (Activity) myView.getContext();
                                DrawerLayout drawer = (DrawerLayout) act.findViewById(R.id.drawer_layout);
                                drawer.openDrawer(Gravity.START);
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
                teams.getLayoutManager().scrollToPosition(positionStart); // https://stackoverflow.com/a/33329765
            }
        });


        teams.setAdapter(mAdapter);
    }
}
