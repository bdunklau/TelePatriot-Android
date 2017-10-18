package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.support.v7.widget.LinearLayoutManager;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;

import com.brentdunklau.telepatriot_android.util.PhoneCampaignCreated;
import com.brentdunklau.telepatriot_android.util.User;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

/**
 * Created by bdunklau on 10/13/2017.
 */

public class NewPhoneCampaignFragment extends Fragment {

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

        submit_new_phone_campaign.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                DatabaseReference ref = FirebaseDatabase.getInstance().getReference("missions");
                PhoneCampaignCreated missionCreated = new PhoneCampaignCreated(User.getInstance(), edit_mission_name.getText().toString(), edit_new_phone_campaign.getText().toString());
                //ref.push().child("mission_events").push().setValue(missionCreated);


                ref.push().setValue(missionCreated).addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {

                        FragmentManager fragmentManager = getFragmentManager();
                        FragmentTransaction t1 = fragmentManager.beginTransaction();
                        FragmentTransaction t2 = t1.replace(R.id.content_frame, new MissionDetailsFragment());
                        t2.commit();
                    }
                });
            }
        });


        setHasOptionsMenu(true);
        return myView;
    }

}
