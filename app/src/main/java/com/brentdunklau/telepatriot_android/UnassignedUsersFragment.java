package com.brentdunklau.telepatriot_android;

import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

/**
 * Created by bdunklau on 10/11/17.
 */

public class UnassignedUsersFragment extends AdminFragment {

    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.unassignedusers_fragment, container, false);

        setHasOptionsMenu(true);
        return myView;
    }


    // taken from snapshot of UnassignedUsersActivity:  https://github.com/bdunklau/TelePatriot-Android/blob/08dec2a3971cc036b1dc8aaf60e77b8a84d4222b/app/src/main/java/com/brentdunklau/telepatriot_android/UnassignedUsersActivity.java

/*
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_unassignedusers);
        currentActivity = this.getClass(); // get rid of this probably ...in all activity classes

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        users = (RecyclerView) findViewById(R.id.user_list);
        users.setLayoutManager(new LinearLayoutManager(this));

        // Just focusing on users that need to be assigned to a role
        myRef = database.getReference("no_roles");
        myRef.addListenerForSingleValueEvent(new ValueEventListener() {
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
                    doit();
                }
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {

            }
        });


    }
    */



    // taken from snapshot of UnassignedUsersActivity:  https://github.com/bdunklau/TelePatriot-Android/blob/08dec2a3971cc036b1dc8aaf60e77b8a84d4222b/app/src/main/java/com/brentdunklau/telepatriot_android/UnassignedUsersActivity.java

    /*
    private void doit() {

        // see:  https://www.youtube.com/watch?v=ynKWnC0XiXk
        mAdapter = new FirebaseRecyclerAdapter<UserBean, UserHolder>(
                UserBean.class,
                R.layout.list_item,  // see 0:42 of https://www.youtube.com/watch?v=A-_hKWMA7mk
                UserHolder.class,
                myRef) {
            @Override
            public void populateViewHolder(UserHolder holder, UserBean user, int position) {
                holder.setName(user.getName());
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
                                HashMap map = (HashMap) dataSnapshot.getValue();
                                Intent it = new Intent(UnassignedUsersActivity.this, AssignUserActivity.class);
                                it.putExtra("uid", dataSnapshot.getKey());
                                *//*it.putExtra("name", map.get("name")+"");
                                it.putExtra("email", map.get("email")+"");
                                it.putExtra("photoUrl", map.get("photoUrl")+"");*//*
                                startActivity(it);
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
    */



    // taken from snapshot of UnassignedUsersActivity:  https://github.com/bdunklau/TelePatriot-Android/blob/08dec2a3971cc036b1dc8aaf60e77b8a84d4222b/app/src/main/java/com/brentdunklau/telepatriot_android/UnassignedUsersActivity.java

/*
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if(mAdapter != null) mAdapter.cleanup();
    }
    */

}
