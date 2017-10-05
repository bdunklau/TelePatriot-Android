package com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util;

import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;

/**
 * Created by bdunklau on 10/4/17.
 */

public class UserHolder extends RecyclerView.ViewHolder {
    private final TextView userField;

    public UserHolder(View itemView) {
        super(itemView);
        userField = (TextView) itemView.findViewById(R.id.line_item);

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
    private UserHolder.ClickListener mClickListener;

    // https://stackoverflow.com/a/41629505
    //Interface to send callbacks...
    public interface ClickListener{
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
}