package com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util;

import android.util.Log;

import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.messaging.FirebaseMessaging;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by bdunklau on 10/3/17.
 */

public class User {

    private FirebaseUser firebaseUser;
    private FirebaseDatabase database;
    private DatabaseReference userRef;
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
        childEventListener = new ChildEventAdapter();
        final String name = firebaseUser.getDisplayName();

        userRef = database.getReference("/users/"+firebaseUser.getUid());
        userRef.child("roles").addChildEventListener(childEventListener);

        userRef.child("topics").addChildEventListener(new ChildEventListener() {
            @Override
            public void onChildAdded(DataSnapshot dataSnapshot, String s) {
                String topic = dataSnapshot.getKey();
                DbLog.d(name, "subscribing to topic: "+topic);
                FirebaseMessaging.getInstance().subscribeToTopic(topic);
            }

            @Override
            public void onChildChanged(DataSnapshot dataSnapshot, String s) {

            }

            @Override
            public void onChildRemoved(DataSnapshot dataSnapshot) {
                String topic = dataSnapshot.getKey();
                FirebaseMessaging.getInstance().unsubscribeFromTopic(topic);
            }

            @Override
            public void onChildMoved(DataSnapshot dataSnapshot, String s) {

            }

            @Override
            public void onCancelled(DatabaseError databaseError) {

            }
        });
    }

    private User() {

    }

    public void onSignout() {
        userRef.removeEventListener(childEventListener);
        final String name = firebaseUser.getDisplayName();

        database.getReference("/users/"+firebaseUser.getUid()+"/topics").addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                Object o = dataSnapshot.getValue();
                HashMap topics = (HashMap)o;
                Log.d("c", "s");
                for(Object topic : topics.keySet()) {
                    DbLog.d(name, "unsubscribing to topic: "+topic);
                    FirebaseMessaging.getInstance().unsubscribeFromTopic(topic.toString());
                }
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {

            }
        });
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
