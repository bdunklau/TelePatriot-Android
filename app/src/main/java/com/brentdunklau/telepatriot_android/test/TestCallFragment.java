package com.brentdunklau.telepatriot_android.test;

import android.Manifest;
import android.app.Activity;
import android.app.Fragment;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;
import com.brentdunklau.telepatriot_android.util.MissionItemEvent;
import com.brentdunklau.telepatriot_android.util.User;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.util.Date;

/**
 * Created by bdunklau on 10/21/17.
 */

public class TestCallFragment extends Fragment {

    TextView text_214, text_469, text_kiera;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(com.brentdunklau.telepatriot_android.R.layout.test_call_fragment, container, false);

        getCallDetails();

        text_214 = myView.findViewById(R.id.text_214);
        text_214.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                call(text_214.getText().toString());
            }
        });


        text_469 = myView.findViewById(R.id.text_469);
        text_469.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                call(text_469.getText().toString());
            }
        });


        text_kiera = myView.findViewById(R.id.text_kiera);
        text_kiera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                call(text_kiera.getText().toString());
            }
        });


        setHasOptionsMenu(true);
        return myView;
    }


    private void call(String phone) {
        xxxx();
        Intent intent = new Intent(Intent.ACTION_CALL);
        intent.setData(Uri.parse("tel:" + phone));
        String fakeMission = "Big Ol' Mission";
        intent.putExtra("mission", fakeMission);
        // WRITE THE BEGINNING OF THE CALL TO THE DATABASE HERE BECAUSE SOME CARRIERS LIKE
        // SPRINT BLOCK INTERNET ACCESS WHILE THE PHONE
        // IS OFFHOOK.
        // Writing to the database here just gives the directors the cool visual of seeing the
        // call start and then seeing it end

        DatabaseReference ref = FirebaseDatabase.getInstance().getReference("activity");
        String eventType = "is calling";
        MissionItemEvent m = new MissionItemEvent(new Date().toString(), eventType, User.getInstance().getUid(), User.getInstance().getName(), fakeMission, phone);
        ref.push().setValue(m);
        ref.child(phone).push().setValue(m);

        startActivity(intent);
    }


    // https://developer.android.com/training/permissions/requesting.html
    private void xxxx() {
        checkPermission(android.Manifest.permission.CALL_PHONE);
    }

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

    private void getCallDetails() {
        checkPermission(Manifest.permission.ACCESS_COARSE_LOCATION);
        checkPermission(Manifest.permission.READ_PHONE_STATE);

    }
}

