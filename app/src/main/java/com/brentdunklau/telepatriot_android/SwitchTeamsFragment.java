package com.brentdunklau.telepatriot_android;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

/**
 * Created by bdunklau on 12/15/2017.
 */

public class SwitchTeamsFragment extends BaseFragment {

    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.switch_teams_fragment, container, false);

        setHasOptionsMenu(true);
        return myView;
    }
}
