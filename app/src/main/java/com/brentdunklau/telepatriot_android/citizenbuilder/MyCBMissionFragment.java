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
import android.support.annotation.RequiresApi;
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
    private TextView heading_mission_progress;
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
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.my_cb_mission_fragment, container, false);

        mission_name = myView.findViewById(R.id.heading_mission_name);
//        heading_mission_progress = myView.findViewById(R.id.heading_mission_progress);
        mission_description = myView.findViewById(R.id.mission_description);
        mission_script = myView.findViewById(R.id.mission_script);
        button_call_person1 = myView.findViewById(R.id.button_call_person1);
        button_call_person2 = myView.findViewById(R.id.button_call_person2);
        heading_mission_progress = myView.findViewById(R.id.heading_mission_progress);

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

    private void setFieldsVisible() {
        button_call_person1.setVisibility(View.VISIBLE);
        button_call_person2.setVisibility(View.VISIBLE);
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

    @Override
    public void onRequestPermissionsResult(int requestCode,
                                           String permissions[], int[] grantResults) {
        System.out.println("MyCBMissionFragment - onRequestPermissionsResult()");

        // only checking for CALL_PHONE permission
        if(permissions.length == 0
                || !permissions[0].equalsIgnoreCase(android.Manifest.permission.CALL_PHONE)
                || grantResults.length == 0
                || grantResults[0] != PackageManager.PERMISSION_GRANTED
                || User.getInstance().getCurrentCBMissionItem() == null)
            return;
        call(User.getInstance().getCurrentCBMissionItem());
    }

    private void wireUp(Button button, final CBMissionDetail missionDetail) {
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                call(missionDetail);
            }
        });
    }

    private void prepareFor3WayCallIfNecessary(CBMissionDetail missionDetail, Button button) {
        String _3WayCallName = get3WallCallName(missionDetail);
        String _3WayCallPhone = get3WallCallPhone(missionDetail);
        boolean is3WayCallMission = _3WayCallName != null && _3WayCallPhone != null;
        if(is3WayCallMission) {
            // we have a 3way call scenario
            button.setText(_3WayCallName + " " + _3WayCallPhone);
            wireUp2(button, missionDetail);
        }
        else {
            // not a 3way call scenario, so hide the second phone button
            button.setVisibility(View.GONE);
        }
    }


    /**
     * @see com.brentdunklau.telepatriot_android.util.PhoneBroadcastReceiver.handleCall() - that's where the
     * logic is that fires when the call ends
     * @param missionDetail
     */
    //@RequiresApi(api = Build.VERSION_CODES.M)
    private void call(CBMissionDetail missionDetail) {
        call(missionDetail.getPhone());
    }

    // call the name2/phone2 person
    //@RequiresApi(api = Build.VERSION_CODES.M)
    private void call2(CBMissionDetail missionDetail) {
        String phone = get3WallCallPhone(missionDetail);
        call(phone);
    }

    private void call(String phone) {
        placeCall(phone);
//        if(permittedToCall()) {
//            placeCall(phone);
//        }
//        else {
//            requestPermissionToCall();
//        }
    }

    private boolean permittedToCall() {
        return ContextCompat.checkSelfPermission(myView.getContext(), android.Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED;
    }

    static int i = 1;
    private void placeCall(String phone) {

        Intent intent = new Intent(Intent.ACTION_DIAL);
        if(i==1) { i=2; phone = "2145552222";}
        else { i=1; phone = "2145551111"; }
        intent.setData(Uri.parse("tel:" + phone));
        startActivity(intent);
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    private void requestPermissionToCall() {
        this.requestPermissions(new String[]{android.Manifest.permission.CALL_PHONE}, 1);
    }

    private void wireUp2(Button button, final CBMissionDetail missionDetail) {
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
        heading_mission_progress.setText(String.format("%s%% Complete (%s of %s calls made)",
                missionItem.getPercent_complete(), missionItem.getCalls_made(), missionItem.getTotal()));


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            mission_script.setText(Html.fromHtml(missionScript, Html.FROM_HTML_MODE_COMPACT));
        } else {
            mission_script.setText(Html.fromHtml(missionScript));
        }
        button_call_person1.setVisibility(View.VISIBLE);
        button_call_person1.setText(missionItem.getName() + " " + missionItem.getPhone());
        wireUp(button_call_person1, missionItem);

        prepareFor3WayCallIfNecessary(missionItem, button_call_person2);
    }

    // called when we come back from a call
    @Override
    public void onResume() {
        doSuper = false; // see BaseFragment
        super.onResume();
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
//                "phone": "(609) 5559224",
//                "total": 0,
//                "calls_made": 0,
//                "percent_complete": 0
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

                m.setTotal(j.getInt("total")+"");
                m.setCalls_made(j.getInt("calls_made")+"");
                m.setPercent_complete(j.getInt("percent_complete")+"");

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

    private String get3WallCallName(CBMissionDetail missionDetail) {

        // TODO Once CB officially supports 3way calling, we will get rid of this line
        return getPart(missionDetail.getScript(), "start 3way call name", "end 3way call name");

        // TODO Once CB officially supports 3way calling, we will uncomment the line below and implement getName2()
//        return missionDetail.getName2();
    }

    private String get3WallCallPhone(CBMissionDetail missionDetail) {

        // TODO Once CB officially supports 3way calling, we will get rid of this line
        return getPart(missionDetail.getScript(), "start 3way call phone", "end 3way call phone");

        // TODO Once CB officially supports 3way calling, we will uncomment the line below and implement getPhone2()
//        return missionDetail.getPhone2();
    }

    // TODO Once CB officially supports 3way calling, this method won't even be needed
    private String getPart(String whole, String begin, String end) {
        if(whole.indexOf(begin) == -1 || whole.indexOf(end) == -1) return null;
        int idx1 = whole.indexOf(begin) + begin.length();
        int idx2 = whole.indexOf(end);
        String part = whole.substring(idx1, idx2).trim();
        if(part.equals("")) return null;
        else return part;
    }

}
