package com.brentdunklau.telepatriot_android.citizenbuilder;

import android.app.Activity;
import android.app.Fragment;
import android.app.FragmentManager;
import android.app.ProgressDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.text.Html;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.BaseFragment;
import com.brentdunklau.telepatriot_android.R;
import com.brentdunklau.telepatriot_android.util.AccountStatusEvent;
import com.brentdunklau.telepatriot_android.util.MissionDetail;
import com.brentdunklau.telepatriot_android.util.TeamIF;
import com.brentdunklau.telepatriot_android.util.User;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Created by bdunklau on 11/23/18.
 */

public class MyCBMissionFragment extends BaseFragment
//implements AccountStatusEvent.Listener
{

//    private TextView heading_mission_progress;
    private TextView mission_name, mission_description, mission_script;
    private Button button_call_person1;
    private Button button_call_person2;
    private String citizen_builder_domain;
    private String citizen_builder_api_key_name;
    private String citizen_builder_api_key_value;
    private String mission_person_id;
    private String mission_id;
    private String mission_phone;

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
        myView = inflater.inflate(R.layout.my_cb_mission_fragment, container, false);

        mission_name = myView.findViewById(R.id.heading_mission_name);
//        heading_mission_progress = myView.findViewById(R.id.heading_mission_progress);
        mission_description = myView.findViewById(R.id.mission_description);
        mission_script = myView.findViewById(R.id.mission_script);
        button_call_person1 = myView.findViewById(R.id.button_call_person1);
        button_call_person2 = myView.findViewById(R.id.button_call_person2);

        citizen_builder_domain = this.getArguments().getString("citizen_builder_domain");
        citizen_builder_api_key_name = this.getArguments().getString("citizen_builder_api_key_name");
        citizen_builder_api_key_value = this.getArguments().getString("citizen_builder_api_key_value");

        // just start out this way by default so we don't get the ugly screen flash
        // that shows the user buttons and labels that don't make sense
        indicateNoMissionsAvailable();

        getMission_fromCitizenBuilder();

        return myView;
    }

    private void getMission_fromCitizenBuilder() {
        TeamIF team = User.getInstance().getCurrentTeam();
        if(team == null) return;

        new GetCBMissionTask().execute(citizen_builder_domain, citizen_builder_api_key_name, citizen_builder_api_key_value);
    }

    // called when we come back from a call
    @Override
    public void onResume() {
        doSuper = false; // see BaseFragment
        super.onResume();
        // what do we do here?
        // when does this get called?  When the user returns from a call
        //      but also when the user returns here from anywhere
        // but we DO now have the current mission item stored in the User object
        // If we are resuming on a mission that is  active_and_accomplished: true_complete,
        // then we need to send the user on to a fragment where they can enter notes on the
        // call
//        CBMissionDetail cbMissionDetail = User.getInstance().getCurrentCBMissionItem();
//        if (cbMissionDetail == null)
//            return;
//
//        if(cbMissionDetail.isCompleted()) {
//            FragmentManager fragmentManager = getFragmentManager();
//            Fragment fragment = new CBMissionItemWrapUpFragment();
//            Bundle bundle = new Bundle();
//            bundle.putString("citizen_builder_domain", citizen_builder_domain);
//            bundle.putString("citizen_builder_api_key_name", citizen_builder_api_key_name);
//            bundle.putString("citizen_builder_api_key_value", citizen_builder_api_key_value);
//            fragment.setArguments(bundle);
//            fragmentManager.beginTransaction().replace(R.id.content_frame, fragment).addToBackStack(fragment.getClass().getName()).commit();
//        }
    }

    @Override
    public void onPause() {
        doSuper = false; // see BaseFragment
        super.onPause();
        Log.d("MyCBMissionFragment", "onPause");
    }

    @Override
    public void onStop() {
        doSuper = false; // see BaseFragment
        super.onStop();
        Log.d("MyCBMissionFragment", "onStop");
    }

    @Override
    public void onDestroyView() {
        doSuper = false; // see BaseFragment
        super.onDestroyView();
        Log.d("MyCBMissionFragment", "onDestroyView");
    }

    @Override
    public void onDestroy() {
        doSuper = false; // see BaseFragment
        super.onDestroy();
        Log.d("MyCBMissionFragment", "onDestroy");
    }

    private void setFieldsVisible() {
        button_call_person1.setVisibility(View.VISIBLE);
        button_call_person2.setVisibility(View.GONE); // temporarily setting to GONE always because 3way calling isn't supported yet by CB
        mission_name.setVisibility(View.VISIBLE);
        mission_script.setVisibility(View.VISIBLE);
        myView.findViewById(R.id.heading_mission_description).setVisibility(View.VISIBLE);
        myView.findViewById(R.id.heading_mission_script).setVisibility(View.VISIBLE);
    }

    private void indicateNoMissionsAvailable() {
        // hide the call buttons
        button_call_person1.setVisibility(View.GONE);
        button_call_person2.setVisibility(View.GONE);
        // hide the description and the script fields
        mission_name.setVisibility(View.GONE);
        mission_script.setVisibility(View.GONE);
        myView.findViewById(R.id.heading_mission_description).setVisibility(View.GONE);
        myView.findViewById(R.id.heading_mission_script).setVisibility(View.GONE);

        // leave the switch teams button visible

        // rather than hide the mission description TextView, we'll repurpose
        // it to show a message to the user indicating that there are no missions
        // in this team at this time.
        // This is the same text you'll see on the iPhone version - MyMissionViewController
        mission_description.setText("No missions for this team");
    }

    private void wireUp(Button button, final CBMissionDetail missionDetail) {
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                call(missionDetail);
            }
        });
    }

