package com.brentdunklau.telepatriot_android.util;

import android.accounts.Account;
import android.net.Uri;
import android.support.annotation.NonNull;
import android.util.Log;

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
    private Integer citizen_builder_id;
    private boolean isAdmin, isDirector, isVolunteer, isVideoCreator;
    private String recruiter_id, missionItemId, missionId;
    private MissionDetail missionItem;
    private String current_video_node_key;
    private String account_disposition;
    private boolean has_signed_petition;
    private boolean has_signed_confidentiality_agreement;
    private boolean is_banned;
    private String phone;
    private String residential_address_line1;
    private String residential_address_line2;
    private String residential_address_city;
    private String residential_address_state_abbrev;
    private String residential_address_zip;
    private String state_upper_district;
    private String state_lower_district;
    private String video_invitation_from; // uid of someone that invited this person to a video chat
    private String video_invitation_from_name; // name of someone that invited this person to a video chat

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

    private void log(String s) {
//        for(int i=0; i < 20; i++) {
//            Log.i("User", s);
//        }
    }

    /**
     * THIS METHOD IS STARTING TO LOOK LIKE A JUNK DRAWER - CLEAN IT UP
     */
    private void login(/*FirebaseUser firebaseUser*/) {
        log(".login() ************************");
        /**
         * NOTE: No point in checking to see if the user is logged in already via getFirebaseUser() != null
         */
        this.database = FirebaseDatabase.getInstance();
        childEventListener = new ChildEventAdapter();
        final String name = getName();

//        database.getReference("/no_roles/"+getUid()).addValueEventListener(new ValueEventListener() {
//            @Override
//            public void onDataChange(DataSnapshot dataSnapshot) {
//                // if dataSnapshot is null, then the user has been assigned to a role
//                // if not null, then we need to send the user to LimboActivity
//                Object o = dataSnapshot.getValue();
//                if(o != null ) {
//                    // send to LimboActivity
//                    fireNoRolesEvent();
//                }
//            }
//
//            @Override
//            public void onCancelled(DatabaseError databaseError) {
//
//            }
//        });

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
                if(ub != null) {
                    account_disposition = ub.getAccount_disposition();
                    redirectIfNotAllowed(ub);
                    User.this.recruiter_id = ub.getRecruiter_id();
                    boolean inviterId_null_to_notnull = User.this.video_invitation_from == null && ub.getVideo_invitation_from()!=null;
                    boolean inviterId_notnull_to_null = User.this.video_invitation_from != null && ub.getVideo_invitation_from()==null;
                    boolean nameChanged = ub.getVideo_invitation_from_name() != null && !ub.getVideo_invitation_from_name().equalsIgnoreCase(User.this.video_invitation_from_name);

                    User.this.has_signed_petition = ub.getHas_signed_petition() == null ? false : ub.getHas_signed_petition();
                    User.this.has_signed_confidentiality_agreement = ub.getHas_signed_confidentiality_agreement() == null ? false : ub.getHas_signed_confidentiality_agreement();
                    User.this.is_banned = ub.getIs_banned() == null ? false : ub.getIs_banned();
                    User.this.citizen_builder_id = ub.getCitizen_builder_id();

                    // PUT THIS BACK IN EVENTUALLY
                    // TODO seems weird to do this each time, but the User object
                    //fireLegalAttributesChanged();

                    if(inviterId_null_to_notnull) {
                        updateAttributes(ub, User.this);
                        fireVideoInvitationExtended();
                    }
                    if(inviterId_notnull_to_null) {
                        updateAttributes(ub, User.this);
                        fireVideoInvitationRevoked();
                    }

                    // also fire when the inviter's name becomes present - otherwise you get "null has invited you to participate in a video call"
                    if(nameChanged && /*and invitation currently extended*/User.this.video_invitation_from != null) {
                        updateAttributes(ub, User.this);
                        fireVideoInvitationExtended();
                    }
                }
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

    public Integer getCitizen_builder_id() {
        return citizen_builder_id;
    }

    public void setCitizen_builder_id(Integer citizen_builder_id) {
        this.citizen_builder_id = citizen_builder_id;
    }

    private void updateAttributes(UserBean ub, User user) {
        user.video_invitation_from = ub.getVideo_invitation_from();
        user.video_invitation_from_name = ub.getVideo_invitation_from_name();
    }

    // doesn't consider account_disposition:enabled/disabled
    public boolean isAllowed() {
        // make sure the user should be allowed in
        boolean allowed = has_signed_petition && has_signed_confidentiality_agreement && !is_banned;
        return allowed;
    }

    public boolean isHas_signed_petition() {
        return has_signed_petition;
    }

    public void setHas_signed_petition(boolean has_signed_petition) {
        this.has_signed_petition = has_signed_petition;
    }

    public boolean isHas_signed_confidentiality_agreement() {
        return has_signed_confidentiality_agreement;
    }

    public void setHas_signed_confidentiality_agreement(boolean has_signed_confidentiality_agreement) {
        this.has_signed_confidentiality_agreement = has_signed_confidentiality_agreement;
    }

    public boolean isIs_banned() {
        return is_banned;
    }

    public void setIs_banned(boolean is_banned) {
        this.is_banned = is_banned;
    }

    private void redirectIfNotAllowed(UserBean ub) {

        boolean pet = Boolean.TRUE == ub.getHas_signed_petition();
        boolean ca = Boolean.TRUE == ub.getHas_signed_confidentiality_agreement();
        boolean ban = Boolean.FALSE == ub.getIs_banned();
        boolean isAllowed = pet && ca && ban;
        boolean isDisabled = "disabled".equalsIgnoreCase(ub.getAccount_disposition());

        has_signed_petition = Boolean.TRUE == ub.getHas_signed_petition();
        has_signed_confidentiality_agreement = Boolean.TRUE == ub.getHas_signed_confidentiality_agreement();
        is_banned = Boolean.TRUE == ub.getIs_banned();


        if(isDisabled) {
            fireAccountDisabled();
        }
        else  {
            fireAccountEnabled();
        }

        if(isAllowed) {
            fireAllowed();
        }
        else fireNotAllowed();

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

    public boolean isVideoCreator() { return isVideoCreator; }

    public boolean isVolunteerOnly() {
        return isVolunteer && !isDirector && !isAdmin && !isVideoCreator;
    }

//    public boolean hasAnyRole() {
//        return isAdmin || isDirector || isVolunteer || isVideoCreator;
//    }

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
            boolean notAssignedYet = !isAdmin && !isDirector && !isVolunteer && !isVideoCreator;
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
            else if(role.equalsIgnoreCase("video creator"))
                isVideoCreator = val;
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

    public String getAccount_disposition() {
        return account_disposition;
    }

    public void setAccount_disposition(String account_disposition) {
        this.account_disposition = account_disposition;
    }

    public boolean isDisabled() {
        return "disabled".equalsIgnoreCase(account_disposition);
    }

    public Team getCurrentTeam() {
        return currentTeam;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPhone() {
        return phone;
    }

    public String getResidential_address_line1() {
        return residential_address_line1;
    }

    public void setResidential_address_line1(String residential_address_line1) {
        this.residential_address_line1 = residential_address_line1;
    }

    public String getResidential_address_line2() {
        return residential_address_line2;
    }

    public void setResidential_address_line2(String residential_address_line2) {
        this.residential_address_line2 = residential_address_line2;
    }

    public String getResidential_address_city() {
        return residential_address_city;
    }

    public void setResidential_address_city(String residential_address_city) {
        this.residential_address_city = residential_address_city;
    }

    public String getResidential_address_state_abbrev() {
        return residential_address_state_abbrev;
    }

    public void setResidential_address_state_abbrev(String residential_address_state_abbrev) {
        this.residential_address_state_abbrev = residential_address_state_abbrev;
    }

    public String getResidential_address_zip() {
        return residential_address_zip;
    }

    public void setResidential_address_zip(String residential_address_zip) {
        this.residential_address_zip = residential_address_zip;
    }

    public String getState_upper_district() {
        return state_upper_district;
    }

    public void setState_upper_district(String state_upper_district) {
        this.state_upper_district = state_upper_district;
    }

    public String getState_lower_district() {
        return state_lower_district;
    }

    public void setState_lower_district(String state_lower_district) {
        this.state_lower_district = state_lower_district;
    }

    public String getVideo_invitation_from() {
        return video_invitation_from;
    }

    public void setVideo_invitation_from(String video_invitation_from) {
        this.video_invitation_from = video_invitation_from;
    }

    public String getVideo_invitation_from_name() {
        return video_invitation_from_name;
    }

    public void setVideo_invitation_from_name(String video_invitation_from_name) {
        this.video_invitation_from_name = video_invitation_from_name;
    }

    public String getCurrentTeamName() {
        return currentTeam != null ? currentTeam.getTeam_name() : "None";
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

    public synchronized void addAccountStatusEventListener(AccountStatusEvent.Listener l) {
        if(!accountStatusEventListeners.contains(l))
            accountStatusEventListeners.add(l);
    }

    public synchronized void removeAccountStatusEventListener(AccountStatusEvent.Listener l) {
        accountStatusEventListeners.remove(l);
    }

    // means the user is allowed in to the app (has signed legal, not banned, not disabled)
    private void fireAllowed() {
        AccountStatusEvent.Allowed evt = new AccountStatusEvent.Allowed();
        for(AccountStatusEvent.Listener l : accountStatusEventListeners) {
            l.fired(evt);
        }
    }

    // means the user is not allowed in to the app (hasn't signed legal or is banned)
    // They should be sent to LimboActivity
    private void fireNotAllowed() {
        Log.i("USER", "fireNotAllowed() ---------------------------------------");
        AccountStatusEvent.NotAllowed evt = new AccountStatusEvent.NotAllowed();
        for(AccountStatusEvent.Listener l : accountStatusEventListeners) {
            Log.i("USER", "AccountStatusEvent.Listener = "+l.getClass().getName());
            l.fired(evt);
        }
    }

    // means the user's account is enabled.  Enabled doesn't mean too much.  It's "disabled"
    // that you really want to pay attention to
    private void fireAccountEnabled() {
        AccountStatusEvent.AccountEnabled evt = new AccountStatusEvent.AccountEnabled();
        for(AccountStatusEvent.Listener l : accountStatusEventListeners) {
            l.fired(evt);
        }
    }

    // disabled results commonly from people leaving COS.  Their accounts are banned but we need
    // a way of preventing access
    private void fireAccountDisabled() {
        AccountStatusEvent.AccountDisabled evt = new AccountStatusEvent.AccountDisabled();
        for(AccountStatusEvent.Listener l : accountStatusEventListeners) {
            l.fired(evt);
        }
    }

    // TODO get rid of this.  We are moving away from /no_roles in favor of actually checking
    // TODO with CB to determine if they have signed both the petition and the CA
    // fired when the user is recorded under the /no_roles node
    // When this happens, the user is sent to the LimboActivity screen
    // assuming he hasn't been deactivated
//    private void fireNoRolesEvent() {
//        AccountStatusEvent.NoRoles nr = new AccountStatusEvent.NoRoles();
//        for(AccountStatusEvent.Listener l : accountStatusEventListeners) {
//            l.fired(nr);
//        }
//    }

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

    private void fireVideoInvitationExtended() {
        AccountStatusEvent.VideoInvitationExtended evt = new AccountStatusEvent.VideoInvitationExtended();
        for(AccountStatusEvent.Listener l : accountStatusEventListeners) {
            l.fired(evt);
        }
    }

//    PUT THIS BACK IN EVENTUALLY
//    private void fireLegalAttributesChanged() {
//        AccountStatusEvent.LegalAttributesChanged evt = new AccountStatusEvent.LegalAttributesChanged();
//        for(AccountStatusEvent.Listener l : accountStatusEventListeners) {
//            l.fired(evt);
//        }
//    }

    private void fireVideoInvitationRevoked() {
        AccountStatusEvent.VideoInvitationRevoked evt = new AccountStatusEvent.VideoInvitationRevoked();
        for(AccountStatusEvent.Listener l : accountStatusEventListeners) {
            l.fired(evt);
        }
    }

}
