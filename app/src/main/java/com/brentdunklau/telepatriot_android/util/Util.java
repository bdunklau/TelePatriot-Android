package com.brentdunklau.telepatriot_android.util;

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

}
