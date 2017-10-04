package com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util;

import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;

/**
 * Created by bdunklau on 10/2/2017.
 */

public class AccountStatusEventHolder extends RecyclerView.ViewHolder {
    private final TextView statusField;

    public AccountStatusEventHolder(View itemView) {
        super(itemView);
        statusField = (TextView) itemView.findViewById(R.id.line_item);
    }

    public void setStatus(String date, String event) {
        statusField.setText(date+" "+event);
    }
}