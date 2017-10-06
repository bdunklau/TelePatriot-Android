package com.brentdunklau.telepatriot_android;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.UserBean;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.UserHolder;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

import org.w3c.dom.Text;

import java.util.HashMap;

/**
 * https://www.youtube.com/watch?v=yOBQHf5nM2I
 *
 * Created by bdunklau on 10/5/17.
 */

public class UserListFragment extends Fragment {

    private TextView roleHeader;

    private FirebaseRecyclerAdapter<UserBean, UserHolder> mAdapter;
    protected String TAG = "UserListFragment";
    private RecyclerView users;
    private FirebaseDatabase database;
    private View view;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        view = inflater.inflate(R.layout.user_list_fragment, container, false);

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        users = (RecyclerView) view.findViewById(R.id.user_list);
        users.setLayoutManager(new LinearLayoutManager(view.getContext()));
        return view;
    }

    public void setDatabase(FirebaseDatabase database) {
        this.database = database;
    }

    public void setRole(String role) {
        updateLabel(view, R.id.role_header, role+"s");

        final DatabaseReference ref = database.getReference("roles/"+role+"/users");
        ref.orderByChild("name")/*.limitToFirst(25) limit somehow? */.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                doit(ref);
            }
            @Override
            public void onCancelled(DatabaseError databaseError) {}
        });
    }

    private void updateLabel(final View view, final int Rid, final String text) {
        final TextView t = (TextView) view.findViewById(Rid);
        if(t == null)
            return;

        Runnable r = new Runnable() {
            public void run() {
                t.setText(text);
            }
        };

        Handler h = new Handler();
        h.post(r);
    }

    private void doit(DatabaseReference ref) {

        final Context activity = view.getContext();

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
                                HashMap map = (HashMap) dataSnapshot.getValue();
                                final Intent it = new Intent(activity, AssignUserActivity.class);
                                it.putExtra("uid", uid);
                                /*it.putExtra("name", map.get("name")+"");
                                it.putExtra("email", map.get("email")+"");
                                it.putExtra("photoUrl", map.get("photoUrl")+"");*/
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

    @Override
    public void onDestroy() {
        super.onDestroy();
        if(mAdapter != null) mAdapter.cleanup();
    }
}
