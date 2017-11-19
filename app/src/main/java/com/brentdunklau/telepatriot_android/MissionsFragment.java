package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

/**
 * Created by bdunklau on 10/19/17.
 */

public class MissionsFragment extends DirectorFragment {

    Button btnNewPhoneCampaign;
    Button btnMyActiveMissions;
    Button btnAllActiveMissions;
    Button btnAllMyMissions;
    Button btnAllMissions;
    Button btnAllActivity;

    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.missions_fragment, container, false);

        btnNewPhoneCampaign = myView.findViewById(R.id.button_new_phone_campaign);
        btnMyActiveMissions = myView.findViewById(R.id.button_my_active_missions);
        btnAllActiveMissions = myView.findViewById(R.id.button_all_active_missions);
        btnAllMyMissions = myView.findViewById(R.id.button_all_my_missions);
        btnAllMissions = myView.findViewById(R.id.button_all_missions);
        btnAllActivity = myView.findViewById(R.id.button_all_activity);

        wireUp(btnNewPhoneCampaign, new NewPhoneCampaignFragment());
        wireUp(btnMyActiveMissions, new MyActiveMissionsFragment());
        wireUp(btnAllActiveMissions, new AllActiveMissionsFragment());
        wireUp(btnAllMyMissions, new AllMyMissionsFragment());
        wireUp(btnAllMissions, new AllMissionsFragment());
        wireUp(btnAllActivity, new AllActivityFragment());

        setHasOptionsMenu(true);
        return myView;
    }

    private void wireUp(Button button, final Fragment fragment) {
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                showFragment(fragment);
            }
        });
    }

    private void showFragment(Fragment fragment) {
        FragmentManager fragmentManager = getFragmentManager();
        try {
            FragmentTransaction t = fragmentManager.beginTransaction();
            t.replace(R.id.content_frame, fragment);
            t.addToBackStack(fragment.getClass().getName());
            t.commit();
        } catch(Throwable t) {
            // TODO show alert dialog or  something - not this
            t.printStackTrace();
        }
    }

}
