package com.brentdunklau.telepatriot_android;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.widget.LinearLayoutManager;
import android.telephony.SmsManager;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.brentdunklau.telepatriot_android.util.Configuration;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 9/29/19.
 */

// Called from MainActivity.onNavigationItemSelected()
public class ShareFragment extends BaseFragment {

    private TextView sms_phone;
    private Button button_send_text;
    private static final int SMS_PERMISSION_REQUEST_CODE = 1;
    View myView;


    // Called from MainActivity.onNavigationItemSelected()
    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.share_fragment, container, false);

        sms_phone = myView.findViewById(R.id.sms_phone);
        sms_phone.setText("2146325613");
        button_send_text = myView.findViewById(R.id.button_send_text);

        button_send_text.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendText();
            }
        });

        if(!hasPermissionForSms()) {
            requestPermissionForSms();
        }

        //setHasOptionsMenu(true);
        return myView;
    }

    private void sendText() {
        String message = "just a test";
        String phone = sms_phone.getText().toString();
        SmsManager smsManager = SmsManager.getDefault();
        smsManager.sendTextMessage(phone, null, message, null, null);
    }

    private boolean hasPermissionForSms() {
        int resultSms = ContextCompat.checkSelfPermission(getActivity(), Manifest.permission.SEND_SMS);
        return resultSms == PackageManager.PERMISSION_GRANTED;
    }

    private void requestPermissionForSms() {
        if (ActivityCompat.shouldShowRequestPermissionRationale(getActivity(), Manifest.permission.SEND_SMS)) {
            Toast.makeText(getActivity(),
                    R.string.permissions_needed,
                    Toast.LENGTH_LONG).show();
        } else {
            ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[]{Manifest.permission.SEND_SMS},
                    SMS_PERMISSION_REQUEST_CODE); 
        }
    }
}
