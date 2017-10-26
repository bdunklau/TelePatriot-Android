package com.brentdunklau.telepatriot_android.util;

import android.os.Handler;
import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;

/**
 * Created by bdunklau on 10/24/17.
 */

public class MissionDetailHolder extends RecyclerView.ViewHolder {

    //private MissionDetail missionDetail; // do we really need this?
    private TextView mission_item_name, mission_item_phone;

    public MissionDetailHolder(View itemView) {
        super(itemView);
        // LESSON LEARNED HERE - FORGOT TO DO THIS.
        // THE APP KEPT CRASHING - NO IDEA WHY UNTIL I REALLY
        // STARTING COMPARING THIS WITH THE UserHolder CLASS
        mission_item_name = itemView.findViewById(R.id.mission_item_name);
        mission_item_phone = itemView.findViewById(R.id.mission_item_phone);
    }

    public void setMissionDetail(final MissionDetail missionDetail) {
        //this.missionDetail = missionDetail;
        mission_item_name.setText(missionDetail.getName());
        mission_item_phone.setText(missionDetail.getPhone());
    }

    // https://stackoverflow.com/a/41629505
    private MissionDetailHolder.ClickListener mClickListener;


    // https://stackoverflow.com/a/41629505
    public void setOnClickListener(MissionDetailHolder.ClickListener clickListener){
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
