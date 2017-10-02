package com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util;

import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.TextView;

/**
 * Created by bdunklau on 10/2/2017.
 */

public class AccountStatusEventHolder extends RecyclerView.ViewHolder {
    private final TextView dateField;
    private final TextView eventField;

    public AccountStatusEventHolder(View itemView) {
        super(itemView);
        dateField = (TextView) itemView.findViewById(android.R.id.text1);
        eventField = (TextView) itemView.findViewById(android.R.id.text2);
    }

    public void setDate(String date) {
        dateField.setText(date);
    }

    public void setEvent(String event) {
        eventField.setText(event);
    }
}