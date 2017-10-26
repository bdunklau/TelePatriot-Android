package com.brentdunklau.telepatriot_android.util;

import android.os.Handler;
import android.support.v7.widget.RecyclerView;
import android.support.v7.widget.SwitchCompat;
import android.view.View;
import android.widget.CompoundButton;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;
import com.google.firebase.database.DatabaseReference;

import org.w3c.dom.Text;

/**
 * Created by bdunklau on 10/26/17.
 */

public class MissionItemEventHolder extends RecyclerView.ViewHolder {

    //TextView mission_name, mission_type, mission_create_date, mission_created_by;
    private TextView event_date, event_type, /*volunteer_uid,*/ volunteer_name, mission_name, phone;

    // https://stackoverflow.com/a/41629505
    private MissionItemEventHolder.ClickListener mClickListener;


    public MissionItemEventHolder(View itemView) {
        super(itemView);
        event_date = itemView.findViewById(R.id.mission_event_date);
        event_type = itemView.findViewById(R.id.mission_event_type);
        //volunteer_uid = itemView.findViewById(R.id.volunteer_uid);
        volunteer_name = itemView.findViewById(R.id.mission_event_volunteer_name);
        mission_name = itemView.findViewById(R.id.mission_name);
        phone = itemView.findViewById(R.id.mission_event_phone);

        /*
        Might want to be able to click a row and do something.  Just don't know what we
        want to do right now (10/25/17)

        // https://stackoverflow.com/a/41629505
        //listener set on ENTIRE ROW, you may set on individual components within a row.
        itemView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mClickListener.onItemClick(v, getAdapterPosition());
            }
        });
        */
    }

    public void setMissionItemEvent(final MissionItemEvent missionItemEvent) {
        // set TextView elements here
        event_date.setText(missionItemEvent.getEvent_date());
        event_type.setText(missionItemEvent.getEvent_type());
        //volunteer_uid.setText("Created on "+missionItemEvent.getMission_create_date());
        volunteer_name.setText(missionItemEvent.getVolunteer_name());
        mission_name.setText(missionItemEvent.getMission_name());
        phone.setText(missionItemEvent.getPhone());
    }

    // https://stackoverflow.com/a/41629505
    public void setOnClickListener(MissionItemEventHolder.ClickListener clickListener){
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