//    private void prepareFor3WayCallIfNecessary(CBMissionDetail missionDetail, Button button) {
//        if (missionDetail.getName2() != null && missionDetail.getPhone2() != null) {
//            // we have a 3way call scenario
//            button.setText(missionDetail.getName2() + " " + missionDetail.getPhone2());
//            wireUp2(button, missionDetail);
//        } else {
//            // not a 3way call scenario, so hide the second phone button
//            button.setVisibility(View.GONE);
//        }
//    }


    /**
     * @see com.brentdunklau.telepatriot_android.util.PhoneBroadcastReceiver.handleCall() - that's where the
     * logic is that fires when the call ends
     * @param missionDetail
     */
    private void call(CBMissionDetail missionDetail) {
        checkPermission();
        Intent intent = new Intent(Intent.ACTION_CALL);
        intent.setData(Uri.parse("tel:" + missionDetail.getPhone()));
        startActivity(intent);
    }

    // call the name2/phone2 person
    private void call2(MissionDetail missionDetail) {
        checkPermission();
        Intent intent = new Intent(Intent.ACTION_CALL);
        intent.setData(Uri.parse("tel:" + missionDetail.getPhone2()));
        startActivity(intent);
    }


    // Consider using the similar method in Util *************************
    // I moved these 2 methods over to LauncherActivity because, in production, I'm getting
    // an app crash on the very first phone call.  Thinking that I'm requesting permission
    // too late ... ?
    // https://developer.android.com/training/permissions/requesting.html
    private void checkPermission() {
        checkPermission(android.Manifest.permission.CALL_PHONE);
    }

    // I moved these 2 methods over to LauncherActivity because, in production, I'm getting
    // an app crash on the very first phone call.  Thinking that I'm requesting permission
    // too late ... ?
    private void checkPermission(String androidPermission) {// Here, thisActivity is the current activity
        if (ContextCompat.checkSelfPermission(myView.getContext(), androidPermission)
                != PackageManager.PERMISSION_GRANTED) {

            // Should we show an explanation?
            if (ActivityCompat.shouldShowRequestPermissionRationale((Activity) myView.getContext(), androidPermission)) {

                // Show an explanation to the user *asynchronously* -- don't block
                // this thread waiting for the user's response! After the user
                // sees the explanation, try again to request the permission.

            } else {

                // No explanation needed, we can request the permission.

                ActivityCompat.requestPermissions((Activity) myView.getContext(),
                        new String[]{androidPermission},
                        1 /*MY_PERMISSIONS_REQUEST_READ_CONTACTS*/);

                // MY_PERMISSIONS_REQUEST_READ_CONTACTS is an
                // app-defined int constant. The callback method gets the
                // result of the request.
            }
        }
    }

    private void wireUp2(Button button, final MissionDetail missionDetail) {
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                call2(missionDetail);
            }
        });
    }

    private void workThis(CBMissionDetail missionItem) {

        // set fields back to visible if they were previously set to View.GONE
        setFieldsVisible();

        String missionName = missionItem.getMission_name();
        String missionDescription = missionItem.getDescription();
        String missionScript = missionItem.getScript();

        mission_name.setText(missionName);
        mission_description.setText(missionDescription);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            mission_script.setText(Html.fromHtml(missionScript, Html.FROM_HTML_MODE_COMPACT));
        } else {
            mission_script.setText(Html.fromHtml(missionScript));
        }
        button_call_person1.setVisibility(View.VISIBLE);
        button_call_person1.setText(missionItem.getName() + " " + missionItem.getPhone());
        wireUp(button_call_person1, missionItem);

        //prepareFor3WayCallIfNecessary(missionItem, button_call_person2);  CB is not ready for 3way calls yet
    }

    // Make MainActivity the listener, not this fragment
