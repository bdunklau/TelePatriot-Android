package com.brentdunklau.telepatriot_android;

import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.Util;
import com.brentdunklau.telepatriot_android.util.VideoOffer;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 9/2/18.
 */


// modeled after VideoInvitationsFragment
public class VideoOffersFragment extends BaseFragment  {

    private FirebaseRecyclerAdapter<VideoOffer, VideoOfferHolder> mAdapter;
    private LinearLayoutManager mLinearLayoutManager;
    private RecyclerView videoOfferList;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.video_offers_fragment, container, false);

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        videoOfferList = (RecyclerView) myView.findViewById(R.id.video_offer_list);
        mLinearLayoutManager = new LinearLayoutManager(myView.getContext());
        mLinearLayoutManager.setReverseLayout(true); // puts the most recent inserts at the top
        mLinearLayoutManager.setStackFromEnd(true);  // https://stackoverflow.com/a/29810833
        videoOfferList.setLayoutManager(mLinearLayoutManager);

        showOffers();

        //setHasOptionsMenu(true);// check other fragments. This is the "3-dot" menu in the upper right that we never really implemented
        return myView;
    }


    // see MyMissionFragment.call() and .call2()
    // see also User.completeMissionItem()
    private void showOffers() {
        final Query q = FirebaseDatabase.getInstance().getReference("video/offers");
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
        mAdapter = new FirebaseRecyclerAdapter<VideoOffer, VideoOfferHolder>(
                VideoOffer.class,
                R.layout.video_offer,
                VideoOfferHolder.class,
                q) {
            @Override
            public void populateViewHolder(VideoOfferHolder holder, VideoOffer offer, int position) {
                holder.setVideoOffer(offer); // https://stackoverflow.com/a/45731532
            }


            // https://stackoverflow.com/a/41629505
            @Override
            public VideoOfferHolder onCreateViewHolder(ViewGroup parent, int viewType) {
                VideoOfferHolder viewHolder = super.onCreateViewHolder(parent, viewType);


                viewHolder.setOnDeleteOffer(new VideoOfferHolder.ClickListener() {
                    @Override
                    public void onItemClick(View view, final VideoOffer offer /*another option: int position*/) {

                        DialogInterface.OnClickListener l = new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int id) {
                                offer.delete();
                            }
                        };

                        String delMsg = "Delete this offer once "+offer.getName()+" has completed the video, lost interest, or can't be reached";
                        Util.simpleOKCancelDialog(myView.getContext(), "Delete Offer?", delMsg, l);



//                        This is a good example of how to query for a whole object when the whole object isn't available
//                        in the Holder class

//                        mAdapter.getRef(position).orderByKey().addListenerForSingleValueEvent(new ValueEventListener() {
//                            @Override
//                            public void onDataChange(DataSnapshot dataSnapshot) {
//
//                                if(dataSnapshot == null) {
//                                    System.out.println("VideoOffersFragment: dataSnapshot is null - that's not good");
//                                    return;
//                                }
//
//                                final VideoOffer offer = dataSnapshot.getValue(VideoOffer.class);
//
//                                DialogInterface.OnClickListener l = new DialogInterface.OnClickListener() {
//                                    public void onClick(DialogInterface dialog, int id) {
//                                        offer.delete();
//                                    }
//                                };
//
//                                Util.simpleOKCancelDialog(myView.getContext(), "Delete this offer?", l);
//
//
//                                // after the invitation is declined - we will just leave the user on the Video Invitation page with
//                                // a note/label to the user telling him there are no invitations, swipe left to right for the menu, etc
//
//                            }
//
//                            @Override
//                            public void onCancelled(DatabaseError databaseError) {
//
//                            }
//                        });
                    }

                    @Override
                    public void onItemLongClick(View view, int position) {
                    }
                });

                viewHolder.setOnPhoneClicked(new VideoOfferHolder.ClickListener() {
                    @Override
                    public void onItemClick(View view, VideoOffer offer) {

                        Intent intent = new Intent(Intent.ACTION_CALL);
                        intent.setData(Uri.parse("tel:" + offer.getPhone()));
                        startActivity(intent);
                    }

                    @Override
                    public void onItemLongClick(View view, int position) {
                    }
                });

                viewHolder.setOnEmailClicked(new VideoOfferHolder.ClickListener() {
                    @Override
                    public void onItemClick(View view, VideoOffer offer) {

                        Intent intent = new Intent(Intent.ACTION_SENDTO);
                        intent.setType("message/rfc822");
                        intent.setData(Uri.parse("mailto:" + offer.getEmail()));
                        startActivity(intent);
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
                videoOfferList.getLayoutManager().scrollToPosition(positionStart); // https://stackoverflow.com/a/33329765
            }
        });


        videoOfferList.setAdapter(mAdapter);
    }

}