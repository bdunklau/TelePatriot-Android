package com.brentdunklau.telepatriot_android.util;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;
import com.squareup.picasso.Picasso;

import java.util.List;

/**
 * Created by bdunklau on 6/23/18.
 */

public class LegislatorHolder extends RecyclerView.ViewHolder {

    private TextView title, legislator_first_name, legislator_last_name, party, select_legislator;
    private TextView legislator_chamber, legislator_district;
    private ImageView legislator_photo;
    private TextView legislator_facebook;
    private TextView legislator_twitter;

    private RecyclerView officeRecyclerView;
    private View itemView;

    // https://stackoverflow.com/a/41629505
    private LegislatorHolder.ClickListener mClickListener;

    public LegislatorHolder(View itemView) {
        super(itemView);
        this.itemView = itemView;
        title = itemView.findViewById(R.id.title); // Rep or Sen
        legislator_first_name = itemView.findViewById(R.id.legislator_first_name);
        legislator_last_name = itemView.findViewById(R.id.legislator_last_name);
        party = itemView.findViewById(R.id.party);
        select_legislator = itemView.findViewById(R.id.select_legislator);
        legislator_chamber = itemView.findViewById(R.id.legislator_chamber);
        legislator_district = itemView.findViewById(R.id.legislator_district);
        legislator_photo = itemView.findViewById(R.id.legislator_photo);
        legislator_facebook = itemView.findViewById(R.id.legislator_facebook);
        legislator_twitter = itemView.findViewById(R.id.legislator_twitter);

        // https://stackoverflow.com/a/41629505
        // Notice how we put the listener just on the "Select" link.  Most other XxxxxHolder's
        // put the OnClick Listener on the itemView object so that we can click anywhere
        // on that object's line and fire the listener
        select_legislator.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // See VideoChatInstructionsDlg.  mClickListener should be videoChatYouTubeDescription
                mClickListener.onItemClick(v, getAdapterPosition());
            }
        });

        officeRecyclerView = (RecyclerView) itemView.findViewById(R.id.legislator_offices);
        officeRecyclerView.setLayoutManager(new LinearLayoutManager(itemView.getContext()));
    }


    // https://stackoverflow.com/a/41629505
    //Interface to send callbacks...
    public interface ClickListener {
        public void onItemClick(View view, int position);
        //public void onItemLongClick(View view, int position); // don't need this, just FYI
    }

    // https://stackoverflow.com/a/41629505
    // See EditLegislatorForVideoDlg.doit(): viewHolder.setOnClickListener(...)
    public void setOnClickListener(LegislatorHolder.ClickListener clickListener){
        mClickListener = clickListener;
    }

    public void setLegislator(Legislator legislator) {
        title.setText(legislator.getChamber().equalsIgnoreCase("lower") ? "Rep" : "Sen");
        legislator_first_name.setText(legislator.getFirst_name());
        legislator_last_name.setText(legislator.getLast_name());
        party.setText("(" + legislator.getParty().substring(0, 1) + ")");
        legislator_chamber.setText(legislator.getChamber().equalsIgnoreCase("lower") ? "HD" : "SD");
        legislator_district.setText(legislator.getDistrict());
        Picasso.with(itemView.getContext()).load(legislator.getPhoto_url()).fit().centerCrop().into(legislator_photo);
        String fb = "FB: -";
        if (legislator.getLegislator_facebook() != null && !legislator.getLegislator_facebook().trim().equals(""))
            fb = "FB: " + legislator.getLegislator_facebook();
        legislator_facebook.setText(fb);

        String tw = "TW: -";
        if (legislator.getLegislator_twitter() != null && !legislator.getLegislator_twitter().trim().equals(""))
            tw = "TW: " + legislator.getLegislator_twitter();
        legislator_twitter.setText(tw);

        officeRecyclerView.setAdapter(new OfficeRecyclerAdapter(legislator.getOffices(), R.layout.office_details));
    }

}

class OfficeRecyclerAdapter extends RecyclerView.Adapter<OfficeRecyclerAdapter.OfficeHolder> {

    private List<Office> items;
    private int itemLayout;

    public OfficeRecyclerAdapter(List<Office> items, int itemLayout) {
        this.items = items;
        this.itemLayout = itemLayout;
    }

    @Override public OfficeHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(itemLayout, parent, false);
        final OfficeHolder oh = new OfficeHolder(v);
        oh.setOnClickListener(new OfficeHolder.ClickListener() {
            @Override
            public void onItemClick(View view, int position) {
                Office office = items.get(position);
                Util.checkPhonePermission(view.getContext());
                Intent intent = new Intent(Intent.ACTION_CALL);
                intent.setData(Uri.parse("tel:" + office.getPhone()));
                view.getContext().startActivity(intent);
            }
        });
        return oh;
    }

    @Override public void onBindViewHolder(OfficeHolder holder, int position) {
        Office item = items.get(position);
        holder.office_name.setText(item.getName());
        holder.office_phone.setText(item.getPhone());
        holder.office_address.setText(item.getAddress());
    }

    @Override public int getItemCount() {
        return items.size();
    }

    public static class OfficeHolder extends RecyclerView.ViewHolder {
        public TextView office_name, office_phone, office_address;
        private View itemView;

        // https://stackoverflow.com/a/41629505
        private OfficeHolder.ClickListener officeClickListener;

        public OfficeHolder(View itemView) {
            super(itemView);
            this.itemView = itemView;
            office_name = itemView.findViewById(R.id.office_name);
            office_phone = itemView.findViewById(R.id.office_phone);
            office_address = itemView.findViewById(R.id.office_address);

            // https://stackoverflow.com/a/41629505
            // Notice how we put the listener just on the "Select" link.  Most other XxxxxHolder's
            // put the OnClick Listener on the itemView object so that we can click anywhere
            // on that object's line and fire the listener
            office_phone.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    System.out.println("OfficeHolder: onClick: officeClickListener="+officeClickListener);
                    officeClickListener.onItemClick(v, getAdapterPosition());
                }
            });
        }

        // https://stackoverflow.com/a/41629505
        //Interface to send callbacks...
        public interface ClickListener {
            public void onItemClick(View view, int position);
            //public void onItemLongClick(View view, int position); // don't need this, just FYI
        }

        // https://stackoverflow.com/a/41629505
        public void setOnClickListener(OfficeHolder.ClickListener clickListener){
            officeClickListener = clickListener;
        }
    }
}