package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.os.Bundle;
import android.os.Handler;
import android.support.annotation.Nullable;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.UserBean;
import com.brentdunklau.telepatriot_android.util.UserHolder;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 10/11/17.
 */

public class UnassignedUsersFragment extends AdminFragment {

    private FirebaseRecyclerAdapter<UserBean, UserHolder> mAdapter;
    private RecyclerView users;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.unassignedusers_fragment, container, false);

        showUnassignedUsers();

        setHasOptionsMenu(true);
        return myView;
    }


    private void showUnassignedUsers() {

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        users = (RecyclerView) myView.findViewById(R.id.user_list);
        users.setLayoutManager(new LinearLayoutManager(myView.getContext()));

        final DatabaseReference ref = FirebaseDatabase.getInstance().getReference("no_roles");
        ref.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                if(dataSnapshot.getValue() == null) {
                    // print a "Your Work is Done" message
                    // All users are in a role
                    String workIsDone = "Your work is done here. All users have been assigned to at least one group.";
                    updateLabel(R.id.txt_explanation, workIsDone);
                }
                else {
                    // this is the case where we have some new users that need to be assigned to a role
                    doit(ref);
                }
            }

            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });

    }

    /******
    private void updateLabel(final int rid, final String text) {
        Runnable r = new Runnable() {
            @Override
            public void run() {
                ((TextView) myView.findViewById(rid)).setText(text);
            }
        };
        new Handler().post(r);
    }
     ******/


    private void doit(final DatabaseReference ref) {

        final FragmentManager fragmentManager = getFragmentManager();

        // see:  https://www.youtube.com/watch?v=ynKWnC0XiXk
        mAdapter = new FirebaseRecyclerAdapter<UserBean, UserHolder>(
                UserBean.class,
                R.layout.user_line_item,  // see 0:42 of https://www.youtube.com/watch?v=A-_hKWMA7mk
                UserHolder.class,
                ref) {
            @Override
            public void populateViewHolder(UserHolder holder, UserBean user, int position) {
                holder.setUser(user);
            }


            // https://stackoverflow.com/a/41629505
            @Override
            public UserHolder onCreateViewHolder(ViewGroup parent, int viewType) {
                UserHolder viewHolder = super.onCreateViewHolder(parent, viewType);

                viewHolder.setOnClickListener(new UserHolder.ClickListener() {
                    @Override
                    public void onItemClick(View view, int position) {
                        mAdapter.getRef(position).orderByKey().addListenerForSingleValueEvent(new ValueEventListener() {
                            @Override
                            public void onDataChange(DataSnapshot dataSnapshot) {
                                // whenever you touch a user line item, that triggers another query that looks
                                // at the user's roles at /users/uid/roles because we need to set the role switches
                                // to the right values
                                String uid = dataSnapshot.getKey();

                                AdminFragment next = null;
                                UserBean ub = dataSnapshot.getValue(UserBean.class);
                                if(ub.getIs_banned() != null && ub.getIs_banned().booleanValue()) {
                                    next = new UserIsBannedFragment();
                                    next.setUser(ub);
                                    // ugly...
                                    ((UserIsBannedFragment) next).setFragmentManager(fragmentManager, UnassignedUsersFragment.this);
                                }
                                /************
                                 * 1/15/18 - Security policy: Just because a user hasn't signed the conf agreement, we will still let
                                 * them in to the app and assign them to a training team.  But we will not let them be assigned to any real
                                 * teams until they are legal.
                                else if(ub.getHas_signed_confidentiality_agreement() == null || !ub.getHas_signed_confidentiality_agreement().booleanValue()) {
                                    next = new UserMustSignCAFragment();
                                    next.setUser(ub);
                                    // ugly...
                                    ((UserMustSignCAFragment) next).setFragmentManager(fragmentManager, UnassignedUsersFragment.this);
                                }
                                 ***********/
                                else {
                                    next = new AssignUserFragment();
                                    ((AssignUserFragment) next).setUid(uid); // ugly - fix this
                                    ((AssignUserFragment) next).setFragmentManager(fragmentManager, UnassignedUsersFragment.this); // ugly - fix this
                                }

                                // Instead of going to an activity, we need to load a fragment...
                                //AssignUserFragment next = new AssignUserFragment();
                                //next.setUid(uid);
                                //next.setFragmentManager(fragmentManager, UnassignedUsersFragment.this);
                                try {

                                    fragmentManager.beginTransaction()
                                            .replace(R.id.content_frame, next)
                                            .addToBackStack(next.getClass().getName())
                                            .commit();


                                } catch(Throwable t) {
                                    t.printStackTrace();
                                }
                            }

                            @Override
                            public void onCancelled(DatabaseError databaseError) {

                            }
                        });
                    }

                    @Override
                    public void onItemLongClick(View view, int position) {
                    }
                });
                return viewHolder;
            }
        };
        users.setAdapter(mAdapter);
    }


    @Override
    public void onDestroy() {
        super.onDestroy();
        if(mAdapter != null) mAdapter.cleanup();
    }


}
