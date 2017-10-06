package com.brentdunklau.telepatriot_android;

import java.util.Map;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.support.v4.app.NotificationCompat;
import android.support.v4.content.LocalBroadcastManager;
import android.util.Log;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "MyFMService";
    private LocalBroadcastManager broadcaster;

    public MyFirebaseMessagingService() {
    }

    @Override
    public void onCreate() {
        broadcaster = LocalBroadcastManager.getInstance(this);
    }

    /**
     * This gets called when the app is up.
     * It doesn't get called when the app is in the background.
     * When the app is in the background, you get a notification
     * And when you click the notification, you are sent to the activity's
     * onCreate() method
     * @see  https://github.com/firebase/quickstart-android/blob/master/messaging/app/src/main/java/com/google/firebase/quickstart/fcm/MyFirebaseMessagingService.java#L45-L82
     *
     */
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        // Handle data payload of FCM messages.
        Log.d(TAG, "FCM Message Id: " + remoteMessage.getMessageId());
        Log.d(TAG, "FCM Notification Message: " +
                remoteMessage.getNotification());
        Map<String, String> data = remoteMessage.getData();
        Log.d(TAG, "FCM Data Message: " + remoteMessage.getData());


        Intent intent = new Intent("NewUser");
        intent.putExtra("title", remoteMessage.getData().get("title"));
        intent.putExtra("message", remoteMessage.getData().get("message"));
        intent.putExtra("uid", remoteMessage.getData().get("uid"));
        broadcaster.sendBroadcast(intent);

    }

}
