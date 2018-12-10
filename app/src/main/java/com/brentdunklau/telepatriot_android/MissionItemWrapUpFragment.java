package com.brentdunklau.telepatriot_android;

import android.content.Context;
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

    private QuitListener quitListener;
    private String TAG = "MissionItemWrapUpFrag";
    private EditText edit_text_notes;
    private Button button_submit_get_another, button_submit_and_quit;
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
        button_submit_get_another = myView.findViewById(R.id.button_submit_get_another);
        button_submit_and_quit = myView.findViewById(R.id.button_submit_and_quit);
        mission_item_outcome = myView.findViewById(R.id.mission_item_outcome);

        button_submit_get_another.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                submitWrapUpAndGetAnother(v);
            }
        });

        button_submit_and_quit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                submitWrapUpAndQuit(v);
            }
        });

        //setHasOptionsMenu(true);
        return myView;
    }


    public interface QuitListener {
        public void quit();
    }


    @Override
    public void onAttach(Context context) {
        super.onAttach(context);
        try {
            quitListener = (QuitListener) context; // basically, this is MainActivity
        }
        catch(ClassCastException e) {
            // TODO don't do this
            e.printStackTrace();
        }
    }

    private void submitWrapUpAndGetAnother(View v) {
        User.getInstance().submitWrapUp(mission_item_outcome.getSelectedItem()+"", edit_text_notes.getText()+"");
        gotoFragment(new MyMissionFragment());
    }


    private void submitWrapUpAndQuit(View v) {
        User.getInstance().submitWrapUp(mission_item_outcome.getSelectedItem()+"", edit_text_notes.getText()+"");
        if(quitListener != null)
            quitListener.quit(); // basically, this is MainActivity.signOut().  See onAttach()
    }


    @Override
    public void onResume() {
        doSuper = false; // to make sure we don't overwrite the active_and_accomplished attribute that is now true_complete
                         // see super.onResume()
        super.onResume();
        Log.d(TAG, "onResume");
    }

}
