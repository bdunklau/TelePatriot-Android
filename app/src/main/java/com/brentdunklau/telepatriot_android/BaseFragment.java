package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.util.Log;

import com.brentdunklau.telepatriot_android.util.User;

/**
 * Created by bdunklau on 10/28/17.
 */

public class BaseFragment extends Fragment {

    private String TAG = "BaseFragment";
    protected boolean doSuper = true;

    // MyMissionFragment overrides this.  So when any other fragment resumes,
    // we release the user's currently assigned mission item back to the queue
    // for others to work
    @Override
    public void onResume() {
        super.onResume();
        Log.d(TAG, "onResume");
        handleCurrentMissionItem();
    }

    @Override
    public void onPause() {
        super.onPause();
        Log.d(TAG, "onPause");
        handleCurrentMissionItem();
    }

    @Override
    public void onStop() {
        super.onStop();
        Log.d(TAG, "onStop");
        handleCurrentMissionItem();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        Log.d(TAG, "onDestroyView");
        handleCurrentMissionItem();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "onDestroy");
        handleCurrentMissionItem();
    }

    private boolean userInTheMiddleOfSomething() {
        boolean hasMission = User.getInstance().getCurrentMissionItem() != null;
        return hasMission;
    }

    private void unassignMissionItem() {
        User.getInstance().unassignCurrentMissionItem();
    }

    private void handleCurrentMissionItem() {
        if(!doSuper)
            return;

        if(userInTheMiddleOfSomething()) {
            // alert the user that he should skip/dismiss the current mission?
            // why do that?  why can't we just un-assign the mission FOR them?
            Log.d(TAG, "un-assigning mission item");
            unassignMissionItem();
        }
    }

    protected void gotoFragment(Fragment fragment) {
        getFragmentManager().beginTransaction().replace(R.id.content_frame, fragment).commit();
    }
}
