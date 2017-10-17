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

public class DirectorFragment extends Fragment {

    Button btnNewPhoneCampaign;

    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.director_fragment, container, false);

        btnNewPhoneCampaign = myView.findViewById(R.id.button_new_phone_campaign);
        btnNewPhoneCampaign.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                gotoNewPhoneCampaignFragment(); 
            }
        });

        setHasOptionsMenu(true);
        return myView;
    }

    private void gotoNewPhoneCampaignFragment() {
        FragmentManager fragmentManager = getFragmentManager();
        try {
            FragmentTransaction t = fragmentManager.beginTransaction();
            t.replace(R.id.content_frame, new NewPhoneCampaignFragment());
            t.commit();
        } catch(Throwable t) {
            t.printStackTrace();
        }
    }
}
