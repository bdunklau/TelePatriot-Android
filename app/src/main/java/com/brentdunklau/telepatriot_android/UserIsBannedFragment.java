package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

/**
 * Created by bdunklau on 1/11/18.
 */

public class UserIsBannedFragment extends AdminFragment  {

    //View myView;
    private FragmentManager fragmentManager;
    private Fragment back;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.user_is_banned_fragment, container, false);
        setUI();
        return myView;
    }

    private void setUI() {
        updateLabel(R.id.text_name, user.getName());
        updateLabel(R.id.text_email, user.getEmail());
    }

    public void setFragmentManager(FragmentManager fragmentManager, Fragment back) {
        this.fragmentManager = fragmentManager;
        this.back = back;
    }
}
