package com.brentdunklau.telepatriot_android.util;

import android.accounts.Account;
import android.net.Uri;
import android.support.annotation.NonNull;

import com.google.android.gms.auth.AccountChangeEvent;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.UserProfileChangeRequest;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.messaging.FirebaseMessaging;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

/**
 * Created by bdunklau on 10/3/17.
 */

public class User implements FirebaseAuth.AuthStateListener {

    private FirebaseDatabase database;
    private DatabaseReference userRef;
    //private List<String> teamNames = new ArrayList<String>();
    private boolean isAdmin, isDirector, isVolunteer;
    private String recruiter_id, missionItemId, missionId;
    private MissionDetail missionItem;
    private String current_video_node_key;

    private Team currentTeam;
    //private List<Team> teams = new ArrayList<Team>();
    private ChildEventListener childEventListener;
    private static User singleton;
    private List<AccountStatusEvent.Listener> accountStatusEventListeners = new ArrayList<AccountStatusEvent.Listener>();

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
        boolean bool = getFirebaseUser() != null;
        return bool;
    }


    private FirebaseUser getFirebaseUser() {
        return FirebaseAuth.getInstance().getCurrentUser();
    }


    /**
     * THIS METHOD IS STARTING TO LOOK LIKE A JUNK DRAWER - CLEAN IT UP
     */
    private void login(/*FirebaseUser firebaseUser*/) {
        /**
         * NOTE: No point in checking to see if the user is logged in already via getFirebaseUser() != null
         */
        this.database = FirebaseDatabase.getInstance();
        childEventListener = new ChildEventAdapter();
        final String name = getName();

        database.getReference("/no_roles/"+getUid()).addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                // if dataSnapshot is null, then the user has been assigned to a role
                // if not null, then we need to send the user to LimboActivity
                Object o = dataSnapshot.getValue();
                if(o != null ) {
                    // send to LimboActivity
                    fireNoRolesEvent();
                }
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {

            }
        });

        userRef = database.getReference("/users/"+getUid());
        // redundant because we're getting roles and topics below also
        // Don't just listen for the SingleValueEvent because this method gets called before the trigger
        // can write to the /users node
        // BUUUUUUUT this also gets called when anything happens to the user's account including when
        // the account is DELETED.  That's a serious "code smell" to be executing code in the login() method
        // when an account is deleted.
        userRef.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                UserBean ub = dataSnapshot.getValue(UserBean.class);
                if(ub != null)
                    User.this.recruiter_id = ub.getRecruiter_id();
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {

            }
        });
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


        userRef.child("current_team").limitToFirst(1).addChildEventListener(new ChildEventListener() {
            @Override
            public void onChildAdded(DataSnapshot dataSnapshot, String s) {
                String team_name = dataSnapshot.getKey(); // don't end up using this here
                // team nodes are keyed by the team name and they also have a "team_name" node
                // under the key that is also the name of the team.  The team_name node is so
                // that we can take advantage of the deserialization function built in to firebase
                Team team = dataSnapshot.getValue(Team.class);
                //setCurrentTeam(team);
                User.this.currentTeam = team;
                fireTeamSelected(User.this.currentTeam);
            }

            @Override
            public void onChildChanged(DataSnapshot dataSnapshot, String s) {

            }

            @Override
            public void onChildRemoved(DataSnapshot dataSnapshot) {
            }

            @Override
            public void onChildMoved(DataSnapshot dataSnapshot, String s) {

            }

            @Override
            public void onCancelled(DatabaseError databaseError) {

            }
        });


        userRef.child("current_video_node_key").addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                User.this.current_video_node_key = dataSnapshot.getValue(String.class);
                System.out.println("onDataChange(): current_video_node_key = "+User.this.current_video_node_key);
            }

            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });

    }

    private void onSignout() {
        if(userRef == null)
            return;

        accountStatusEventListeners.clear();

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

        unassignCurrentMissionItem();
    }

    public void setCurrentMissionItem(String missionItemId, MissionDetail missionItem) {
        this.missionItemId = missionItemId;
        this.missionItem = missionItem;
        this.missionId = missionItem.getMission_id();
    }

    public MissionDetail getCurrentMissionItem() {
        return missionItem;
    }

    public void unassignCurrentMissionItem() {
        if(missionItem == null)
            return;
        missionItem.unassign(missionItemId);
        missionItemId = null;
        missionItem = null;
    }

    // called from MissionItemWrapUpFragment when the user submit the notes at the end of a call
    public void submitWrapUp(String outcome, String notes) {
        String team = User.getInstance().getCurrentTeamName();
        FirebaseDatabase.getInstance().getReference("teams/"+team+"/mission_items/"+missionItemId).removeValue();
        DatabaseReference ref = FirebaseDatabase.getInstance().getReference("teams/"+team+"/missions/"+missionId+"/mission_items/"+missionItemId);

        // TODO this should be a multi-path update
        ref.child("accomplished").setValue("complete");
        ref.child("active").setValue(false);
        ref.child("active_and_accomplished").setValue("false_complete");
        ref.child("outcome").setValue(outcome);
        ref.child("notes").setValue(notes);
        ref.child("completed_by_uid").setValue(getUid());
        ref.child("completed_by_name").setValue(getName());
        ref.child("mission_complete_date").setValue(new SimpleDateFormat("MMM d, yyyy h:mm a z").format(new Date()));
        ref.child("uid_and_active").setValue(getUid()+"_false");
        missionItemId = null;
        missionItem = null;
    }

    // similar to AppDelegate.onCallEnded() on iOS
    public void completeMissionItem(String myPhone) {
        if(missionItem == null || missionItemId == null || missionItem._isAccomplished())
            return;
        missionItem.complete(missionItemId);

        String team = User.getInstance().getCurrentTeamName();
        DatabaseReference ref = FirebaseDatabase.getInstance().getReference("teams/"+team+"/activity");

        String volunteerPhone = myPhone;
        String supporterName = missionItem.getName();
        MissionItemEvent m = new MissionItemEvent("ended call to", getUid(), getName(), missionItem.getMission_name(), missionItem.getPhone(), volunteerPhone, supporterName);
        ref.child("all").push().setValue(m);
        ref.child("by_phone_number").child(missionItem.getPhone()).push().setValue(m);
    }

    public String getName() {
        return getFirebaseUser()!=null ? getFirebaseUser().getDisplayName() : "name not available";
    }

    public void update(String name, final String email, String photoUrl, final OnCompleteListener<Void> listener) {
        //UpdateProfileChangeRequest upc = new UpdateProfileChangeRequest();
        //FirebaseAuth.getInstance().getCurrentUser().up//.updateProfile();new UpdateProfileChangeRequest() { });
        //FirebaseAuth.getInstance().getCurrentUser().updateEmail(email);

        final FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();

        UserProfileChangeRequest profileUpdates = new UserProfileChangeRequest.Builder()
                .setDisplayName(name)
                .setPhotoUri(Uri.parse(photoUrl))
                .build();

        user.updateProfile(profileUpdates)
                .addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        boolean succ = task.isSuccessful();
                        if (succ) {
                            //Log.d(TAG, "User profile updated.");
                            user.updateEmail(email).addOnCompleteListener(listener);
                        }
                    }
                });
    }

    public String getUid() {
        return getFirebaseUser()!=null ? getFirebaseUser().getUid() : "uid not available";
    }

    public String getEmail() {
        if(getFirebaseUser()==null) {
            return "";
        }
        else if(getFirebaseUser().getEmail()==null || getFirebaseUser().getEmail().trim().equals("")) {
            return "Email Required (touch here)";
        }
        return getFirebaseUser().getEmail();
    }

    public boolean isEmailMissing() {
        return getFirebaseUser()!=null && (getFirebaseUser().getEmail()==null || getFirebaseUser().getEmail().trim().equals(""));
    }

    public void setRecruiter_id(final String recruiter_id) {
        database.getReference("/users/"+getUid()+"/recruiter_id").setValue(recruiter_id).addOnCompleteListener(new OnCompleteListener<Void>() {
            @Override
            public void onComplete(@NonNull Task<Void> task) {
                User.this.recruiter_id = recruiter_id;
            }
        });
    }

    public String getRecruiter_id() {
        return recruiter_id;
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

    public boolean hasAnyRole() {
        return isAdmin || isDirector || isVolunteer;
    }

    @Override
    public void onAuthStateChanged(@NonNull FirebaseAuth firebaseAuth) {
        FirebaseUser firebaseUser = firebaseAuth.getCurrentUser();
        if(firebaseUser != null) {
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
            fireRoleAdded(dataSnapshot.getKey());
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
            fireRoleRemoved(dataSnapshot.getKey());
        }

        @Override
        public void onChildMoved(DataSnapshot dataSnapshot, String s) {

        }

        @Override
        public void onCancelled(DatabaseError databaseError) {

        }
    }

    public Team getCurrentTeam() {
        return currentTeam;
    }

    public String getCurrentTeamName() {
        return currentTeam != null ? currentTeam.getTeam_name() : "No Team Selected";
    }

    public void setCurrentTeam(Team currentTeam) {
        HashMap map = new HashMap();
        map.put(currentTeam.getTeam_name(), currentTeam);
        userRef.child("current_team").setValue(map);
        fireTeamSelected(currentTeam);
    }

    public String getCurrent_video_node_key() {
        return current_video_node_key;
    }

    public void setCurrent_video_node_key(final String current_video_node_key) {
        this.current_video_node_key = current_video_node_key;
        database.getReference("/users/"+getUid()+"/current_video_node_key").setValue(current_video_node_key);
    }

    public void addAccountStatusEventListener(AccountStatusEvent.Listener l) {
        if(!accountStatusEventListeners.contains(l))
            accountStatusEventListeners.add(l);
    }

    // fired when the user is recorded under the /no_roles node
    // When this happens, the user is sent to the LimboActivity screen
    // assuming he hasn't been deactivated
    private void fireNoRolesEvent() {
        AccountStatusEvent.NoRoles nr = new AccountStatusEvent.NoRoles();
        for(AccountStatusEvent.Listener l : accountStatusEventListeners) {
            l.fired(nr);
        }
    }

    private void fireRoleAdded(String role) {
        AccountStatusEvent.RoleAdded nr = new AccountStatusEvent.RoleAdded(role);
        for(AccountStatusEvent.Listener l : accountStatusEventListeners) {
            l.fired(nr);
        }
    }

    private void fireRoleRemoved(String role) {
        AccountStatusEvent.RoleRemoved nr = new AccountStatusEvent.RoleRemoved(role);
        for(AccountStatusEvent.Listener l : accountStatusEventListeners) {
            l.fired(nr);
        }
    }

    private void fireTeamSelected(Team team) {
        AccountStatusEvent.TeamSelected evt = new AccountStatusEvent.TeamSelected(team.getTeam_name());
        for(AccountStatusEvent.Listener l : accountStatusEventListeners) {
            l.fired(evt);
        }
    }

}
