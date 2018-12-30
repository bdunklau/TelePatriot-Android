package com.brentdunklau.telepatriot_android.util;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;

import java.util.Date;

/**
 * Created by bdunklau on 10/23/17.
 */

public class PhoneBroadcastReceiver extends BroadcastReceiver {

    private static final String TAG = "PhoneBroadcastReceiver";


    //The receiver will be recreated whenever android feels like it.  We need a static variable to remember data between instantiations
    static PhonecallStartEndDetector listener;
    String outgoingSavedNumber;
    protected Context savedContext;


    @Override
    public void onReceive(Context context, Intent intent) {
        String method = "onReceive";
        debug(method, "[method begin] [Context: "+context.getClass().getName()+"] [Intent: "+intent.getClass().getName()+"]");
        savedContext = context;
        if(listener == null){
            listener = new PhonecallStartEndDetector();
        }

        debug(method, "registering PhonecallStartEndDetector with TelephonyManager");
        TelephonyManager telephony = (TelephonyManager)context.getSystemService(Context.TELEPHONY_SERVICE);
        telephony.listen(listener, PhoneStateListener.LISTEN_CALL_STATE);
    }

    //Derived classes should override these to respond to specific events of interest
    protected void onIncomingCallStarted(String number, Date start) {
        String method = "onIncomingCallStarted(String number="+number+", Date start="+start+")";
        debug(method, "method begin");
    }
    protected void onOutgoingCallStarted(String number, Date start) {
        String method = "onOutgoingCallStarted(String number="+number+", Date start="+start+")";
        debug(method, "method begin");

    }
    protected void onIncomingCallEnded(String number, Date start, Date end) {
        String method = "onIncomingCallEnded(String number="+number+", Date start="+start+", Date end="+end+")";
        debug(method, "method begin");

    }
    protected void onOutgoingCallEnded(String number, Date start, Date end) {
        String method = "onOutgoingCallEnded(String number="+number+", Date start="+start+", Date end="+end+")";
        debug(method, "method begin");
        User.getInstance().callEnded();

    }
    protected void onMissedCall(String number, Date start) {
        String method = "onMissedCall(String number="+number+", Date start="+start+")";
        debug(method, "method begin");
    }

    private void debug(String method, String message) {
        AppLog.debug(User.getInstance(), TAG, method, message);
    }

    //Deals with actual events
    public class PhonecallStartEndDetector extends PhoneStateListener {
        private static final String INNER_TAG = "$PhonecallStartEndDetector.";

        int lastState = TelephonyManager.CALL_STATE_IDLE;
        Date callStartTime;
        boolean isIncoming;
        String savedNumber;  //because the passed incoming is only valid in ringing

        public PhonecallStartEndDetector() {}

        //Incoming call-  goes from IDLE to RINGING when it rings, to OFFHOOK when it's answered, to IDLE when its hung up
        //Outgoing call-  goes from IDLE to OFFHOOK when it dials out, to IDLE when hung up
        @Override
        public void onCallStateChanged(int state, String incomingNumber) {
            String method = INNER_TAG+"onCallStateChanged(int state="+state+", String incomingNumber: "+incomingNumber+")";

            debug(method, "method begin");

            super.onCallStateChanged(state, incomingNumber);
            if(lastState == state){
                //No change, debounce extras
                debug(method, "return early because lastState == state");
                return;
            }
            switch (state) {
                case TelephonyManager.CALL_STATE_RINGING:
                    isIncoming = true;
                    callStartTime = new Date();
                    savedNumber = incomingNumber;
                    onIncomingCallStarted(incomingNumber, callStartTime);
                    break;
                case TelephonyManager.CALL_STATE_OFFHOOK:
                    //Transition of ringing->offhook are pickups of incoming calls.  Nothing donw on them
                    if(lastState != TelephonyManager.CALL_STATE_RINGING){
                        isIncoming = false;
                        callStartTime = new Date();
                        onOutgoingCallStarted(savedNumber, callStartTime);
                    }
                    break;
                case TelephonyManager.CALL_STATE_IDLE:
                    //Went to idle-  this is the end of a call.  What type depends on previous state(s)
                    if(lastState == TelephonyManager.CALL_STATE_RINGING){
                        //Ring but no pickup-  a miss
                        onMissedCall(savedNumber, callStartTime);
                    }
                    else if(isIncoming){
                        onIncomingCallEnded(savedNumber, callStartTime, new Date());
                    }
                    else{
                        onOutgoingCallEnded(savedNumber, callStartTime, new Date());
                    }
                    break;
            }
            lastState = state;
        }

    }


//    @Override
//    public void onReceive(Context context, Intent intent) {
//        AppLog.debug(User.getInstance(), TAG, "onReceive", "method begin");
//
//        if(intent.getAction().equals("android.intent.action.PHONE_STATE")) {
//            AppLog.debug(User.getInstance(), TAG, "onReceive", "OK: intent.getAction() = android.intent.action.PHONE_STATE");
//            handlePhoneState(context, intent);
//        }
//    }
//
//
//    //  https://www.studytutorial.in/android-phonestatelistener-phone-call-broadcast-receiver-tutorial
//    private void handlePhoneState(Context ctx, Intent intent) {
//        handleCall(ctx, intent);
//    }
//
//    private void handleCall(Context ctx, Intent intent/*, DatabaseReference ref, String phone, String eventType*/) {
//
//        String stateStr = intent.getExtras().getString(TelephonyManager.EXTRA_STATE);
//
//        AppLog.debug(User.getInstance(), TAG, "handleCall", "[Context: "+ctx.getClass().getName()+"] " +
//                "[Intent: "+intent.getClass().getName()+"] [TelephonyManager.EXTRA_STATE: "+stateStr+"]");
//
//        //int state = 0;
//        if(stateStr.equals(TelephonyManager.EXTRA_STATE_IDLE)){
//            String volunteerPhone = getVolunteerPhone(ctx);
//            User.getInstance().callEnded(volunteerPhone);
//        }
//    }
//
//    private String getVolunteerPhone(Context ctx) {
//        TelephonyManager mTelephonyMgr;
//        mTelephonyMgr = (TelephonyManager) ctx.getSystemService(Context.TELEPHONY_SERVICE);
//        String tel = "Android Phone # n/a"; //mTelephonyMgr.getLine1Number();
//        return tel;
//    }
}
