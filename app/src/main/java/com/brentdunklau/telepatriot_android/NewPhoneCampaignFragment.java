package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v7.widget.LinearLayoutManager;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;

import com.brentdunklau.telepatriot_android.util.PhoneCampaignCreated;
import com.brentdunklau.telepatriot_android.util.User;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Created by bdunklau on 10/13/2017.
 */

public class NewPhoneCampaignFragment extends BaseFragment {

    Button submit_new_phone_campaign;
    EditText edit_new_phone_campaign, edit_mission_name;
    private LinearLayoutManager mLinearLayoutManager;

    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.new_phone_campaign_fragment, container, false);

        submit_new_phone_campaign = myView.findViewById(R.id.submit_new_phone_campaign);
        edit_new_phone_campaign = myView.findViewById(R.id.edit_new_phone_campaign);
        edit_mission_name = myView.findViewById(R.id.edit_mission_name);

        // TODO get rid of this test code

        edit_mission_name.setText("Montana Mission "+new SimpleDateFormat("h:mm").format(new Date()));
        edit_new_phone_campaign.setText("https://docs.google.com/spreadsheets/d/1WXn8VMIfgIhzNNvx5NFEJmGUCsMGrufFU9r_743ukGs/edit#gid=0");

        submit_new_phone_campaign.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                DatabaseReference ref = FirebaseDatabase.getInstance().getReference("missions");
                boolean active = false;
                PhoneCampaignCreated missionCreated = new PhoneCampaignCreated(User.getInstance(), edit_mission_name.getText().toString(), edit_new_phone_campaign.getText().toString(), active);
                //ref.push().child("mission_events").push().setValue(missionCreated);

                InputMethodManager imm = (InputMethodManager) myView.getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
                imm.hideSoftInputFromWindow(submit_new_phone_campaign.getWindowToken(), 0);

                ref.push().setValue(missionCreated).addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {

                        FragmentManager fragmentManager = getFragmentManager();
                        FragmentTransaction t1 = fragmentManager.beginTransaction();
                        FragmentTransaction t2 = t1.replace(R.id.content_frame, new AllMyMissionsFragment());
                        t2.commit();
                    }
                });
            }
        });


        setHasOptionsMenu(true);
        return myView;
    }

}
