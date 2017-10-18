package com.brentdunklau.telepatriot_android.util;

import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;

import org.w3c.dom.Text;

/**
 * Created by bdunklau on 10/18/2017.
 */

public class MissionHolder extends RecyclerView.ViewHolder {

    TextView mission_name, mission_type, mission_create_date, mission_created_by;

    // https://stackoverflow.com/a/41629505
    private MissionHolder.ClickListener mClickListener;


    public MissionHolder(View itemView) {
        super(itemView);
        mission_name = itemView.findViewById(R.id.mission_name);
        mission_type = itemView.findViewById(R.id.mission_type);
        mission_create_date = itemView.findViewById(R.id.mission_create_date);
        mission_created_by = itemView.findViewById(R.id.mission_created_by);
    }

    public void setMission(Mission mission) {
        // set TextView elements here
        mission_name.setText(mission.getMission_name());
        mission_type.setText(mission.getMission_type());
        mission_create_date.setText("Created on "+mission.getMission_create_date());
        mission_created_by.setText("By "+mission.getName());


        // mission details:  Phone Campaign created on [date] by [name]
    }

    // https://stackoverflow.com/a/41629505
    public void setOnClickListener(MissionHolder.ClickListener clickListener){
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
