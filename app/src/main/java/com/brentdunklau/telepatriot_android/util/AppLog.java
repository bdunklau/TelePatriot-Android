package com.brentdunklau.telepatriot_android.util;

import com.google.firebase.database.FirebaseDatabase;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by bdunklau on 12/24/18.
 */

public class AppLog {
    private static AppLog l;
    private AppLog() {
        super();
    }

    private static AppLog getInstance() {
        if(l == null)
            l = new AppLog();
        return l;
    }

    public static void error(User user, String clazz, String method, String message) {
        getInstance()._log(user, clazz, method, message, "error");
    }

    public static void info(User user, String clazz, String method, String message) {
        getInstance()._log(user, clazz, method, message, "info");
    }

    public static void info(String uid, String name, String clazz, String method, String message) {
        getInstance()._log(uid, name, clazz, method, message, "info");
    }

    public static void debug(User user, String clazz, String method, String message) {
        getInstance()._log(user, clazz, method, message, "debug");
    }

    private void _log(User user, String clazz, String method, String message, String level) {
        _log(user.getUid(), user.getName(), clazz, method, message, level);
    }

    private void _log(String uid, String name, String clazz, String method, String message, String level) {
        Map<String, Object> data = new HashMap<String, Object>();
        data.put("uid", uid);
        data.put("name", name);
        data.put("class", clazz);
        data.put("method", method);
        data.put("message", message);
        data.put("level", level);
        data.put("date_ms", Util.getDate_as_millis());
        data.put("date", Util.getDate_yyyy_MM_dd_h_mm_ss_SSS_a_z());
        FirebaseDatabase.getInstance().getReference("log/all-logs").push().setValue(data);
    }
}
