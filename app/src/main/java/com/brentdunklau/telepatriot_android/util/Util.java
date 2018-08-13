package com.brentdunklau.telepatriot_android.util;

import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;

import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Created by bdunklau on 6/21/18.
 */

// modeled after the Util class in Swift
public class Util {

    public static long getDate_as_millis() {
        return System.currentTimeMillis();
    }

    public static String getDate_Day_MMM_d_hmmss_am_z_yyyy() {
        return getDate("EEE MMM d, h:mm:ss a z yyyy");
    }


    public static String getDate_MMM_d_yyyy_hmm_am_z() {
        return getDate("MMM d, yyyy h:mm a z"); // i.e.  Jan 13, 2018 2:15 pm CST
    }


    private static String getDate(String withFormat) {
        return new SimpleDateFormat(withFormat).format(new Date());
    }


    // We have this kind of method is a couple different places.  I created this one here
    // on 6/23/18 because I wanted to enable calling from the Legislator dialog when doing
    // video chats.  I knew that we were checking for permissions in MyMissionFragment so
    // I copied that method over to here.
    // https://developer.android.com/training/permissions/requesting.html
    public static void checkPhonePermission(Context ctx) {
        checkPermission(ctx, android.Manifest.permission.CALL_PHONE);
    }

    // I moved these 2 methods over to LauncherActivity because, in production, I'm getting
    // an app crash on the very first phone call.  Thinking that I'm requesting permission
    // too late ... ?
    private static void checkPermission(Context ctx, String androidPermission) {// Here, thisActivity is the current activity
        if (ContextCompat.checkSelfPermission(ctx, androidPermission)
                != PackageManager.PERMISSION_GRANTED) {

            // Should we show an explanation?
            if (ActivityCompat.shouldShowRequestPermissionRationale((Activity) ctx, androidPermission)) {

                // Show an explanation to the user *asynchronously* -- don't block
                // this thread waiting for the user's response! After the user
                // sees the explanation, try again to request the permission.

            } else {

                // No explanation needed, we can request the permission.

                ActivityCompat.requestPermissions((Activity) ctx,
                        new String[]{androidPermission},
                        1 /*MY_PERMISSIONS_REQUEST_READ_CONTACTS*/);

                // MY_PERMISSIONS_REQUEST_READ_CONTACTS is an
                // app-defined int constant. The callback method gets the
                // result of the request.
            }
        }
    }

}