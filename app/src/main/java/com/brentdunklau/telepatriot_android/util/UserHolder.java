package com.brentdunklau.telepatriot_android.util;

import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;

/**
 * Created by bdunklau on 10/4/17.
 */

public class UserHolder extends RecyclerView.ViewHolder {

    // https://stackoverflow.com/a/41629505
    private UserHolder.ClickListener mClickListener;

    private TextView userField;
    private TextView dateField;
    private TextView reviewedByField;

    public UserHolder(View itemView) {
        super(itemView);
        userField = itemView.findViewById(R.id.name);
        dateField = itemView.findViewById(R.id.date);
        reviewedByField = itemView.findViewById(R.id.reviewed_by);

        // https://stackoverflow.com/a/41629505
        //listener set on ENTIRE ROW, you may set on individual components within a row.
        itemView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mClickListener.onItemClick(v, getAdapterPosition());
            }
        });
    }

    // https://stackoverflow.com/a/41629505
    //Interface to send callbacks...
    public interface ClickListener {
        public void onItemClick(View view, int position);
        public void onItemLongClick(View view, int position);
    }

    // https://stackoverflow.com/a/41629505
    public void setOnClickListener(UserHolder.ClickListener clickListener){
        mClickListener = clickListener;
    }

    public void setName(String name) {
        userField.setText(name);
    }

    public void setDate(String date) {
        dateField.setText(date);
    }

    public void setReviewedBy(String reviewedBy) {
        reviewedByField.setText(reviewedBy);
    }
}