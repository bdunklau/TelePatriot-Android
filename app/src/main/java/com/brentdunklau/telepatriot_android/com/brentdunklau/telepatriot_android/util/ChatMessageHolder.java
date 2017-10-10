package com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util;

import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;

/**
 * Created by bdunklau on 10/10/2017.
 */

public class ChatMessageHolder extends RecyclerView.ViewHolder {

    private TextView chatMessageField;
    private TextView nameField;

    public ChatMessageHolder(View itemView) {
        super(itemView);
        chatMessageField = itemView.findViewById(R.id.chat_message);
        nameField = itemView.findViewById(R.id.name);
    }

    public void setChatMessage(ChatMessage chatMessage) {
        chatMessageField.setText(chatMessage.getMessage());
        nameField.setText(chatMessage.getName());
    }
}