//    // per AccountStatusEvent.Listener
//    public void fired(AccountStatusEvent evt) {
//        if(evt instanceof AccountStatusEvent.CallEnded) {
//            // switch over to the CBMissionItemWrapUpFragment
//
////            new Handler().post(new Runnable() {
////                public void run() {
//                    FragmentManager fragmentManager = MyCBMissionFragment.this.getFragmentManager();
//                    Fragment fragment = new CBMissionItemWrapUpFragment();
//                    Bundle bundle = new Bundle();
//                    bundle.putString("citizen_builder_domain", citizen_builder_domain);
//                    bundle.putString("citizen_builder_api_key_name", citizen_builder_api_key_name);
//                    bundle.putString("citizen_builder_api_key_value", citizen_builder_api_key_value);
//                    bundle.putString("mission_person_id", mission_person_id);
//                    bundle.putString("mission_id", mission_id);
//                    bundle.putString("mission_phone", mission_phone);
//                    fragment.setArguments(bundle);
//                    if(fragmentManager == null) {
//                        System.out.println("oops - fragmentManager is null");
//                    }
//                    else fragmentManager.beginTransaction().replace(R.id.content_frame, fragment).commitAllowingStateLoss();
////                }
////            });
//
//        }
//    }



    ProgressDialog pd;


    private class GetCBMissionTask extends AsyncTask<String, String, CBMissionDetail> {

        protected void onPreExecute() {
            super.onPreExecute();

            pd = new ProgressDialog(MyCBMissionFragment.this.myView.getContext());
            pd.setMessage("Please wait");
            pd.setCancelable(false);
            pd.show();
        }

        protected CBMissionDetail doInBackground(String... params) {
            String citizen_builder_domain = params[0];
            String citizen_builder_api_key_name = params[1];
            String citizen_builder_api_key_value = params[2];

            String url = "https://"+citizen_builder_domain+"/api/ios/v1/volunteers/get_person?team_id="+User.getInstance().getCurrentTeamId();


//        From CB
//        {
//                "mission_id": 29,
//                "name": "Idaho Test 1",
//                "priority": 1,
//                "description": "First test mission for Idaho",
//                "script": "<p>Hi, this is _____ and I'm just testing a new tool that the Convention of States has.&nbsp; We're calling all volunteers and state leaders in Idaho</p>",
//                "status": "active",
//                "person_id": 208995,
//                "first_name": "Chuck",
//                "last_name": "Laird",
//                "phone": "(609) 5559224"
//        }


            try {
                OkHttpClient client = new OkHttpClient();
                Request request = new Request.Builder()
                        .addHeader(citizen_builder_api_key_name, citizen_builder_api_key_value)
                        .url(url)
                        .build();

                Response response = client.newCall(request).execute();

                String jsonData = response.body().string();
                JSONObject j = new JSONObject(jsonData);
                CBMissionDetail m = new CBMissionDetail();
                m.setMission_id(j.getInt("mission_id")); // throws exception if no more people
                m.setMission_name(j.getString("name"));
                // priority ignored for now 11/21/18
                m.setDescription(j.getString("description"));
                m.setScript(j.getString("script"));
                // status (active) ignored for now
                m.setPerson_id(j.getInt("person_id")+"");
                m.setName(j.getString("first_name")+" "+j.getString("last_name"));
                m.setPhone(j.getString("phone"));

                // these 3 are so we can unassign later if needed
                m.setCitizen_builder_domain(citizen_builder_domain);
                m.setCitizen_builder_api_key_name(citizen_builder_api_key_name);
                m.setCitizen_builder_api_key_value(citizen_builder_api_key_value);

                return m;

            } catch (IOException ex) {
                // TODO log to the database - we have the user's id
                ex.printStackTrace();
            } catch (JSONException ex)  {
                // TODO log to the database - we have the user's id
                ex.printStackTrace();
            }

            System.out.println("Returning null CBMissionDetail");
            return null;
        }

        @Override
        protected void onPostExecute(CBMissionDetail m) {
            super.onPostExecute(m);
            if (pd.isShowing()){
                pd.dismiss();
            }
            if(m == null) {
                User.getInstance().setCurrentCBMissionItem(null);
                return;
            }

            // storing the CBMissionDetail object in the User object may not be what we
            // want to do.  I've seen the mission object get unassigned when onResume() gets
            // called.  And the result of unassigning is the the mission object is set to null
            // inside the User object.
            // What we really want to do here is make sure the mission information is passed from
            // this fragment to the CBMissionItemWrapUpFragment
            mission_person_id = m.getPerson_id();
            mission_id = m.getMission_id();
            mission_phone = m.getPhone();

            MyCBMissionFragment.this.workThis(m);
            User.getInstance().setCurrentCBMissionItem(m);
        }
    }

}
