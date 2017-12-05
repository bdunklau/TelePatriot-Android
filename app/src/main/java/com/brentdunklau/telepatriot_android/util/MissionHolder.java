package com.brentdunklau.telepatriot_android.util;

import android.os.Handler;
import android.support.v7.widget.RecyclerView;
import android.support.v7.widget.SwitchCompat;
import android.view.View;
import android.widget.CompoundButton;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import org.w3c.dom.Text;

/**
 * Created by bdunklau on 10/18/2017.
 */

public class MissionHolder extends RecyclerView.ViewHolder {

    TextView mission_name, mission_type, mission_create_date, mission_created_by, names_and_numbers_loaded;

    private SwitchCompat activeSwitch;

    // https://stackoverflow.com/a/41629505
    private MissionHolder.ClickListener mClickListener;


    public MissionHolder(View itemView) {
        super(itemView);
        mission_name = itemView.findViewById(R.id.mission_name);
        mission_type = itemView.findViewById(R.id.mission_type);
        mission_create_date = itemView.findViewById(R.id.mission_create_date);
        mission_created_by = itemView.findViewById(R.id.mission_created_by);
        names_and_numbers_loaded = itemView.findViewById(R.id.names_and_numbers_loaded);


        activeSwitch = itemView.findViewById(R.id.switch_active);
        activeSwitch.setSwitchPadding(10);

        // https://stackoverflow.com/a/41629505
        //listener set on ENTIRE ROW, you may set on individual components within a row.
        itemView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mClickListener.onItemClick(v, getAdapterPosition());
            }
        });
    }

    public void setMission(final Mission mission, final DatabaseReference ref) {
        // set TextView elements here
        mission_name.setText(mission.getMission_name());
        mission_type.setText(mission.getMission_type());
        mission_create_date.setText("Created on "+mission.getMission_create_date());
        mission_created_by.setText("By "+mission.getName());
        names_and_numbers_loaded.setText("Loaded "+mission.getCount_items_imported() + " of " + mission.getCount_in_spreadsheet()+" names/numbers");

        activeSwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton compoundButton, boolean b) {
                activeSwitch.setText(b ? "Active" : "Inactive");
                mission.setActive(b);
                mission.setUid_and_active(mission.getUid()+"_"+b);
                ref.child("active").setValue(b);
                ref.child("uid_and_active").setValue(mission.getUid()+"_"+b);
            }
        });

        setSwitch(mission.getActive(), activeSwitch);
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

    private void setSwitch(final boolean value, final SwitchCompat switchCompat) {
        Handler h = new Handler();
        h.post(new Runnable() {
            @Override
            public void run() {
                switchCompat.setChecked(value);
                switchCompat.setText(value ? "Active" : "Inactive");
            }
        });
    }
}
