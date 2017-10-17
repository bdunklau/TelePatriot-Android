package com.brentdunklau.telepatriot_android.util;

import android.support.annotation.NonNull;

import com.google.firebase.auth.FirebaseAuth;
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

/**
 * Created by bdunklau on 10/3/17.
 */

public class User implements FirebaseAuth.AuthStateListener {

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

    private User() {
        FirebaseAuth.getInstance().addAuthStateListener(this);
    }

    public boolean isLoggedIn() {
        return getFirebaseUser() != null;
    }
/*
    public static User getInstance(FirebaseUser firebaseUser) {
        if(singleton == null) {
            singleton = new User();
            singleton.login(firebaseUser);
        }
        return singleton;
    }*/

    private FirebaseUser getFirebaseUser() {
        return FirebaseAuth.getInstance().getCurrentUser();
    }

    private void login(/*FirebaseUser firebaseUser*/) {
        /**
         * NOTE: No point in checking to see if the user is logged in already via getFirebaseUser() != null
         * If that is how we
         */
        this.database = FirebaseDatabase.getInstance();
        childEventListener = new ChildEventAdapter();
        final String name = getName();

        userRef = database.getReference("/users/"+getUid());
        userRef.child("roles").addChildEventListener(childEventListener);

        userRef.child("topics").addChildEventListener(new ChildEventListener() {
            @Override
            public void onChildAdded(DataSnapshot dataSnapshot, String s) {
                String topic = dataSnapshot.getKey();
                DbLog.d("subscribing to topic: "+topic);
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

    private void onSignout() {
        if(userRef == null)
            return;

        userRef.removeEventListener(childEventListener);

        database.getReference("/users/"+getUid()+"/topics").addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                Object o = dataSnapshot.getValue();
                // WILL BE NULL for new users that logout before being assigned to any roles
                if(o == null)
                    return;
                HashMap topics = (HashMap)o;
                for(Object topic : topics.keySet()) {
                    DbLog.d("unsubscribing to topic: "+topic);
                    FirebaseMessaging.getInstance().unsubscribeFromTopic(topic.toString());
                }
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {

            }
        });
    }

    public String getName() {
        return getFirebaseUser()!=null ? getFirebaseUser().getDisplayName() : "name not available";
    }

    public String getUid() {
        return getFirebaseUser()!=null ? getFirebaseUser().getUid() : "uid not available";
    }

    public String getEmail() {
        return getFirebaseUser()!=null ? getFirebaseUser().getEmail() : "uid not available";
    }

    public String getPhotoURL() {
        return getFirebaseUser()==null || getFirebaseUser().getPhotoUrl()==null ? "https://i.stack.imgur.com/34AD2.jpg" : getFirebaseUser().getPhotoUrl().toString();
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

    public boolean isVolunteerOnly() {
        return isVolunteer && !isDirector && !isAdmin;
    }

    @Override
    public void onAuthStateChanged(@NonNull FirebaseAuth firebaseAuth) {
        FirebaseUser firebaseUser = firebaseAuth.getCurrentUser();
        if(firebaseUser != null) {
            String name = firebaseUser.getDisplayName();
            login();
        }
        else {
            onSignout();
        }
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
