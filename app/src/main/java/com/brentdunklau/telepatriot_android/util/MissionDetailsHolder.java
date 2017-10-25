package com.brentdunklau.telepatriot_android.util;

import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;

/**
 * Created by bdunklau on 10/24/17.
 */

public class MissionDetailsHolder extends RecyclerView.ViewHolder {

    private MissionDetails missionDetails;
    private TextView mission_item_name, mission_item_phone;

    public MissionDetailsHolder(View itemView) {
        super(itemView);
        // LESSON LEARNED HERE - FORGOT TO DO THIS.
        // THE APP KEPT CRASHING - NO IDEA WHY UNTIL I REALLY
        // STARTING COMPARING THIS WITH THE UserHolder CLASS
        mission_item_name = itemView.findViewById(R.id.mission_item_name);
        mission_item_phone = itemView.findViewById(R.id.mission_item_phone);
    }

    public void setMissionDetails(MissionDetails missionDetails) {
        this.missionDetails = missionDetails;
        mission_item_name.setText(missionDetails.getName());
        mission_item_phone.setText(missionDetails.getPhone());
    }

    // https://stackoverflow.com/a/41629505
    private MissionDetailsHolder.ClickListener mClickListener;


    // https://stackoverflow.com/a/41629505
    public void setOnClickListener(MissionDetailsHolder.ClickListener clickListener){
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
