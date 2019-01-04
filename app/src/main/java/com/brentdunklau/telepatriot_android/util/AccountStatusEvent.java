package com.brentdunklau.telepatriot_android.util;

import com.brentdunklau.telepatriot_android.citizenbuilder.CBMissionDetail;

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

    public static class NameChanged extends AccountStatusEvent {
        String name;
        NameChanged(String name) {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), name);
            this.name = name;
        }
        public String getName() { return name; }
    }

    public static class EmailChanged extends AccountStatusEvent {
        String email;
        EmailChanged(String email) {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), email);
            this.email = email;
        }
        public String getEmail() { return email; }
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

    public static class Allowed extends AccountStatusEvent {
        public Allowed() {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), "user allowed access");
        }
    }

    // means the user has not met the legal requirements to be granted access to the app
    // so they either haven't signed the petition, the conf agreement, or they are banned
    public static class NotAllowed extends AccountStatusEvent {
        NotAllowed() {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), "user not allowed access");
        }
    }

    public static class AccountEnabled extends AccountStatusEvent {
        AccountEnabled() {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), "user account enabled");
        }
    }

    public static class AccountDisabled extends AccountStatusEvent {
        AccountDisabled() {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), "user account disabled");
        }
    }

    // not really an account status event
    public static class CallEnded extends AccountStatusEvent {
        CBMissionDetail cbMissionDetail;
        CallEnded(CBMissionDetail cbMissionDetail) {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), "CitizenBuilder mission completed");
            this.cbMissionDetail = cbMissionDetail;
        }
        public CBMissionDetail getCbMissionDetail() {
            return cbMissionDetail;
        }
    }

    public static class VideoInvitationExtended extends AccountStatusEvent {
        public VideoInvitationExtended() {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), "video invitation extended");
        }
    }

    public static class LegalAttributesChanged extends AccountStatusEvent {
        public LegalAttributesChanged() {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), "video invitation extended");
        }
    }

    public static class VideoInvitationRevoked extends AccountStatusEvent {
        public VideoInvitationRevoked() {
            super(new SimpleDateFormat("EEE MMM d, yyyy h:mm a z").format(new Date()), "video invitation revoked");
        }
    }

}
