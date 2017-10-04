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
    }

    public void setName(String name) {
        userField.setText(name);
    }
}