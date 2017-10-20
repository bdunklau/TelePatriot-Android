package com.brentdunklau.telepatriot_android;

import android.app.Activity;
import android.app.Fragment;
import android.os.Bundle;
import android.os.Handler;
import android.support.annotation.Nullable;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.Mission;
import com.brentdunklau.telepatriot_android.util.MissionHolder;
import com.brentdunklau.telepatriot_android.util.Team;
import com.brentdunklau.telepatriot_android.util.TeamHolder;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 10/19/17.
 */

public class TeamsFragment extends Fragment {

    protected String title = "Teams";
    protected DatabaseReference ref;
    protected Query query;

    public TeamsFragment() {

    }


    private TextView header_teams_list;
    private FirebaseRecyclerAdapter<Team, TeamHolder> mAdapter;
    private LinearLayoutManager mLinearLayoutManager;
    private RecyclerView teams;
    private EditText new_team_name;
    private Button submit_new_team;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.teams_fragment, container, false);

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        teams = (RecyclerView) myView.findViewById(R.id.all_teams_list);
        mLinearLayoutManager = new LinearLayoutManager(myView.getContext());
        mLinearLayoutManager.setReverseLayout(true); // puts the most recent inserts at the top
        mLinearLayoutManager.setStackFromEnd(true);  // https://stackoverflow.com/a/29810833
        teams.setLayoutManager(mLinearLayoutManager);

        header_teams_list = myView.findViewById(R.id.header_teams_list);
        header_teams_list.setText(title);

        setUI();
        showTeams();

        setHasOptionsMenu(true);
        return myView;
    }


    private void setUI() {
        ((Activity)myView.getContext()).getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);
        new_team_name = myView.findViewById(R.id.new_team_name);
        new_team_name.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {

            }

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {

            }

            @Override
            public void afterTextChanged(Editable editable) {
                if(new_team_name.getText().toString().length() > 0) {
                    submit_new_team.setEnabled(true);

                }
                else {
                    submit_new_team.setEnabled(false);
                    // this is where we put the code that removes the "so-and-so is typing" message
                }
            }
        });

        submit_new_team = myView.findViewById(R.id.submit_new_team);
        submit_new_team.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Team team = new Team(new_team_name.getText().toString());
                FirebaseDatabase.getInstance().getReference("teams").push().setValue(team);
                setField(new_team_name, "");
                submit_new_team.setEnabled(false);
            }
        });
    }


    private void setField(final EditText field, final String str) {
        Runnable r = new Runnable() {
            @Override
            public void run() {
                field.setText(str);
            }
        };
        new Handler().post(r);
    }


    private void showTeams() {
        ref = FirebaseDatabase.getInstance().getReference("teams");
        query = ref;
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
        mAdapter = new FirebaseRecyclerAdapter<Team, TeamHolder>(
                Team.class,
                R.layout.team_summary,  // see 0:42 of https://www.youtube.com/watch?v=A-_hKWMA7mk
                TeamHolder.class,
                query) {
            @Override
            public void populateViewHolder(TeamHolder holder, Team team, int position) {
                holder.setMission(team, this.getRef(position)); // https://stackoverflow.com/a/45731532
            }


            // https://stackoverflow.com/a/41629505
            @Override
            public TeamHolder onCreateViewHolder(ViewGroup parent, int viewType) {
                TeamHolder viewHolder = super.onCreateViewHolder(parent, viewType);
                viewHolder.setOnClickListener(new TeamHolder.ClickListener() {
                    @Override
                    public void onItemClick(View view, int position) {
                        mAdapter.getRef(position).orderByKey().addListenerForSingleValueEvent(new ValueEventListener() {
                            @Override
                            public void onDataChange(DataSnapshot dataSnapshot) {
                                // This is when you touch a team to see just that mission
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
                teams.getLayoutManager().scrollToPosition(positionStart); // https://stackoverflow.com/a/33329765
            }
        });


        teams.setAdapter(mAdapter);
    }

}
