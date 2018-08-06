package com.brentdunklau.telepatriot_android;

import android.app.AlertDialog;
import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.content.DialogInterface;
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
 * Created by bdunklau on 10/11/17.
 */

public class DirectorFragment extends BaseFragment {

    Button button_missions;
    Button button_teams;

    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.director_fragment, container, false);

        button_missions = myView.findViewById(R.id.button_missions);
        button_teams = myView.findViewById(R.id.button_teams);

        MissionsFragment missionsFragment = new MissionsFragment();
        TeamsFragment teamsFragment = new TeamsFragment();

        wireUp(button_missions, missionsFragment);
        wireUp(button_teams, teamsFragment);

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

//    private void showFragment(Fragment fragment) {
//        FragmentManager fragmentManager = getFragmentManager();
//        try {
//            FragmentTransaction t = fragmentManager.beginTransaction();
//            t.replace(R.id.content_frame, fragment);
//            t.addToBackStack(fragment.getClass().getName());
//            t.commit();
//        } catch(Throwable t) {
//            // TODO show alert dialog or  something - not this
//            t.printStackTrace();
//        }
//    }



    @Override
    public void onCreateOptionsMenu(Menu menu, MenuInflater inflater) {
        inflater.inflate(R.menu.director_menu, menu);  // Use filter.xml from step 1
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        FragmentManager fragmentManager = getFragmentManager();
        switch(item.getItemId()) {
            case(R.id.menu_missions):
                Fragment fragment = new MissionsFragment();
                fragmentManager.beginTransaction().replace(R.id.content_frame, fragment).addToBackStack(fragment.getClass().getName()).commit();
                return true;
            case(R.id.menu_teams):
                fragment = new TeamsFragment();
                fragmentManager.beginTransaction()
                        .replace(R.id.content_frame, fragment)
                        .addToBackStack(fragment.getClass().getName())
                        .commit();
                return true;
            default: return super.onOptionsItemSelected(item);
        }
    }
}
