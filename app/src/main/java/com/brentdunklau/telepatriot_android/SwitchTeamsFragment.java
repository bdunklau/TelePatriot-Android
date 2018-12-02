package com.brentdunklau.telepatriot_android;

import android.app.Activity;
import android.app.FragmentManager;
import android.app.ProgressDialog;
import android.os.AsyncTask;
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

import com.brentdunklau.telepatriot_android.citizenbuilder.CBTeam;
import com.brentdunklau.telepatriot_android.util.Configuration;
import com.brentdunklau.telepatriot_android.util.TeamAdapter;
import com.brentdunklau.telepatriot_android.util.Team;
import com.brentdunklau.telepatriot_android.util.TeamHolder;
import com.brentdunklau.telepatriot_android.util.User;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

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
    private TeamAdapter jAdapter;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.switch_teams_fragment, container, false);

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        teams = myView.findViewById(R.id.all_teams_list);
        mLinearLayoutManager = new LinearLayoutManager(myView.getContext());
        teams.setLayoutManager(mLinearLayoutManager);

        header_team_list = myView.findViewById(R.id.header_team_list);
        header_team_list.setText("Switch Teams");

        // TODO transitional code - are we getting team list from TelePatriot (old way) or CB (new way)
        FirebaseDatabase.getInstance().getReference("administration/configuration").addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
//                Map<String, Object> config = (Map<String, Object>) dataSnapshot.getValue();
//                String get_teams_from = "citizenbuilder";
//                if(config.get("get_teams_from") != null)
//                    get_teams_from = config.get("get_teams_from")+"";
//
//                String environment = config.get("environment")+"";
//                Map<String, String> env = (Map<String, String>) config.get(environment);

                Configuration conf = dataSnapshot.getValue(Configuration.class);
                if(conf.getTeamsFromCB()) {
                    showTeams_fromCitizenBuilder(conf);
                }
                else {
                    showTeams_legacy();
                }
            }

            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });


        setHasOptionsMenu(true);
        return myView;
    }


    private void showTeams_fromCitizenBuilder(Configuration conf/*Map<String, String> env*/) {
        String citizen_builder_domain = conf.getCitizenBuilderDomain();
        String citizen_builder_api_key_name = conf.getCitizenBuilderApiKeyName();
        String citizen_builder_api_key_value = conf.getCitizenBuilderApiKeyValue();

        // http://square.github.io/okhttp/
        if(User.getInstance().getCitizen_builder_id() == null)
            return;

        final String url = "https://"+citizen_builder_domain+"/api/ios/v1/teams/person_teams?person_id="+User.getInstance().getCitizen_builder_id();

        new JsonTask().execute(url, citizen_builder_api_key_name, citizen_builder_api_key_value);
    }


    private void showTeams_legacy() {
        ref = FirebaseDatabase.getInstance().getReference("users/"+User.getInstance().getUid()+"/teams");
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





    ProgressDialog pd;


    private class JsonTask extends AsyncTask<String, String, List<CBTeam>> {

        protected void onPreExecute() {
            super.onPreExecute();

            pd = new ProgressDialog(SwitchTeamsFragment.this.myView.getContext());
            pd.setMessage("Please wait");
            pd.setCancelable(false);
            pd.show();
        }

        protected List<CBTeam> doInBackground(String... params) {

            String url = params[0];
            String citizen_builder_api_key_name = params[1];
            String citizen_builder_api_key_value = params[2];

            List<CBTeam> teams = new ArrayList<CBTeam>();

            try {
                OkHttpClient client = new OkHttpClient();
                Request request = new Request.Builder()
                        .addHeader(citizen_builder_api_key_name, citizen_builder_api_key_value)
                        .url(url)
                        .build();

                Response response = client.newCall(request).execute();

                String jsonData = response.body().string();
                JSONObject Jobject = new JSONObject(jsonData);
                JSONArray jarray = Jobject.getJSONArray("teams");
                for (int i = 0; i < jarray.length(); i++) {
                    JSONObject j = jarray.getJSONObject(i);
                    Integer teamId = j.getInt("id");
                    String teamName = j.getString("name");
                    teams.add(new CBTeam(teamId, teamName));
                }
            } catch (IOException ex) {
                // TODO log to the database - we have the user's id
                ex.printStackTrace();
            } catch (JSONException ex)  {
                // TODO log to the database - we have the user's id
                ex.printStackTrace();
            }

            return teams;
        }

        @Override
        protected void onPostExecute(List<CBTeam> teams) {
            super.onPostExecute(teams);
            if (pd.isShowing()){
                pd.dismiss();
            }
            if(teams == null || teams.size() == 0)
                return;
            CBTeam[] tarr = new CBTeam[teams.size()];
            teams.toArray(tarr);
            jAdapter = new TeamAdapter(tarr);
            SwitchTeamsFragment.this.teams.setAdapter(jAdapter);

        }
    }
}


