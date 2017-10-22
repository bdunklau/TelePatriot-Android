package com.brentdunklau.telepatriot_android;

import android.app.Activity;
import android.app.Fragment;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

/**
 * Created by bdunklau on 10/21/17.
 */

public class ConfCallFragment extends Fragment {

    TextView text_214, text_469, text_kiera;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.conf_call_fragment, container, false);

        text_214 = myView.findViewById(R.id.text_214);
        text_214.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                try {
                    xxxx();
                    String tel = text_214.getText().toString();
                    Intent intent = new Intent(Intent.ACTION_CALL);
                    intent.setData(Uri.parse("tel:" + tel));
                    startActivity(intent);
                } catch(Throwable t) {
                    // TODO don't do this
                    t.printStackTrace();
                }
            }
        });


        text_469 = myView.findViewById(R.id.text_469);
        text_469.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                try {
                    xxxx();
                    String tel = text_469.getText().toString();
                    Intent intent = new Intent(Intent.ACTION_CALL);
                    intent.setData(Uri.parse("tel:" + tel));
                    startActivity(intent);
                } catch(Throwable t) {
                    // TODO don't do this
                    t.printStackTrace();
                }
            }
        });


        text_kiera = myView.findViewById(R.id.text_kiera);
        text_kiera.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                try {
                    xxxx();
                    String tel = text_kiera.getText().toString();
                    Intent intent = new Intent(Intent.ACTION_CALL);
                    intent.setData(Uri.parse("tel:" + tel));
                    startActivity(intent);
                } catch(Throwable t) {
                    // TODO don't do this
                    t.printStackTrace();
                }
            }
        });


        setHasOptionsMenu(true);
        return myView;
    }


    // https://developer.android.com/training/permissions/requesting.html
    private void xxxx() {
        // Here, thisActivity is the current activity
        if (ContextCompat.checkSelfPermission(myView.getContext(),
                android.Manifest.permission.CALL_PHONE)
                != PackageManager.PERMISSION_GRANTED) {

            // Should we show an explanation?
            if (ActivityCompat.shouldShowRequestPermissionRationale((Activity) myView.getContext(),
                    android.Manifest.permission.CALL_PHONE)) {

                // Show an explanation to the user *asynchronously* -- don't block
                // this thread waiting for the user's response! After the user
                // sees the explanation, try again to request the permission.

            } else {

                // No explanation needed, we can request the permission.

                ActivityCompat.requestPermissions((Activity) myView.getContext(),
                        new String[]{android.Manifest.permission.CALL_PHONE},
                        1 /*MY_PERMISSIONS_REQUEST_READ_CONTACTS*/);

                // MY_PERMISSIONS_REQUEST_READ_CONTACTS is an
                // app-defined int constant. The callback method gets the
                // result of the request.
            }
        }
    }
}
