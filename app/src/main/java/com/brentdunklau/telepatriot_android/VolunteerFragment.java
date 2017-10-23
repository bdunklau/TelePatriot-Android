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

public class VolunteerFragment extends Fragment {

    Button button_test_call, button_test_camera, button_test_video;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.volunteer_fragment, container, false);

        button_test_call = myView.findViewById(R.id.button_test_call);
        button_test_camera = myView.findViewById(R.id.button_test_camera);
        button_test_video = myView.findViewById(R.id.button_test_video);

        wireUp(button_test_call, new ConfCallFragment());
        wireUp(button_test_camera, new CameraFragment());
        wireUp(button_test_video, new VideoFragment());

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
