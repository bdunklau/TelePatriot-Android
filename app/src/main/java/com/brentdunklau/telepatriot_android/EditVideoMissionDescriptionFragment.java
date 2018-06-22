package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.support.annotation.Nullable;

import com.brentdunklau.telepatriot_android.BaseFragment;

/**
 * Created by bdunklau on 6/21/18.
 */

public class EditVideoMissionDescriptionFragment extends BaseFragment {

    TextView cancel, save;
    Fragment back;
    FragmentManager fragmentManager;
    View myView;

    public EditVideoMissionDescriptionFragment() {}

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.edit_video_mission_description_fragment, container, false);

        cancel = myView.findViewById(R.id.cancel);
        save = myView.findViewById(R.id.save);

        cancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                gotoFragment(back);
            }
        });

        //setHasOptionsMenu(true);
        return myView;
    }

    public void setBack(android.app.Fragment back) {
        this.back = back;
    }

}
