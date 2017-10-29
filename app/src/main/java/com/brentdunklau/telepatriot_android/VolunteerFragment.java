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

import com.brentdunklau.telepatriot_android.test.TestVolunteerFragment;

/**
 * Created by bdunklau on 10/11/17.
 */

public class VolunteerFragment extends BaseFragment {

    Button button_get_a_mission, button_test_volunteer_screen;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.volunteer_fragment, container, false);

        button_get_a_mission = myView.findViewById(R.id.button_get_a_mission);
        button_test_volunteer_screen = myView.findViewById(R.id.button_test_volunteer_screen);

        // Can't generalize this because we are going to do a query when the user clicks
        // the Get A Mission button.  We are going to query now, not when the user reaches
        // the Get A Mission screen.  By that time, it's too late
        // So we'll query here and pass the MissionDetail as an arg to the the GetAMissionFragment

        /**
         * how about - query for the first row where assignee is none
         */

        wireUp(button_get_a_mission, new GetAMissionFragment());
        wireUp(button_test_volunteer_screen, new TestVolunteerFragment());


                /*
                Firebase transactions for concurrency/record locking

                    -> https://firebase.google.com/docs/database/android/read-and-write#save_data_as_transactions


                Firebase upvotesRef = new Firebase("https://docs-examples.firebaseio.com/android/saving-data/fireblog/posts/-JRHTHaIs-jNPLXOQivY/upvotes");
                upvotesRef.runTransaction(new Transaction.Handler() {
                    @Override
                    public Transaction.Result doTransaction(MutableData currentData) {
                        if(currentData.getValue() == null) {
                            currentData.setValue(1);
                        } else {
                            currentData.setValue((Long) currentData.getValue() + 1);
                        }
                        return Transaction.success(currentData); //we can also abort by calling Transaction.abort()
                    }
                    @Override
                    public void onComplete(FirebaseError firebaseError, boolean committed, DataSnapshot currentData) {
                        //This method will be called once with the results of the transaction.
                    }
                });
                */




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
