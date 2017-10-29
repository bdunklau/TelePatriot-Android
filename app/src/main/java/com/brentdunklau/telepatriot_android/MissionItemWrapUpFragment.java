package com.brentdunklau.telepatriot_android;

import android.app.FragmentManager;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;

import com.brentdunklau.telepatriot_android.util.User;

/**
 * Created by bdunklau on 10/28/17.
 */

public class MissionItemWrapUpFragment extends BaseFragment {

    private String TAG = "MissionItemWrapUpFrag";
    private EditText edit_text_notes;
    private Button button_mission_item_wrap_up;
    private Spinner mission_item_outcome;
    View myView;

    @Nullable
    @Override
    /**
     * ALL mission items are under the /mission_items node.  So now, all we have to do for the volunteers is do a
     * limitToFirst(1) query for the mission that has the following criteria:
     * active_and_accomplished: true_new
     *
     *
     */
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.mission_item_wrap_up_fragment, container, false);

        edit_text_notes = myView.findViewById(R.id.edit_text_notes);
        button_mission_item_wrap_up = myView.findViewById(R.id.button_mission_item_wrap_up);
        mission_item_outcome = myView.findViewById(R.id.mission_item_outcome);

        button_mission_item_wrap_up.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                submitWrapUp(v);
            }
        });

        setHasOptionsMenu(true);
        return myView;
    }


    private void submitWrapUp(View v) {
        User.getInstance().submitWrapUp(mission_item_outcome.getSelectedItem()+"", edit_text_notes.getText()+"");
        gotoFragment(new GetAMissionFragment());
    }


    @Override
    public void onResume() {
        doSuper = false; // to make sure we don't overwrite the active_and_accomplished attribute that is now true_complete
                         // see super.onResume()
        super.onResume();
        Log.d(TAG, "onResume");
    }

}
