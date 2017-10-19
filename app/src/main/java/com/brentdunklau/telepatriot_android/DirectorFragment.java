package com.brentdunklau.telepatriot_android;

import android.app.AlertDialog;
import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.content.DialogInterface;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

/**
 * Created by bdunklau on 10/11/17.
 */

public class DirectorFragment extends Fragment {

    Button btnNewPhoneCampaign;
    Button btnMyActiveMissions;
    Button btnAllActiveMissions;
    Button btnAllMyMissions;
    Button btnAllMissions;

    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.director_fragment, container, false);

        btnNewPhoneCampaign = myView.findViewById(R.id.button_new_phone_campaign);
        btnMyActiveMissions = myView.findViewById(R.id.button_my_active_missions);
        btnAllActiveMissions = myView.findViewById(R.id.button_all_active_missions);
        btnAllMyMissions = myView.findViewById(R.id.button_all_my_missions);
        btnAllMissions = myView.findViewById(R.id.button_all_missions);

        wireUp(btnNewPhoneCampaign, new NewPhoneCampaignFragment());
        wireUp(btnMyActiveMissions, new MyActiveMissionsFragment());
        wireUp(btnAllActiveMissions, new AllActiveMissionsFragment());
        wireUp(btnAllMyMissions, new AllMyMissionsFragment());
        wireUp(btnAllMissions, new AllMissionsFragment());

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
            t.commit();
        } catch(Throwable t) {
            // TODO show alert dialog or  something - not this
            t.printStackTrace();
        }
    }


    protected void nothingYetDialog(Button button) {
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                AlertDialog.Builder builder = new AlertDialog.Builder(myView.getContext());
                builder.setTitle("Nothing Yet");
                builder.setMessage("Nothing here yet\nBut we're working on it");
                builder.setPositiveButton("OK", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialogInterface, int i) {
                    }
                });
                builder.show();
            }
        });


    }
}
