package com.brentdunklau.telepatriot_android;

import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.MissionItemEventHolder;

/**
 * Created by bdunklau on 6/10/18.
 */

public class VideoInvitationHolder  extends RecyclerView.ViewHolder {

    // what fields?  should probably match what's in the db: /video/invitations
    private TextView guest_name, guest_email, initiator_name, initiator_email;
    private ImageView guest_photo_url, initiator_photo_url;
    private TextView invitation_create_date;


    // https://stackoverflow.com/a/41629505
    private VideoInvitationHolder.ClickListener mClickListener;

    // See VideoInvitationsFragment and video_invitation.xml
    public VideoInvitationHolder(View itemView) {
        super(itemView);

        initiator_name = itemView.findViewById(R.id.initiator_name);
        invitation_create_date = itemView.findViewById(R.id.invitation_create_date);
        Button accept_invitation_button = itemView.findViewById(R.id.accept_invitation_button);

        // https://stackoverflow.com/a/41629505
        // In other XxxxHolders, we do:  itemView.setOnClickListener() so that the whole row
        // listens for the click.  But here we just want the button to respond to touches
        accept_invitation_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // the listener is (probably) over at VideoInvitationsFragment
                mClickListener.onItemClick(v, getAdapterPosition());
            }
        });
    }

    // modeled after MissionItemEventHolder
    public void setVideoInvitation(VideoInvitation invitation) {
        // this is where you have to unpack all the attribute of the invitation object
        // and set the various labels

        // Actually don't need the guest_name and other guest attributes because the guest
        // here is the current user.  The current user is coming to this screen and seeing
        // that someone has sent "you" an invitation
        initiator_name.setText(invitation.getInitiator_name());
        invitation_create_date.setText(invitation.getInvitation_create_date());
    }

    // https://stackoverflow.com/a/41629505
    public void setOnClickListener(VideoInvitationHolder.ClickListener clickListener){
        mClickListener = clickListener;
    }

    // TODO duplicated in UserHolder
    // https://stackoverflow.com/a/41629505
    //Interface to send callbacks...
    public interface ClickListener {
        public void onItemClick(View view, int position);
        public void onItemLongClick(View view, int position);
    }
}
