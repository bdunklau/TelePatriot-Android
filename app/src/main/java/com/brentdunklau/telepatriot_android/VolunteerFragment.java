package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

/**
 * Created by bdunklau on 10/11/17.
 */

public class VolunteerFragment extends BaseFragment {

    Button button_get_a_mission, button_test_volunteer_screen;
    View myView;


    /**
     * REPLACED THIS WHOLE CLASS.  FROM NOW ON, WE ARE CALLING "GET YOUR MISSION" FROM MainActivity
     * SEE ALSO activity_main_drawer.xml
     */
    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.volunteer_fragment, container, false);

        button_get_a_mission = myView.findViewById(R.id.button_get_a_mission);

        wireUp(button_get_a_mission, new MyMissionFragment());

        /*****
         * Probably should put this in a separate area just for developers
         button_test_volunteer_screen = myView.findViewById(R.id.button_test_volunteer_screen);
         wireUp(button_test_volunteer_screen, new TestVolunteerFragment());
         *****/

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
}
