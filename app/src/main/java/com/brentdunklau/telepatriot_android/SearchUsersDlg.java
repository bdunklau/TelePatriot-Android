package com.brentdunklau.telepatriot_android;

import android.app.Dialog;
import android.app.FragmentManager;
import android.content.Context;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.support.v7.widget.SearchView;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;

import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.UserBean;
import com.brentdunklau.telepatriot_android.util.UserHolder;
import com.brentdunklau.telepatriot_android.util.VideoNode;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by bdunklau on 8/6/18.
 */

public class SearchUsersDlg extends Dialog {

    private FirebaseRecyclerAdapter<UserBean, UserHolder> firebaseRecyclerAdapter22;
    private RecyclerView users;
    private Button button_cancel_search_users;
    SearchView search_users;

    public SearchUsersDlg(Context activity, final VideoNode currentVideoNode) {
        super(activity);

        setContentView(R.layout.search_users_fragment);
        search_users = findViewById(R.id.search_users);
        search_users.setQueryHint("Search by name");
        button_cancel_search_users = findViewById(R.id.button_cancel_search_users);
        users = (RecyclerView) findViewById(R.id.user_list);
        users.setLayoutManager(new LinearLayoutManager(getContext()));

        button_cancel_search_users.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                SearchUsersDlg.this.dismiss();
            }
        });

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

                //final FragmentManager fragmentManager = getFragmentManager();

                firebaseRecyclerAdapter22 = new FirebaseRecyclerAdapter<UserBean, UserHolder>(
                        UserBean.class,
                        R.layout.user_line_item,  // see 0:42 of https://www.youtube.com/watch?v=A-_hKWMA7mk
                        UserHolder.class,
                        query) {
                    @Override
                    protected void populateViewHolder(final UserHolder holder, final UserBean user, int position) {
                        holder.setUser(user);
                    }


                    // https://stackoverflow.com/a/41629505
                    @Override
                    public UserHolder onCreateViewHolder(ViewGroup parent, int viewType) {
                        UserHolder viewHolder = super.onCreateViewHolder(parent, viewType);
                        viewHolder.setOnClickListener(new UserHolder.ClickListener() {
                            @Override
                            public void onItemClick(View view, int position) {

                                InputMethodManager imm = (InputMethodManager) getContext().getSystemService(Context.INPUT_METHOD_SERVICE);
                                imm.hideSoftInputFromWindow(view.getWindowToken(), 0);

                                firebaseRecyclerAdapter22.getRef(position).orderByKey().addListenerForSingleValueEvent(new ValueEventListener() {
                                    @Override
                                    public void onDataChange(DataSnapshot dataSnapshot) {
                                        // whenever you touch a user line item, that triggers another query that looks
                                        // at the user's roles at /users/uid/roles because we need to set the role switches
                                        // to the right values
                                        String uid = dataSnapshot.getKey();
                                        UserBean guest = dataSnapshot.getValue(UserBean.class);
                                        guest.setUid(uid);

                                        // write the invitation and dismiss...
                                        if(currentVideoNode == null)
                                            return;
                                        VideoInvitation inv = new VideoInvitation(User.getInstance(), guest, currentVideoNode.getKey());
                                        String key = inv.save();
                                        Map updates = new HashMap();
//                                        updates.put("video_invitation_key", key);
//                                        updates.put("video_invitation_extended_to", guest.getName());
//                                        FirebaseDatabase.getInstance().getReference("video/list/"+currentVideoNode.getKey()).updateChildren(updates);

                                        updates.put("video/list/"+currentVideoNode.getKey()+"/video_invitation_key", key);
                                        updates.put("video/list/"+currentVideoNode.getKey()+"/video_invitation_extended_to", guest.getName());
                                        updates.put("users/"+uid+"/video_invitation_from", User.getInstance().getUid());
                                        updates.put("users/"+uid+"/video_invitation_from_name", User.getInstance().getName());
                                        updates.put("users/"+uid+"/current_video_node_key", User.getInstance().getCurrent_video_node_key());
                                        FirebaseDatabase.getInstance().getReference("/").updateChildren(updates);


                                        SearchUsersDlg.this.dismiss();
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
    }
}
