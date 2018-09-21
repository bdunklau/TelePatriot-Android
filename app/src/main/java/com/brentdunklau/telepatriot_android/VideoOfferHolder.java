package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.net.Uri;
import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.VideoOffer;

/**
 * Created by bdunklau on 9/2/18.
 */

public class VideoOfferHolder extends RecyclerView.ViewHolder {

    // what fields?  should probably match what's in the db: /video/offers
    private TextView date;
    private TextView date_ms;
    private TextView email;
    private TextView name;
    private TextView phone;
    private TextView photoUrl;
    private TextView residential_address_city;
    private TextView residential_address_line1;
    private TextView residential_address_line2;
    private TextView residential_address_state_abbrev;
    private TextView senate_state;
    private TextView house_state;
    private TextView house_label;
    private TextView state_lower_district;
    private TextView state_upper_district;
    private TextView uid;
    private VideoOffer offer;


    // https://stackoverflow.com/a/41629505
//    private VideoInvitationHolder.ClickListener mClickListener;
    private VideoOfferHolder.ClickListener deleteOfferListener;
    private VideoOfferHolder.ClickListener phoneClickedListener;
    private VideoOfferHolder.ClickListener emailClickedListener;

    // See VideoOffersFragment and video_offer.xml
    public VideoOfferHolder(View itemView) {
        super(itemView);

        date = itemView.findViewById(R.id.video_offer_date);
        email = itemView.findViewById(R.id.video_offer_email);
        name = itemView.findViewById(R.id.video_offer_name);
        phone = itemView.findViewById(R.id.video_offer_phone);
//        photoUrl = itemView.findViewById(R.id.video_offer_photoUrl);
        residential_address_city = itemView.findViewById(R.id.video_offer_residential_address_city);
        residential_address_line1 = itemView.findViewById(R.id.video_offer_residential_address_line1);
//        residential_address_line1 = itemView.findViewById(R.id.video_offer_residential_address_line2);
        residential_address_state_abbrev = itemView.findViewById(R.id.video_offer_residential_address_state_abbrev);
        senate_state = itemView.findViewById(R.id.video_offer_senate_state);
        house_state = itemView.findViewById(R.id.video_offer_house_state);
        state_lower_district = itemView.findViewById(R.id.video_offer_state_lower_district);
        state_upper_district = itemView.findViewById(R.id.video_offer_state_upper_district);
//        uid = itemView.findViewById(R.id.video_offer_uid);

        Button delete_offer_button = itemView.findViewById(R.id.delete_offer_button);

        // https://stackoverflow.com/a/41629505
        // In other XxxxHolders, we do:  itemView.setOnClickListener() so that the whole row
        // listens for the click.  But here we just want the button to respond to touches
        delete_offer_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // the listener is (probably) over at VideoOffersFragment
                deleteOfferListener.onItemClick(v, offer /*another option:  getAdapterPosition() */);
            }
        });

        phone.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                phoneClickedListener.onItemClick(v, offer);
            }
        });

        email.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                emailClickedListener.onItemClick(v, offer);
            }
        });
    }

    // modeled after VideoInvitationHolder
    public void setVideoOffer(VideoOffer offer) {
        // this is where you have to unpack all the attribute of the invitation object
        // and set the various labels
        this.offer = offer;
        String instructions = offer.getName()+" has offered to go on camera and shoot a video for COS. Call "+offer.getName()
                +" at the number below and set up a time that you two can get together on a video call.";
        date.setText(offer.getDate());
        email.setText(offer.getEmail());
        name.setText(instructions);
        phone.setText(offer.getPhone());
//        photoUrl.setText(offer.getPhotoUrl());
        residential_address_city.setText(offer.getResidential_address_city());
        residential_address_line1.setText(offer.getResidential_address_line1());
        String state_abbrev = offer.getResidential_address_state_abbrev()==null ? "" : offer.getResidential_address_state_abbrev().toUpperCase();
        residential_address_state_abbrev.setText(state_abbrev);
        senate_state.setText(state_abbrev+" SD ");
        house_state.setText(state_abbrev+" HD ");
        state_lower_district.setText(offer.getState_lower_district());
        state_upper_district.setText(offer.getState_upper_district());
        if("ne".equalsIgnoreCase(offer.getResidential_address_state_abbrev())) {
            house_label.setVisibility(View.GONE);
            house_state.setVisibility(View.GONE);
            state_lower_district.setVisibility(View.GONE);
        }
    }

    // https://stackoverflow.com/a/41629505
    public void setOnDeleteOffer(VideoOfferHolder.ClickListener clickListener){
        deleteOfferListener = clickListener;
    }

    public void setOnPhoneClicked(VideoOfferHolder.ClickListener clickListener){
        phoneClickedListener = clickListener;
    }

    public void setOnEmailClicked(VideoOfferHolder.ClickListener clickListener) {
        emailClickedListener = clickListener;
    }

    // https://stackoverflow.com/a/41629505
    //Interface to send callbacks...
    public interface ClickListener {
        public void onItemClick(View view, VideoOffer offer /*int position  is another option*/);
        public void onItemLongClick(View view, int position);
    }
}