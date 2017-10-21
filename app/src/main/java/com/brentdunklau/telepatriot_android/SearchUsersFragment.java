package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.content.Context;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.support.v7.widget.SearchView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;

import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.UserBean;
import com.brentdunklau.telepatriot_android.util.UserHolder;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 10/19/2017.
 */

public class SearchUsersFragment extends Fragment {

    private FirebaseRecyclerAdapter<UserBean, UserHolder> firebaseRecyclerAdapter22;
    private RecyclerView users;
    SearchView search_users;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.search_users_fragment, container, false);
        search_users = myView.findViewById(R.id.search_users);
        search_users.setQueryHint("Search by name");

        users = (RecyclerView) myView.findViewById(R.id.user_list);
        users.setLayoutManager(new LinearLayoutManager(myView.getContext()));

        search_users.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override
            public boolean onQueryTextSubmit(String query) {
                return false;
            }

            @Override
            public boolean onQueryTextChange(String str) {

                String newText = "dfgsdfgsdfgsdfsdfgsdfgs"; // so that empty search field won't return anything
                if(str != null && !str.trim().equalsIgnoreCase(""))
                    newText = str;

                // capitalize the first letter in case it's not - don't make the user do that
                newText = newText.substring(0, 1).toUpperCase() + newText.substring(1);

                Query query = FirebaseDatabase.getInstance().getReference().child("users").orderByChild("name").startAt(newText).endAt(newText+"\uf8ff");

                final FragmentManager fragmentManager = getFragmentManager();

                firebaseRecyclerAdapter22 = new FirebaseRecyclerAdapter<UserBean, UserHolder>(
                        UserBean.class,
                        R.layout.list_item,  // see 0:42 of https://www.youtube.com/watch?v=A-_hKWMA7mk
                        UserHolder.class,
                        query) {
                    @Override
                    protected void populateViewHolder(final UserHolder holder, final UserBean user, int position) {
                        holder.setName(user.getName());
                    }


                    // https://stackoverflow.com/a/41629505
                    @Override
                    public UserHolder onCreateViewHolder(ViewGroup parent, int viewType) {
                        UserHolder viewHolder = super.onCreateViewHolder(parent, viewType);
                        viewHolder.setOnClickListener(new UserHolder.ClickListener() {
                            @Override
                            public void onItemClick(View view, int position) {

                                InputMethodManager imm = (InputMethodManager) myView.getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
                                imm.hideSoftInputFromWindow(view.getWindowToken(), 0);

                                firebaseRecyclerAdapter22.getRef(position).orderByKey().addListenerForSingleValueEvent(new ValueEventListener() {
                                    @Override
                                    public void onDataChange(DataSnapshot dataSnapshot) {
                                        // whenever you touch a user line item, that triggers another query that looks
                                        // at the user's roles at /users/uid/roles because we need to set the role switches
                                        // to the right values
                                        String uid = dataSnapshot.getKey();

                                        // Instead of going to an activity, we need to load a fragment...
                                        AssignUserFragment fragment = new AssignUserFragment();
                                        fragment.setUid(uid);
                                        fragment.setFragmentManager(fragmentManager, SearchUsersFragment.this);
                                        try {
                                            FragmentTransaction t1 = fragmentManager.beginTransaction();
                                            FragmentTransaction t2 = t1.replace(R.id.content_frame, fragment);
                                            int res = t2.commit();
                                            int i=1;
                                        } catch(Throwable t) {
                                            // TODO don't do this
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
                users.setAdapter(firebaseRecyclerAdapter22);
                return false;
            }
        });


        return myView;
    }


/*
    private void doit(DatabaseReference ref, final FragmentManager fragmentManager, final Fragment back) {

        // see:  https://www.youtube.com/watch?v=ynKWnC0XiXk
        mAdapter = new FirebaseRecyclerAdapter<UserBean, UserHolder>(
                UserBean.class,
                R.layout.list_item,  // see 0:42 of https://www.youtube.com/watch?v=A-_hKWMA7mk
                UserHolder.class,
                ref) {
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
                                // whenever you touch a user line item, that triggers another query that looks
                                // at the user's roles at /users/uid/roles because we need to set the role switches
                                // to the right values
                                String uid = dataSnapshot.getKey();

                                // When we click on someone, we want to be taken to their profile
                                // page - which doesn't exist yet.  We could use/adapt AssignUserFragment
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

}
