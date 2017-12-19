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

    boolean containsNamesAndNumbers, linksToOtherSpreadsheets;
    Button submit_new_phone_campaign;
    EditText edit_new_phone_campaign, edit_mission_name;
    private LinearLayoutManager mLinearLayoutManager;

    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.new_phone_campaign_fragment, container, false);

        Bundle b = this.getArguments();
        if(b.getString("spreadsheetType", "contains names and numbers").equalsIgnoreCase("contains names and numbers"))
            containsNamesAndNumbers = true;
        else linksToOtherSpreadsheets = true;

        submit_new_phone_campaign = myView.findViewById(R.id.submit_new_phone_campaign);
        edit_new_phone_campaign = myView.findViewById(R.id.edit_new_phone_campaign);
        edit_mission_name = myView.findViewById(R.id.edit_mission_name);

        // TODO get rid of this test code
        //edit_mission_name.setText("Montana Mission "+new SimpleDateFormat("h:mm").format(new Date()));
        //edit_new_phone_campaign.setText("https://docs.google.com/spreadsheets/d/1WXn8VMIfgIhzNNvx5NFEJmGUCsMGrufFU9r_743ukGs/edit#gid=0");

        submit_new_phone_campaign.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                boolean dataMissing = edit_mission_name == null || edit_mission_name.getText().toString().trim().equalsIgnoreCase("")
                        || edit_new_phone_campaign == null || edit_new_phone_campaign.getText().toString().trim().equalsIgnoreCase("");

                if(dataMissing)
                    return; // basically the same thing as making the button disable.  This way is just easier to code.


                String team = User.getInstance().getCurrentTeam().getTeam_name();
                String missionNode = containsNamesAndNumbers ? "missions" : "master_missions";
                DatabaseReference ref = FirebaseDatabase.getInstance().getReference("/teams/"+team+"/"+missionNode);
                boolean active = false;

                PhoneCampaignCreated missionCreated = new PhoneCampaignCreated(User.getInstance(), edit_mission_name.getText().toString(), edit_new_phone_campaign.getText().toString(), active);

                InputMethodManager imm = (InputMethodManager) myView.getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
                imm.hideSoftInputFromWindow(submit_new_phone_campaign.getWindowToken(), 0);

                ref.push().setValue(missionCreated).addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        Fragment fragment = new AllMyMissionsFragment();
                        FragmentManager fragmentManager = getFragmentManager();
                        FragmentTransaction t1 = fragmentManager.beginTransaction();
                        FragmentTransaction t2 = t1.replace(R.id.content_frame, fragment);
                        // not adding to back stack here because that would send the user back to the page
                        // where create the mission.  Not sure if I really want to do that.
                        t2.commit();
                    }
                });
            }
        });


        setHasOptionsMenu(true);
        return myView;
    }

}
