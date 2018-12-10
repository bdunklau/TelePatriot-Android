package com.brentdunklau.telepatriot_android;

import android.Manifest;
import android.app.Activity;
import android.app.Fragment;
import android.content.Context;
import android.content.DialogInterface;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.telephony.SmsManager;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;

import com.brentdunklau.telepatriot_android.util.User;


/**
 * Created by bdunklau on 10/23/2017.
 */

public class SendPetitionFragment extends BaseFragment {

    EditText phone_field_send_petition;
    Button button_send_petition;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.send_petition_fragment, container, false);

        // need to check for the user's recruiter_id number and if it doesn't exist, we should
        // pop up a dialog asking for it.
        // SEE https://stackoverflow.com/a/35861189
        if(User.getInstance().getRecruiter_id() == null) {
            // get prompts.xml view
            LayoutInflater li = LayoutInflater.from(myView.getContext());
            View promptsView = li.inflate(R.layout.ok_cancel_dialog_one_numeric_input, null);

            AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(myView.getContext());
            alertDialogBuilder.setView(myView);

            // set prompts.xml to alertdialog builder
            alertDialogBuilder.setView(promptsView);

            final EditText userInput = (EditText) promptsView
                    .findViewById(R.id.dialog_input);

            // set dialog message
            alertDialogBuilder
                    .setCancelable(false)
                    .setPositiveButton("OK",
                            new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface dialog,int id) {
                                    // get user input and set it to result
                                    // edit text
                                    User.getInstance().setRecruiter_id(userInput.getText().toString());
                                }
                            })
                    .setNegativeButton("Cancel",
                            new DialogInterface.OnClickListener() {
                                public void onClick(DialogInterface dialog, int id) {
                                    dialog.cancel();
                                }
                            });

            // create alert dialog
            AlertDialog alertDialog = alertDialogBuilder.create();

            // show it
            alertDialog.show();

        }

        phone_field_send_petition = myView.findViewById(R.id.phone_field_send_petition);
        button_send_petition = myView.findViewById(R.id.button_send_petition);
        button_send_petition.setEnabled(false);
        button_send_petition.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                sendPetition(view);
            }
        });


        phone_field_send_petition.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {

            }

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {

            }

            @Override
            public void afterTextChanged(Editable editable) {
                if(phone_field_send_petition.getText().toString().length() == 10) {
                    button_send_petition.setEnabled(true);
                    // this is where we put the code that says so-and-so is typing

                }
                else {
                    button_send_petition.setEnabled(false);
                    // this is where we put the code that removes the "so-and-so is typing" message
                }
            }
        });


        //setHasOptionsMenu(true);
        return myView;
    }

    private void sendPetition(View view) {
        try {
            xxxx();
            SmsManager sm = SmsManager.getDefault();
            String tel = phone_field_send_petition.getText().toString();
            String petition = "www.cosaction.com";
            if(User.getInstance().getRecruiter_id() != null)
                petition += "/?recruiter_id="+User.getInstance().getRecruiter_id();
            String msg = User.getInstance().getName()+" would like you to sign the Convention of States petition: "+petition;
            sm.sendTextMessage(tel, null, msg, null, null);
            clear(phone_field_send_petition);
            hideKeyboard();
            Toast.makeText(myView.getContext(), "Petition Sent", Toast.LENGTH_SHORT).show();

        } catch(Throwable t) {
            // TODO don't do this
            t.printStackTrace();
        }
    }

    // https://developer.android.com/training/permissions/requesting.html
    private void xxxx() {
        // Here, thisActivity is the current activity
        if (ContextCompat.checkSelfPermission(myView.getContext(),
                Manifest.permission.SEND_SMS)
                != PackageManager.PERMISSION_GRANTED) {

            // Should we show an explanation?
            if (ActivityCompat.shouldShowRequestPermissionRationale((Activity) myView.getContext(),
                    android.Manifest.permission.SEND_SMS)) {

                // Show an explanation to the user *asynchronously* -- don't block
                // this thread waiting for the user's response! After the user
                // sees the explanation, try again to request the permission.

            } else {

                // No explanation needed, we can request the permission.

                ActivityCompat.requestPermissions((Activity) myView.getContext(),
                        new String[]{android.Manifest.permission.SEND_SMS},
                        1 /*MY_PERMISSIONS_REQUEST_READ_CONTACTS*/);

                // MY_PERMISSIONS_REQUEST_READ_CONTACTS is an
                // app-defined int constant. The callback method gets the
                // result of the request.
            }
        }
    }

    private void clear(final EditText e) {
        Runnable r = new Runnable() {
            @Override
            public void run() {
                e.setText("");
            }
        };
        new Handler().post(r);
    }

    private void hideKeyboard() {
        InputMethodManager imm = (InputMethodManager) myView.getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
        imm.hideSoftInputFromWindow(button_send_petition.getWindowToken(), 0);
    }

}
