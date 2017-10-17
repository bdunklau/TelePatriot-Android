package com.brentdunklau.telepatriot_android.util;

import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;

/**
 * Created by bdunklau on 10/2/2017.
 */

public class AccountStatusEventHolder extends RecyclerView.ViewHolder {
    private TextView dateField, nameField;

    public AccountStatusEventHolder(View itemView) {
        super(itemView);
        dateField = (TextView) itemView.findViewById(R.id.date);
        nameField = (TextView) itemView.findViewById(R.id.name);
    }

    public void setStatus(String date, String event) {
        dateField.setText(date);
        nameField.setText(event); // TODO oops we're reusing the firebase recycler view and getting our
        // fields mixed up.  Should probably create a layout specifically for the account status events
    }
}