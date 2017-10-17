package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.os.Bundle;
import android.os.Handler;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

/**
 * Created by bdunklau on 10/13/2017.
 */

public class NewPhoneCampaignFragment extends Fragment {

    Button submit_new_phone_campaign;
    Button paste_new_phone_campaign; // just for testing because we can't cut and paste in emulator REMOVE
    EditText edit_new_phone_campaign;

    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.new_phone_campaign_fragment, container, false);

        submit_new_phone_campaign = myView.findViewById(R.id.submit_new_phone_campaign);
        paste_new_phone_campaign = myView.findViewById(R.id.paste_new_phone_campaign);
        edit_new_phone_campaign = myView.findViewById(R.id.edit_new_phone_campaign);

        paste_new_phone_campaign.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Runnable r = new Runnable() {
                    public void run() {
                        edit_new_phone_campaign.setText("https://docs.google.com/spreadsheets/d/1WXn8VMIfgIhzNNvx5NFEJmGUCsMGrufFU9r_743ukGs/edit#gid=1330860040");
                    }
                };
                Handler h = new Handler();
                h.post(r);
            }
        });

        submit_new_phone_campaign.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                DatabaseReference ref = FirebaseDatabase.getInstance().getReference("missions");
                ref.push().child("url").setValue(edit_new_phone_campaign.getText().toString());
            }
        });



        setHasOptionsMenu(true);
        return myView;
    }

}
