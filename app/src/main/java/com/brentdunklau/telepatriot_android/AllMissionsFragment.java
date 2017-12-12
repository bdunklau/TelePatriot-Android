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
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 10/18/2017.
 */

public class AllMissionsFragment extends MissionListFragment {

    public AllMissionsFragment() {
        this.title = "All Missions";
        // TODO won't always be this...
        String team = "The Cavalry";
        this.ref = FirebaseDatabase.getInstance().getReference("teams/"+team+"/missions");
        this.query = this.ref;
    }

}
