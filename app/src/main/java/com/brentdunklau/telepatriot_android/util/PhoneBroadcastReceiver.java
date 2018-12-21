package com.brentdunklau.telepatriot_android.util;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.TelephonyManager;

/**
 * Created by bdunklau on 10/23/17.
 */

public class PhoneBroadcastReceiver extends BroadcastReceiver {

    private static final String TAG = "PhoneBroadcastReceiver";
    @Override
    public void onReceive(Context context, Intent intent) {

        if(intent.getAction().equals("android.intent.action.PHONE_STATE")) {
            handlePhoneState(context, intent);
        }


        //Toast.makeText(context, log, Toast.LENGTH_LONG).show();
    }


    //  https://www.studytutorial.in/android-phonestatelistener-phone-call-broadcast-receiver-tutorial
    private void handlePhoneState(Context ctx, Intent intent) {
        //String eventType = intent.getExtras().getString(TelephonyManager.EXTRA_STATE);
        //String phone = intent.getExtras().getString(TelephonyManager.EXTRA_INCOMING_NUMBER);
        handleCall(ctx, intent);
    }

/*
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
    */

    private void handleCall(Context ctx, Intent intent/*, DatabaseReference ref, String phone, String eventType*/) {
        //String mission = intent.getExtras()!=null ? intent.getExtras().getString("mission") : null;
        String stateStr = intent.getExtras().getString(TelephonyManager.EXTRA_STATE);
        //int state = 0;
        if(stateStr.equals(TelephonyManager.EXTRA_STATE_IDLE)){
            /*
            state = TelephonyManager.CALL_STATE_IDLE;

            // We can get the Mission name from the User object !!!!
            MissionItemEvent m = new MissionItemEvent(new Date().toString(), "call ended", User.getInstance().getUid(), User.getInstance().getName(), mission, phone);
            ref.push().setValue(m);
            ref.child(phone).push().setValue(m);
            */
            String volunteerPhone = getVolunteerPhone(ctx);
            User.getInstance().callEnded(volunteerPhone);
        }

        /*
        else if(stateStr.equals(TelephonyManager.EXTRA_STATE_OFFHOOK)){
              //See TestCallFragment - don't try to write to the db here when the call starts
              //The phone is already off the hook, so some carriers like Sprint block internet access while you're on a call

            state = TelephonyManager.CALL_STATE_OFFHOOK;
            MissionItemEvent m = new MissionItemEvent(new Date().toString(), eventType, User.getInstance().getUid(), User.getInstance().getName(), mission, phone);
            ref.push().setValue(m);
            ref.child(phone).push().setValue(m);
        }

        else if(stateStr.equals(TelephonyManager.EXTRA_STATE_RINGING)){
            state = TelephonyManager.CALL_STATE_RINGING;
        }
        */
    }

    private String getVolunteerPhone(Context ctx) {
        TelephonyManager mTelephonyMgr;
        mTelephonyMgr = (TelephonyManager) ctx.getSystemService(Context.TELEPHONY_SERVICE);
        String tel = "Android Phone # n/a"; //mTelephonyMgr.getLine1Number();
        return tel;
    }
}
