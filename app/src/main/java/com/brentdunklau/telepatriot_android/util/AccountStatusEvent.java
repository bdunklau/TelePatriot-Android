package com.brentdunklau.telepatriot_android.util;

import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Created by bdunklau on 10/2/2017.
 */

public class AccountStatusEvent {

    String date; // might want this to be a Date
    String event;

    public AccountStatusEvent() {
        // needed for firebase
        // see:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
    }

    public AccountStatusEvent(String date, String event) {
        this.date = date;
        this.event = event;
    }

    public String getDate() {
        return date;
    }

    public String getEvent() {
        return event;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public void setEvent(String event) {
        this.event = event;
    }

    // make the Activities be Listeners so that when stuff happens in the User object,
    // we can switch screens accordingly
    public interface Listener {
        public void fired(AccountStatusEvent evt);
    }

    public static class NoRoles extends AccountStatusEvent {
        NoRoles() {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), "No roles assigned");
        }
    }

    public static class RoleAdded extends AccountStatusEvent {
        RoleAdded(String role) {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), role);
        }
    }

    public static class RoleRemoved extends AccountStatusEvent {
        RoleRemoved(String role) {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), role);
        }
    }

    public static class TeamSelected extends AccountStatusEvent {
        TeamSelected(String team_name) {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), team_name);
        }
    }

    public static class TeamAdded extends AccountStatusEvent {
        TeamAdded(String team_name) {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), team_name);
        }
    }

    public static class TeamRemoved extends AccountStatusEvent {
        TeamRemoved(String team_name) {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), team_name);
        }
    }

}
