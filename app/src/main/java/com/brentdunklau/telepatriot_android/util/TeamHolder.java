package com.brentdunklau.telepatriot_android.util;

import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.CompoundButton;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;
import com.google.firebase.database.DatabaseReference;

/**
 * Created by bdunklau on 10/19/17.
 */

public class TeamHolder extends RecyclerView.ViewHolder {

    TextView team_name;

    // https://stackoverflow.com/a/41629505
    private TeamHolder.ClickListener mClickListener;

    public TeamHolder(View itemView) {
        super(itemView);
        team_name = itemView.findViewById(R.id.team_name);

        // https://stackoverflow.com/a/41629505
        //listener set on ENTIRE ROW, you may set on individual components within a row.
        itemView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mClickListener.onItemClick(v, getAdapterPosition());
            }
        });
    }

    public void setTeam_name(final Team team, final DatabaseReference ref) {
        // set TextView elements here
        team_name.setText(team.getTeam_name());
    }

    // https://stackoverflow.com/a/41629505
    public void setOnClickListener(TeamHolder.ClickListener clickListener){
        mClickListener = clickListener;
    }

    // TODO duplicated in UserHolder
    // https://stackoverflow.com/a/41629505
    //Interface to send callbacks...
    public interface ClickListener {
        public void onItemClick(View view, int position);
        public void onItemLongClick(View view, int position);
    }
}
