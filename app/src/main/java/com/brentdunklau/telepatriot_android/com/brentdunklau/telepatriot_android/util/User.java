package com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util;

import com.brentdunklau.telepatriot_android.AdminActivity;
import com.brentdunklau.telepatriot_android.DirectorActivity;
import com.brentdunklau.telepatriot_android.MainActivity;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.messaging.FirebaseMessaging;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by bdunklau on 10/3/17.
 */

public class User {

    private FirebaseUser firebaseUser;
    private FirebaseDatabase database;
    private DatabaseReference rolesRef;
    private boolean isAdmin, isDirector, isVolunteer;
    private ChildEventListener childEventListener;
    private static User singleton;
    private List<RoleAssignedListener> roleAssignedListeners = new ArrayList<RoleAssignedListener>();

    public static User getInstance() {
        if(singleton == null) {
            singleton = new User();
        }
        return singleton;
    }

    public static User getInstance(FirebaseUser firebaseUser) {
        if(singleton == null) {
            singleton = new User();
            singleton.login(firebaseUser);
        }
        return singleton;
    }

    public void login(FirebaseUser firebaseUser) {
        this.firebaseUser = firebaseUser;
        this.database = FirebaseDatabase.getInstance();
        FirebaseMessaging.getInstance().subscribeToTopic("AccountEvents");
        childEventListener = new ChildEventAdapter();

        rolesRef = database.getReference("/users/"+firebaseUser.getUid()+"/roles");
        rolesRef.addChildEventListener(childEventListener);
    }

    private User() {

    }

    public void onSignout() {
        rolesRef.removeEventListener(childEventListener);
    }

    public String getName() {
        return firebaseUser.getDisplayName();
    }

    public String getUid() {
        return firebaseUser.getUid();
    }

    public String getEmail() {
        return firebaseUser.getEmail();
    }

    public boolean isAdmin() {
        return isAdmin;
    }

    public boolean isDirector() {
        return isDirector;
    }

    public boolean isVolunteer() {
        return isVolunteer;
    }

    private class ChildEventAdapter implements ChildEventListener {
        @Override
        public void onChildAdded(DataSnapshot dataSnapshot, String s) {
            boolean notAssignedYet = !isAdmin && !isDirector && !isVolunteer;
            doRole(dataSnapshot.getKey(), true);
            if(notAssignedYet)
                User.this.fireRoleAssignedEvent(dataSnapshot.getKey());
        }

        private void doRole(String role, boolean val) {
            if(role.equalsIgnoreCase("admin"))
                isAdmin = val;
            else if(role.equalsIgnoreCase("director"))
                isDirector = val;
            else if(role.equalsIgnoreCase("volunteer"))
                isVolunteer = val;
        }

        @Override
        public void onChildChanged(DataSnapshot dataSnapshot, String s) {

        }

        @Override
        public void onChildRemoved(DataSnapshot dataSnapshot) {
            doRole(dataSnapshot.getKey(), false);
        }

        @Override
        public void onChildMoved(DataSnapshot dataSnapshot, String s) {

        }

        @Override
        public void onCancelled(DatabaseError databaseError) {

        }
    }

    public Class activityOnTheLeft(Class currentActivity) {
        if(currentActivity.equals(AdminActivity.class))
            return null; // nothing to the left of the AdminActivity
        else if(currentActivity.equals(DirectorActivity.class))
            return isAdmin() ? AdminActivity.class : null;
        else if(currentActivity.equals(MainActivity.class))
            return isAdmin() ? AdminActivity.class : null;
        /**
         * Add condition for isVolunteer() when that's written
         */
        else return null;
    }

    public Class activityOnTheRight(Class currentActivity) {
        if(currentActivity.equals(AdminActivity.class))
            return isDirector() ? DirectorActivity.class : isVolunteer() ? null/*VolunteerActivity.class*/ : null;
        else if(currentActivity.equals(DirectorActivity.class))
            return isVolunteer() ? null/*VolunteerActivity.class*/ : null;
        else if(currentActivity.equals(MainActivity.class))
            return isDirector() ? DirectorActivity.class : isVolunteer() ? null/*VolunteerActivity.class*/ : null;
        /**
         * Actually don't NEED a condition here for isVolunteer() because we are saying
         * that there is always nothing to the right of the Volunteer activity
         */
        else return null;
    }

    void fireRoleAssignedEvent(String role) {
        List<RoleAssignedListener> removeThese = new ArrayList<RoleAssignedListener>();
        for(RoleAssignedListener roleAssignedListener : roleAssignedListeners) {
            roleAssignedListener.roleAssigned(role);
            if(roleAssignedListener instanceof OneTime)
                removeThese.add(roleAssignedListener);
        }
        // remove any OneTime listeners...
        for(RoleAssignedListener rem : removeThese) {
            boolean removed = roleAssignedListeners.remove(rem);
            if(removed) ; // just for debugging
        }
    }

    public void addRoleAssignedListener(RoleAssignedListener roleAssignedListener) {
        roleAssignedListeners.add(roleAssignedListener);
    }

}
