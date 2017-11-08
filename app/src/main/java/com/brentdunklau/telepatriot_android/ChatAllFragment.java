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

import com.brentdunklau.telepatriot_android.util.MissionItemEvent;
import com.brentdunklau.telepatriot_android.util.MissionItemEventHolder;
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
 * Created by bdunklau on 11/7/17.
 */

public class ChatAllFragment extends BaseFragment {

    protected DatabaseReference ref;
    protected Query query;

    private TextView header_chat_list;
    private FirebaseRecyclerAdapter<UserBean, UserHolder> mAdapter;
    private LinearLayoutManager mLinearLayoutManager;
    private RecyclerView usersView;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.chat_all_fragment, container, false);

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        usersView = (RecyclerView) myView.findViewById(R.id.all_chat_list);
        mLinearLayoutManager = new LinearLayoutManager(myView.getContext());
        mLinearLayoutManager.setReverseLayout(true); // puts the most recent inserts at the top
        mLinearLayoutManager.setStackFromEnd(true);  // https://stackoverflow.com/a/29810833
        usersView.setLayoutManager(mLinearLayoutManager);

        header_chat_list = myView.findViewById(R.id.header_chat_list);

        showUsersWithChats(getFragmentManager(), this);

        setHasOptionsMenu(true);
        return myView;
    }

    private void showUsersWithChats(final FragmentManager fragmentManager, final Fragment back) {
        final DatabaseReference ref = FirebaseDatabase.getInstance().getReference("chathelp");
        ref.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                //doit(ref);
                doit(ref, fragmentManager, back);
            }

            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });

    }



    private void doit(DatabaseReference ref, final FragmentManager fragmentManager, final Fragment back) {
        //final FragmentManager fragmentManager = getFragmentManager();

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

                                ChatFragment chat = ChatFragment.getInstance();

                                /*
                                chat.to(uid);
                                FragmentTransaction transaction = fragmentManager.beginTransaction();
                                transaction.setCustomAnimations(R.animator.slide_from_right, R.animator.slide_to_left);
                                transaction.replace(R.id.content_frame, chat);
                                transaction.addToBackStack(null);
                                transaction.commit();
                                */


                                // Instead of going to an activity, we need to load a fragment...
                                AssignUserFragment fragment = new AssignUserFragment();
                                /*
                                fragment.setUid(uid);
                                fragment.setFragmentManager(fragmentManager, back);
                                try {
                                    FragmentTransaction t1 = fragmentManager.beginTransaction();
                                    FragmentTransaction t2 = t1.replace(R.id.content_frame, fragment);
                                    int res = t2.commit();
                                    int i=1;
                                } catch(Throwable t) {
                                    // TODO don't do this
                                    t.printStackTrace();
                                }
                                */

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
        usersView.setAdapter(mAdapter);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if(mAdapter != null) mAdapter.cleanup();
    }

}
