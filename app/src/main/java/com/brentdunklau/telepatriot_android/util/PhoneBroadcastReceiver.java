package com.brentdunklau.telepatriot_android.util;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.widget.Toast;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.util.Date;

/**
 * Created by bdunklau on 10/23/17.
 */

public class PhoneBroadcastReceiver extends BroadcastReceiver {

    private static final String TAG = "PhoneBroadcastReceiver";
    @Override
    public void onReceive(Context context, Intent intent) {

        DatabaseReference ref = FirebaseDatabase.getInstance().getReference("calls");


        //  https://www.studytutorial.in/android-phonestatelistener-phone-call-broadcast-receiver-tutorial
        String savedNumber;
        //We listen to two intents.  The new outgoing call only tells us of an outgoing call.  We use it to get the number.
        if (intent.getAction().equals("android.intent.action.NEW_OUTGOING_CALL")) {
            savedNumber = intent.getExtras().getString("android.intent.extra.PHONE_NUMBER");
            ref.child(savedNumber).push().setValue(new PhoneEvent(new Date().toString(), "outgoing call", User.getInstance().getUid(), User.getInstance().getName()));

        }
        else{
            String stateStr = intent.getExtras().getString(TelephonyManager.EXTRA_STATE);
            String phone = intent.getExtras().getString(TelephonyManager.EXTRA_INCOMING_NUMBER);
            int state = 0;
            if(stateStr.equals(TelephonyManager.EXTRA_STATE_IDLE)){
                state = TelephonyManager.CALL_STATE_IDLE;
                ref.child(phone).push().setValue(new PhoneEvent(new Date().toString(), "call ended", User.getInstance().getUid(), User.getInstance().getName()));

            }
            else if(stateStr.equals(TelephonyManager.EXTRA_STATE_OFFHOOK)){
                state = TelephonyManager.CALL_STATE_OFFHOOK;
                ref.child(phone).push().setValue(new PhoneEvent(new Date().toString(), "incoming call", User.getInstance().getUid(), User.getInstance().getName()));

            }
            else if(stateStr.equals(TelephonyManager.EXTRA_STATE_RINGING)){
                state = TelephonyManager.CALL_STATE_RINGING;
            }
        }


        //Toast.makeText(context, log, Toast.LENGTH_LONG).show();
    }
}