package com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.util.Date;
import java.util.HashMap;

/**
 * Created by bdunklau on 10/6/2017.
 */

public class DbLog {
    private static DbLog dbLog;
    private FirebaseDatabase database;
    private DatabaseReference log1;
    private DbLog() {
        database = FirebaseDatabase.getInstance();
        log1 = database.getReference("logs");
    }

    public static DbLog getInstance() {
        if(dbLog == null) {
            dbLog = new DbLog();
        }
        return dbLog;
    }

    public static void d(String name, String msg) {
        HashMap<String, String> m = new HashMap<String, String>();
        m.put("date", new Date().toString());
        m.put("name", name);
        m.put("msg", msg);
        getInstance().log1.push().setValue(m);
    }
}
