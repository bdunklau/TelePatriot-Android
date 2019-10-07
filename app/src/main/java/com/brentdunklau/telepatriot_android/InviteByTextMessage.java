package com.brentdunklau.telepatriot_android;

import android.Manifest;
import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.telephony.SmsManager;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.VideoNode;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import org.w3c.dom.Text;

import java.net.URLEncoder;
import java.util.Map;

/**
 * Created by bdunklau on 10/6/19.
 */

public class InviteByTextMessage extends Dialog {

    private Button button_send_text_message;
    private Button button_cancel;
    private TextView guest_name;
    private TextView guest_phone;
    private static final int SMS_PERMISSION_REQUEST_CODE = 1;


    public InviteByTextMessage(final Context activity, final VideoNode currentVideoNode) {
        super(activity);

        setContentView(R.layout.invite_by_text_message_dlg);

        button_send_text_message = findViewById(R.id.button_send_text_message);
        button_cancel = findViewById(R.id.button_cancel);


        if(!hasPermissionForSms(activity)) {
            requestPermissionForSms((android.app.Activity) activity);
        }

        button_send_text_message.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                sendTextMessage(currentVideoNode);
            }
        });

        button_cancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                InviteByTextMessage.this.dismiss();
            }
        });
    }

    private void sendTextMessage(final VideoNode currentVideoNode) {
        guest_name = findViewById(R.id.guest_name);
        guest_phone = findViewById(R.id.guest_phone);
        final String name = guest_name.getText().toString();
        final String first_name = name.substring(0, name.indexOf(" "));
        final String message = "Hi "+first_name+"\nPlease touch the link below to join me on a video call\n\nThanks!\n"+ User.getInstance().getName();

        FirebaseDatabase.getInstance().getReference("administration/hosts")
                .orderByChild("type")
                .equalTo("firebase functions")
                .addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                if(dataSnapshot.getChildrenCount() == 0) {
                    // this should never happen - we should always have an administration/hosts node with type:firebase functions
                    // This is where we specify in the database what the server url is
                    return;
                }

                DataSnapshot obj = (DataSnapshot) dataSnapshot.getChildren().iterator().next();
                Map<String, Object> hostNode = (Map<String, Object>) obj.getValue();
                        String server = hostNode.get("host")+"";

                String encodedName = first_name;
                try {
                    encodedName = URLEncoder.encode(name, "UTF-8");
                } catch(Throwable t) {
                }

                String videoCallInvitation = "https://"+server+"/video_call_invitation?"
                        +"video_node_key="+currentVideoNode.getKey()
                        +"&phone="+guest_phone.getText().toString()
                        +"&name="+ encodedName;
                SmsManager smsManager = SmsManager.getDefault();
                String ph = guest_phone.getText().toString();
                smsManager.sendTextMessage(ph, null, message, null, null);
                smsManager.sendTextMessage(ph, null, videoCallInvitation, null, null);

                // invited person needs to be displayed when we return to VidyoChatFragment - how do we do that???
                InviteByTextMessage.this.dismiss();
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {  }
        });




    }

    private boolean hasPermissionForSms(Context activity) {
        int resultSms = ContextCompat.checkSelfPermission(activity, Manifest.permission.SEND_SMS);
        return resultSms == PackageManager.PERMISSION_GRANTED;
    }

    private void requestPermissionForSms(android.app.Activity activity) {
        if (ActivityCompat.shouldShowRequestPermissionRationale(activity, Manifest.permission.SEND_SMS)) {
            Toast.makeText(activity,
                    R.string.permissions_needed,
                    Toast.LENGTH_LONG).show();
        } else {
            ActivityCompat.requestPermissions(
                    activity,
                    new String[]{Manifest.permission.SEND_SMS},
                    SMS_PERMISSION_REQUEST_CODE);
        }
    }

}
