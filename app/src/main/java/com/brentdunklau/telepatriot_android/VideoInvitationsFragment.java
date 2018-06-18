package com.brentdunklau.telepatriot_android;

import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.os.Bundle;
import android.os.StrictMode;
import android.support.annotation.Nullable;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CompoundButton;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.ToggleButton;

import com.brentdunklau.telepatriot_android.util.Mission;
import com.brentdunklau.telepatriot_android.util.MissionItemEvent;
import com.brentdunklau.telepatriot_android.util.MissionItemEventHolder;
import com.brentdunklau.telepatriot_android.util.User;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 6/10/18.
 */

public class VideoInvitationsFragment extends BaseFragment  {

    //protected DatabaseReference ref;
    //protected Query query;


    private TextView video_invitation_title;
    private FirebaseRecyclerAdapter<VideoInvitation, VideoInvitationHolder> mAdapter;
    private LinearLayoutManager mLinearLayoutManager;
    private RecyclerView videoInvitationList;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.video_invitations_fragment, container, false);

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        videoInvitationList = (RecyclerView) myView.findViewById(R.id.video_invitation_list);
        mLinearLayoutManager = new LinearLayoutManager(myView.getContext());
        mLinearLayoutManager.setReverseLayout(true); // puts the most recent inserts at the top
        mLinearLayoutManager.setStackFromEnd(true);  // https://stackoverflow.com/a/29810833
        videoInvitationList.setLayoutManager(mLinearLayoutManager);

        video_invitation_title = myView.findViewById(R.id.video_invitation_title);
        //video_invitation_title.setText("XXXXXXXX"); // you *can* set the title this way, but here I just set it in video_invitations_fragment.xml

        showInvitations();

        //setHasOptionsMenu(true);// check other fragments. This is the "3-dot" menu in the upper right that we never really implemented
        return myView;
    }


    // see MyMissionFragment.call() and .call2()
    // see also User.completeMissionItem()
    private void showInvitations() {
        final Query q = FirebaseDatabase.getInstance().getReference("video/invitations").orderByChild("guest_id").equalTo(User.getInstance().getUid()); // i.e. actual human activities like making phone calls
        q.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                doit(q);
            }

            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });

    }


    // See AllActivityFragment - modeled after that
    private void doit(Query q) {

        final FragmentManager fragmentManager = getFragmentManager();
        //query = ref;
        // see:  https://www.youtube.com/watch?v=ynKWnC0XiXk
        mAdapter = new FirebaseRecyclerAdapter<VideoInvitation, VideoInvitationHolder>(
                VideoInvitation.class,
                R.layout.video_invitation,
                VideoInvitationHolder.class,
                q) {
            @Override
            public void populateViewHolder(VideoInvitationHolder holder, VideoInvitation invitation, int position) {
                holder.setVideoInvitation(invitation); // https://stackoverflow.com/a/45731532
            }


            // https://stackoverflow.com/a/41629505
            @Override
            public VideoInvitationHolder onCreateViewHolder(ViewGroup parent, int viewType) {
                VideoInvitationHolder viewHolder = super.onCreateViewHolder(parent, viewType);
                viewHolder.setOnClickListener(new VideoInvitationHolder.ClickListener() {
                    @Override
                    public void onItemClick(View view, int position) {
                        mAdapter.getRef(position).orderByKey().addListenerForSingleValueEvent(new ValueEventListener() {
                            @Override
                            public void onDataChange(DataSnapshot dataSnapshot) {
                                // see MissionListFragment for an example of how to do something when
                                // the user touches a row in a table


                                if(dataSnapshot == null) {
                                    return;
                                }

                                // whenever you touch one of the video invitations, that triggers another query
                                // that creates a VideoInvitation object and then pulls out relevant info
                                // to send to VideoChatFragment
                                //String videoInvId = dataSnapshot.getKey(); // might not need this
                                VideoInvitation invitation = dataSnapshot.getValue(VideoInvitation.class);
                                User.getInstance().setCurrent_video_node_key(invitation.getVideo_node_id());

                                // Instead of going to an activity, we need to load a fragment...
                                VidyoChatFragment fragment = new VidyoChatFragment();
                                fragment.setRoom(invitation.getRoom_id());

                                // What do we want to send to VidyoChatFragment?
                                //fragment.setMissionId(missionId);
                                //fragment.setMission(mission);
                                try {
                                    FragmentTransaction t1 = fragmentManager.beginTransaction();
                                    t1.replace(R.id.content_frame, fragment);
                                    t1.addToBackStack(fragment.getClass().getName());
                                    int res = t1.commit();
                                    int i = 1;
                                } catch (Throwable t) {
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


        // automatically scrolls to the last (most recent) mission - easier than reverse ordering
        // see also ChatFragment
        mAdapter.registerAdapterDataObserver(new RecyclerView.AdapterDataObserver() {
            @Override
            public void onItemRangeInserted(int positionStart, int itemCount) {
                super.onItemRangeInserted(positionStart, itemCount);
                videoInvitationList.getLayoutManager().scrollToPosition(positionStart); // https://stackoverflow.com/a/33329765
            }
        });


        videoInvitationList.setAdapter(mAdapter);
    }

}
