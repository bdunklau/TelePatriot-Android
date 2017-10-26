package com.brentdunklau.telepatriot_android.util;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.support.annotation.NonNull;
import android.telephony.TelephonyManager;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
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

        DatabaseReference ref = FirebaseDatabase.getInstance().getReference("activity");

        //  https://www.studytutorial.in/android-phonestatelistener-phone-call-broadcast-receiver-tutorial
        // DON'T THINK THE FIRST TWO CONDITIONS EVER GET CALLED.  IT'S ALWAYS THE LAST ONE
        if (intent.getAction().equals("android.intent.action.NEW_OUTGOING_CALL")) {
            handleOutgoing(intent, ref);
        }
        else if (intent.getAction().equals("android.intent.action.ACTION_CALL")) {
            handleIncoming(intent, ref);
        }
        else if(intent.getAction().equals("android.intent.action.PHONE_STATE")) {
            handlePhoneState(intent, ref);
        }


        //Toast.makeText(context, log, Toast.LENGTH_LONG).show();
    }


    private void handlePhoneState(Intent intent, DatabaseReference ref) {
        String eventType = intent.getExtras().getString(TelephonyManager.EXTRA_STATE);
        String phone = intent.getExtras().getString(TelephonyManager.EXTRA_INCOMING_NUMBER);
        handleCall(intent, ref, phone, eventType);
    }


    private void handleIncoming(Intent intent, DatabaseReference ref) {
        String eventType = "Incoming Call";
        String phone = intent.getExtras().getString("android.intent.extra.PHONE_NUMBER");
        handleCall(intent, ref, phone, eventType);
    }


    private void handleOutgoing(Intent intent, DatabaseReference ref) {
        // put the mission name in the 'extras' when you make the call.  otherwise, we won't know
        // what mission this is for
        String eventType = "Outgoing Call";
        String phone = intent.getExtras().getString(TelephonyManager.EXTRA_INCOMING_NUMBER);
        handleCall(intent, ref, phone, eventType);
    }

    private void handleCall(Intent intent, DatabaseReference ref, String phone, String eventType) {
        String mission = intent.getExtras()!=null ? intent.getExtras().getString("mission") : null;
        String stateStr = intent.getExtras().getString(TelephonyManager.EXTRA_STATE);
        int state = 0;
        if(stateStr.equals(TelephonyManager.EXTRA_STATE_IDLE)){
            state = TelephonyManager.CALL_STATE_IDLE;
            MissionItemEvent m = new MissionItemEvent(new Date().toString(), "call ended", User.getInstance().getUid(), User.getInstance().getName(), mission, phone);
            ref.push().setValue(m);
            ref.child(phone).push().setValue(m);
        }
        else if(stateStr.equals(TelephonyManager.EXTRA_STATE_OFFHOOK)){
            /*  See ConfCallFragment - don't try to write to the db here when the call starts
            The phone is already off the hook, so some carriers like Sprint block internet access while you're on a call

            state = TelephonyManager.CALL_STATE_OFFHOOK;
            MissionItemEvent m = new MissionItemEvent(new Date().toString(), eventType, User.getInstance().getUid(), User.getInstance().getName(), mission, phone);
            ref.push().setValue(m);
            ref.child(phone).push().setValue(m);
            */
        }
        else if(stateStr.equals(TelephonyManager.EXTRA_STATE_RINGING)){
            state = TelephonyManager.CALL_STATE_RINGING;
        }
    }
}
