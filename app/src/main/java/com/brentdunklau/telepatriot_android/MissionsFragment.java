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
import android.widget.TextView;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 10/19/17.
 */

public class MissionsFragment extends DirectorFragment {

    TextView removed;
    TextView header_missions_list;
    Button btnNewPhoneCampaign;
    Button btnAllMissions;
    Button btnAllActivity;

    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.missions_fragment, container, false);

        FirebaseDatabase.getInstance().getReference("administration/configuration/get_roles_from").addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                String get_roles_from = dataSnapshot.getValue(String.class);
                if(get_roles_from == null || get_roles_from.equalsIgnoreCase("telepatriot")) {
                    hideUI();
                    showLegacyUI();
                }
                else {
                    showUI();
                    hideLegacyUI();
                }
            }

            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });


        //setHasOptionsMenu(true);
        return myView;
    }

    private void showLegacyUI() {

        header_missions_list = myView.findViewById(R.id.header_missions_list);
        btnNewPhoneCampaign = myView.findViewById(R.id.button_new_phone_campaign);
        btnAllMissions = myView.findViewById(R.id.button_all_missions);
        btnAllActivity = myView.findViewById(R.id.button_all_activity);
        header_missions_list.setVisibility(View.VISIBLE);
        btnNewPhoneCampaign.setVisibility(View.VISIBLE);
        btnAllMissions.setVisibility(View.VISIBLE);
        btnAllActivity.setVisibility(View.VISIBLE);

        wireUp(btnNewPhoneCampaign, new ChooseSpreadsheetTypeFragment());
        wireUp(btnAllMissions, new AllMissionsFragment());
        wireUp(btnAllActivity, new AllActivityFragment());
    }

    private void hideLegacyUI() {

        header_missions_list = myView.findViewById(R.id.header_missions_list);
        btnNewPhoneCampaign = myView.findViewById(R.id.button_new_phone_campaign);
        btnAllMissions = myView.findViewById(R.id.button_all_missions);
        btnAllActivity = myView.findViewById(R.id.button_all_activity);
        header_missions_list.setVisibility(View.GONE);
        btnNewPhoneCampaign.setVisibility(View.GONE);
        btnAllMissions.setVisibility(View.GONE);
        btnAllActivity.setVisibility(View.GONE);
    }

    private void showUI() {

        removed = myView.findViewById(R.id.removed);
        removed.setVisibility(View.VISIBLE);
    }

    private void hideUI() {

        removed = myView.findViewById(R.id.removed);
        removed.setVisibility(View.GONE);
    }

    private void wireUp(Button button, final Fragment fragment) {
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                showFragment(fragment);
            }
        });
    }

}
