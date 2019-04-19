package com.brentdunklau.telepatriot_android.citizenbuilder;


import android.app.ProgressDialog;
import android.content.Context;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.BaseFragment;
import com.brentdunklau.telepatriot_android.R;
import com.brentdunklau.telepatriot_android.util.MissionCompletedListener;
import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.Util;
import com.google.firebase.database.FirebaseDatabase;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.HashMap;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Created by bdunklau on 11/24/18.
 */

public class CBMissionItemWrapUpFragment extends BaseFragment {

//    private QuitListener quitListener;
    private MissionCompletedListener missionCompletedListener;
    private TextView mission_person_name, mission_person_phone, mission_person_name2, mission_person_phone2;
    private EditText edit_text_notes;
    private Button button_submit_get_another, button_submit_and_quit;
    private Spinner mission_item_outcome;// see outcome_array in strings.xml
    private String citizen_builder_domain;
    private String citizen_builder_api_key_name;
    private String citizen_builder_api_key_value;
    private String mission_person_id;
    private String mission_id;
    private String mission_phone;
    private boolean getAnother; // get another mission after this one, or logout/quit?
    private CBMissionDetail cbMissionDetail;
    View myView;

    @Nullable
    @Override
    /**
     * ALL mission items are under the /mission_items node.  So now, all we have to do for the volunteers is do a
     * limitToFirst(1) query for the mission that has the following criteria:
     * active_and_accomplished: true_new
     *
     * We get here from MainActivity.callEnded()
     */
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.mission_item_wrap_up_fragment, container, false);

        edit_text_notes = myView.findViewById(R.id.edit_text_notes);
        button_submit_get_another = myView.findViewById(R.id.button_submit_get_another);
        button_submit_and_quit = myView.findViewById(R.id.button_submit_and_quit);
        mission_item_outcome = myView.findViewById(R.id.mission_item_outcome);
        mission_person_name = myView.findViewById(R.id.mission_person_name);
        mission_person_phone = myView.findViewById(R.id.mission_person_phone);
        mission_person_name2 = myView.findViewById(R.id.mission_person_name2);
        mission_person_phone2 = myView.findViewById(R.id.mission_person_phone2);

        citizen_builder_domain = this.getArguments().getString("citizen_builder_domain");
        citizen_builder_api_key_name = this.getArguments().getString("citizen_builder_api_key_name");
        citizen_builder_api_key_value = this.getArguments().getString("citizen_builder_api_key_value");
        mission_person_id = this.getArguments().getString("mission_person_id");
        mission_id = this.getArguments().getString("mission_id");
        mission_phone = this.getArguments().getString("mission_phone");
        mission_person_name.setText(this.getArguments().getString("mission_person_name"));
        mission_person_phone.setText(this.getArguments().getString("mission_phone"));
        if(this.getArguments().getString("mission_person_name2") != null) {
            mission_person_name2.setText(this.getArguments().getString("mission_person_name2"));
        }
        if(this.getArguments().getString("mission_phone2") != null) {
            mission_person_phone2.setText(this.getArguments().getString("mission_phone2"));
        }

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


        cbMissionDetail = User.getInstance().getCurrentCBMissionItem();

        setHasOptionsMenu(true);
        return myView;
    }


    @Override
    public void onAttach(Context context) {
        super.onAttach(context);
        try {
            missionCompletedListener = (MissionCompletedListener) context; // basically, this is MainActivity
        }
        catch(ClassCastException e) {
            // TODO better to log in the db
            e.printStackTrace();
        }
    }


    @Override
    public void onResume() {
        doSuper = false; // to make sure we don't overwrite the active_and_accomplished attribute that is now true_complete
        // see super.onResume()
        super.onResume();
        Log.d("CBMissionItemWrapUpFrag", "onResume");
    }

    private void submitWrapUpAndGetAnother(View v) {
        getAnother = true;
        submitWrapUp();
    }


    private void submitWrapUpAndQuit(View v) {
        getAnother = false;
        submitWrapUp();
    }

    private void done() {
        missionCompletedListener.missionCompleted(citizen_builder_domain,
                citizen_builder_api_key_name,
                citizen_builder_api_key_value,
                getAnother);
    }

    private void submitWrapUp() {
        HashMap<String, Object> call_notes = new HashMap<String, Object>();
        call_notes.put("first_name", cbMissionDetail.getName());// this sucks - the person called
        call_notes.put("last_name", "");                        // this sucks - the person called
        call_notes.put("person_id", cbMissionDetail.getPerson_id()); // the person called CB ID
        call_notes.put("phone_number", cbMissionDetail.getPhone());  // the person called
        call_notes.put("author_name", User.getInstance().getName());             // the volunteer
        call_notes.put("author_id", User.getInstance().getCitizen_builder_id()); // the volunteer
        call_notes.put("outcome", mission_item_outcome.getSelectedItem()+"");
        call_notes.put("notes", edit_text_notes.getText()+"");
        call_notes.put("call_date", Util.getDate_MMM_d_yyyy_hmm_am_z());
        call_notes.put("call_date_ms", Util.getDate_as_millis());
        call_notes.put("mission_name", cbMissionDetail.getMission_name());
        call_notes.put("mission_id", cbMissionDetail.getMission_id());
        call_notes.put("calls_made", cbMissionDetail.getCalls_made());
        call_notes.put("percent_complete", cbMissionDetail.getPercent_complete());
        call_notes.put("total", cbMissionDetail.getTotal());
        call_notes.put("status", "active"); // should be attribute in the object, but it isn't used, and really HAS to be active
        if(cbMissionDetail.getName2() != null) {
            call_notes.put("name2", cbMissionDetail.getName2());
        }
        if(cbMissionDetail.getPhone2() != null) {
            call_notes.put("phone2", cbMissionDetail.getPhone2());
        }

        FirebaseDatabase.getInstance().getReference("call_notes").push().setValue(call_notes);

        new SubmitCallNotesTask().execute(citizen_builder_domain,
                citizen_builder_api_key_name,
                citizen_builder_api_key_value,
                mission_person_id,
                User.getInstance().getCitizen_builder_id()+"",
                mission_id,
                mission_phone,
                mission_item_outcome.getSelectedItem()+"",
                edit_text_notes.getText()+"",
                                /*call_date*/ Util.getDate_yyyy_MM_dd(),
                                /*duration*/ "1", // TODO fix this
                                /*success*/ "true" );
    }



    ProgressDialog pd;


    private class SubmitCallNotesTask extends AsyncTask<String, String, Boolean> {

        protected void onPreExecute() {
            super.onPreExecute();

            pd = new ProgressDialog(CBMissionItemWrapUpFragment.this.myView.getContext());
            pd.setMessage("Please wait");
            pd.setCancelable(false);
            pd.show();
        }

        protected Boolean doInBackground(String... params) {
            String citizen_builder_domain = params[0];
            String citizen_builder_api_key_name = params[1];
            String citizen_builder_api_key_value = params[2];
            String person_id = params[3];
            String author_id = params[4];
            String mission_id = params[5];
            String phone_number = params[6];
            String outcome = params[7];
            String note = params[8];
            String call_date = params[9];
            String duration = params[10];
            String success = params[11];

            if(note == null || note.trim().equals(""))
                note = "no notes left"; // CB doesn't allow the notes field to be blank

            Boolean successful = Boolean.TRUE;
            Boolean notSuccessful = Boolean.FALSE;
            String url = "https://"+citizen_builder_domain+"/api/ios/v1/person_call/call_data";
            String jsonData = "(not set yet)";
            try {
//                MediaType JSON = MediaType.parse("application/json; charset=utf-8");

                JSONObject j = new JSONObject();
                j.put("person_id", Integer.parseInt(person_id));
                j.put("author_id", Integer.parseInt(author_id));
                j.put("mission_id", Integer.parseInt(mission_id));
                j.put("phone_number", phone_number);
                j.put("outcome", outcome);
                j.put("note", note);
                j.put("call_date", call_date);
                j.put("duration", Integer.parseInt(duration));
                j.put("success", Boolean.valueOf(success));


                OkHttpClient client = new OkHttpClient();
                MediaType JSON = MediaType.parse("application/json; charset=utf-8");
                // put your json here
                String jsonString = j.toString();
                RequestBody body = RequestBody.create(JSON, jsonString);
                Request request = new Request.Builder()
                        .url(url)
                        .addHeader(citizen_builder_api_key_name, citizen_builder_api_key_value)
                        .post(body)
                        .build();

                Response response = client.newCall(request).execute();

//                typical response
//                { "result": "Call saved successfully" }

                if(response == null) return notSuccessful;

                jsonData = response.body().string();
                if(jsonData == null || jsonData.trim().equalsIgnoreCase("")) return notSuccessful;

                JSONObject jr = new JSONObject(jsonData);
                String ans = jr.getString("result");
                return ans != null && ans.equalsIgnoreCase("Call saved successfully") ? successful : notSuccessful;

            } catch (IOException ex) {
                // TODO log to the database - we have the user's id
                ex.printStackTrace();
            } catch (JSONException ex)  {
                // TODO log to the database - we have the user's id
                System.out.println("jsonData = "+jsonData);
                ex.printStackTrace();
            }

            return notSuccessful;
        }

        @Override
        protected void onPostExecute(Boolean success) {
            super.onPostExecute(success);
            if (pd.isShowing()){
                pd.dismiss();
            }
            if(success == null)
                return;

            if(success != null && success.booleanValue())
                CBMissionItemWrapUpFragment.this.done();
        }
    }
}
