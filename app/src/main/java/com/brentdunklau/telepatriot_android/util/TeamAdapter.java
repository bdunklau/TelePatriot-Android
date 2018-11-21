package com.brentdunklau.telepatriot_android.util;

import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;

/**
 * Created by bdunklau on 11/20/18.
 */

public class TeamAdapter extends RecyclerView.Adapter<TeamAdapter.TeamNameHolder> {
    private String[] mDataset;

    // Provide a reference to the views for each data item
    // Complex data items may need more than one view per item, and
    // you provide access to all the views for a data item in a view holder
    public static class TeamNameHolder extends RecyclerView.ViewHolder {
        // each data item is just a string in this case
        public TextView mTextView;
        public TeamNameHolder(View v) {
            super(v);
            View team_name = v.findViewById(R.id.team_name);
            mTextView = (TextView)team_name;
        }
    }

    // Provide a suitable constructor (depends on the kind of dataset)
    public TeamAdapter(String[] myDataset) {
        mDataset = myDataset;
    }

    // Create new views (invoked by the layout manager)
    @Override
    public TeamNameHolder onCreateViewHolder(ViewGroup parent,
                                             int viewType) {
        // create a new view
        View obj = LayoutInflater.from(parent.getContext()).inflate(R.layout.team_summary, parent, false);

        TeamNameHolder vh = null;
        try {
            vh = new TeamNameHolder(obj);
        } catch(Throwable t) {
            t.printStackTrace(); // TODO fix this
        }
        return vh;
    }

    // Replace the contents of a view (invoked by the layout manager)
    @Override
    public void onBindViewHolder(TeamNameHolder holder, int position) {
        // - get element from your dataset at this position
        // - replace the contents of the view with that element
        String val = mDataset[position];
        holder.mTextView.setText(val);
    }

    // Return the size of your dataset (invoked by the layout manager)
    @Override
    public int getItemCount() {
        return mDataset.length;
    }
}