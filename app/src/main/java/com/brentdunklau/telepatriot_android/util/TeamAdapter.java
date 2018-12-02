package com.brentdunklau.telepatriot_android.util;

import android.app.Activity;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.widget.RecyclerView;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;
import com.brentdunklau.telepatriot_android.citizenbuilder.CBTeam;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 11/20/18.
 */

public class TeamAdapter extends RecyclerView.Adapter<TeamAdapter.TeamNameHolder> {
    private CBTeam[] mDataset;

    // Provide a reference to the views for each data item
    // Complex data items may need more than one view per item, and
    // you provide access to all the views for a data item in a view holder
    public static class TeamNameHolder extends RecyclerView.ViewHolder {
        // each data item is just a string in this case
        public TextView mTextView;
        private TeamNameHolder.ClickListener mClickListener;
        public TeamNameHolder(View view) {
            super(view);
            View team_name = view.findViewById(R.id.team_name);
            mTextView = (TextView)team_name;
            view.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    mClickListener.onItemClick(v, getAdapterPosition());
                }
            });
        }

        public void setOnClickListener(TeamNameHolder.ClickListener clickListener){
            mClickListener = clickListener;
        }

        public interface ClickListener {
            public void onItemClick(View view, int position);
            public void onItemLongClick(View view, int position);
        }
    }

    // Provide a suitable constructor (depends on the kind of dataset)
    public TeamAdapter(CBTeam[] myDataset) {
        mDataset = myDataset;
    }

    // Create new views (invoked by the layout manager)
    @Override
    public TeamNameHolder onCreateViewHolder(ViewGroup parent,
                                             int viewType) {
        // create a new view
        View obj = LayoutInflater.from(parent.getContext()).inflate(R.layout.team_summary, parent, false);

        TeamNameHolder vh = new TeamNameHolder(obj);
        vh.setOnClickListener(new TeamNameHolder.ClickListener() {

            /**
             * touching one of the teams switches you over to that team
             */
            @Override
            public void onItemClick(final View view, int position) {
                CBTeam selectedTeam = mDataset[position];
                User.getInstance().setCurrentTeam(selectedTeam);

                Activity act = (Activity) view.getContext();
                DrawerLayout drawer = (DrawerLayout) act.findViewById(R.id.drawer_layout);
                drawer.openDrawer(Gravity.START);
            }

            @Override
            public void onItemLongClick(View view, int position) {
            }
        });

        return vh;

    }

    // Replace the contents of a view (invoked by the layout manager)
    @Override
    public void onBindViewHolder(TeamNameHolder holder, int position) {
        // - get element from your dataset at this position
        // - replace the contents of the view with that element
        String val = mDataset[position].getTeam_name();
        holder.mTextView.setText(val);
    }

    // Return the size of your dataset (invoked by the layout manager)
    @Override
    public int getItemCount() {
        return mDataset.length;
    }
}