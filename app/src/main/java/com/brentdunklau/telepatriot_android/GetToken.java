package com.brentdunklau.telepatriot_android;

import android.os.AsyncTask;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.Buffer;
import java.util.HashMap;
import java.util.Iterator;

import static com.brentdunklau.telepatriot_android.VidyoChatFragment.jsonTokenData;

public class GetToken extends AsyncTask<Void, Void, Void> {

    String data;
    String nameString;
    String parsedToken;

    @Override
    protected Void doInBackground(Void... voids) {

        //TODO make dynamic
        nameString = ("Jeremy");
        try {
            URL url = new URL("https://us-central1-telepatriot-bd737.cloudfunctions.net/generateVidyoToken?userName=" + nameString);

            HttpURLConnection tokenConnection = (HttpURLConnection) url.openConnection();
            InputStream inputStream = tokenConnection.getInputStream();
            BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));

            String line = inputStream.toString();


            HashMap<String, String> map = new HashMap<>();
            JSONObject JA = new JSONObject(line);
            Iterator<?> keys = JA.keys();
            while (keys.hasNext()) {
                String key = (String) keys.next();
                String value = JA.getString(key);
                map.put(key, value);
                parsedToken = value;
            }
        } catch (IOException e) {
            e.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return null;
    }

    @Override
    protected void onPostExecute(Void aVoid) {
        super.onPostExecute(aVoid);
        VidyoChatFragment.mToken.setText(data);
        jsonTokenData = parsedToken;
    }
}
