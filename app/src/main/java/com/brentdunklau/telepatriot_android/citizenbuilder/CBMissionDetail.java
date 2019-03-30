package com.brentdunklau.telepatriot_android.citizenbuilder;

import android.app.ProgressDialog;
import android.os.AsyncTask;

import com.brentdunklau.telepatriot_android.util.User;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Created by bdunklau on 11/22/18.
 */

public class CBMissionDetail {

    private String mission_id;
    private String mission_name;
    private String description;
    private String script;
    private String name;
    private String phone;
    private String person_id;
    private String total; // calls to make, actually int value
    private String calls_made; //actually int value
    private String percent_complete; //actually int value

    private String citizen_builder_domain;
    private String citizen_builder_api_key_name;
    private String citizen_builder_api_key_value;

//    private boolean completed;

    public String getMission_id() {
        return mission_id;
    }

    public void setMission_id(Integer mission_id) {
        this.mission_id = mission_id+"";
    }

    public String getMission_name() {
        return mission_name;
    }

    public void setMission_name(String mission_name) {
        this.mission_name = mission_name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getScript() {
        return script;
    }

    public void setScript(String script) {
        this.script = script;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setMission_id(String mission_id) {
        this.mission_id = mission_id;
    }

    public String getPerson_id() {
        return person_id;
    }

    public void setPerson_id(String person_id) {
        this.person_id = person_id;
    }

    public String getCitizen_builder_domain() {
        return citizen_builder_domain;
    }

    public void setCitizen_builder_domain(String citizen_builder_domain) {
        this.citizen_builder_domain = citizen_builder_domain;
    }

    public String getCitizen_builder_api_key_name() {
        return citizen_builder_api_key_name;
    }

    public void setCitizen_builder_api_key_name(String citizen_builder_api_key_name) {
        this.citizen_builder_api_key_name = citizen_builder_api_key_name;
    }

    public String getCitizen_builder_api_key_value() {
        return citizen_builder_api_key_value;
    }

    public void setCitizen_builder_api_key_value(String citizen_builder_api_key_value) {
        this.citizen_builder_api_key_value = citizen_builder_api_key_value;
    }

    public String getTotal() {
        return total;
    }

    public void setTotal(String total) {
        this.total = total;
    }

    public String getCalls_made() {
        return calls_made;
    }

    public void setCalls_made(String calls_made) {
        this.calls_made = calls_made;
    }

    public String getPercent_complete() {
        return percent_complete;
    }

    public void setPercent_complete(String percent_complete) {
        this.percent_complete = percent_complete;
    }

    public void unassign() {
        new UnassignMissionTask().execute(citizen_builder_domain, citizen_builder_api_key_name, citizen_builder_api_key_value,
                mission_id, person_id);
    }

    public String getName2() {
        // TODO Once CB officially supports 3way calling, we will refactor this
        return getPart(getScript(), "start 3way call name", "end 3way call name");
    }

    public String getPhone2() {
        // TODO Once CB officially supports 3way calling, we will refactor this
        return getPart(getScript(), "start 3way call phone", "end 3way call phone");
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

    ProgressDialog pd;


    private class UnassignMissionTask extends AsyncTask<String, String, Boolean> {

        protected void onPreExecute() {
        }

        /**
         *
         * @param params
         * @return true equals successful unassignment
         */
        protected Boolean doInBackground(String... params) {
            String citizen_builder_domain = params[0];  // could get all this stuff from CBMissionDetail.this
            String citizen_builder_api_key_name = params[1];
            String citizen_builder_api_key_value = params[2];
            String mission_id = params[3];
            String person_id = params[4];

            String url = "https://"+citizen_builder_domain+"/api/ios/v1/volunteers/revoke_person_call?mission_id="+mission_id+"&person_id="+person_id;

            Boolean successful = Boolean.TRUE;
            Boolean notSuccessful = Boolean.FALSE;
            try {
                OkHttpClient client = new OkHttpClient();
                Request request = new Request.Builder()
                        .addHeader(citizen_builder_api_key_name, citizen_builder_api_key_value)
                        .url(url)
                        .build();

                Response response = client.newCall(request).execute();
                // typical response  {"info": "Success"}

                if(response == null) return notSuccessful;

                String jsonData = response.body().string();
                if(jsonData == null || jsonData.trim().equalsIgnoreCase("")) return notSuccessful;

                JSONObject j = new JSONObject(jsonData);
                String ans = j.getString("info");
                Boolean resp = ans != null && ans.equalsIgnoreCase("Success") ? successful : notSuccessful;
                return resp;

            } catch (IOException ex) {
                // TODO log to the database - we have the user's id
                ex.printStackTrace();
            } catch (JSONException ex)  {
                // TODO log to the database - we have the user's id
                ex.printStackTrace();
            }

            return notSuccessful;
        }

        @Override
        protected void onPostExecute(Boolean success) {
            if(success != null && success.booleanValue())
                User.getInstance().setCurrentCBMissionItem(null);
        }
    }
}
