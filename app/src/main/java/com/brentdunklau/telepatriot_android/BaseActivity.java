package com.brentdunklau.telepatriot_android;

import android.support.annotation.NonNull;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;

import com.firebase.ui.auth.AuthUI;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

/**
 * Created by bdunklau on 10/1/17.
 */

public class BaseActivity extends AppCompatActivity {


    protected String TAG = "BaseActivity";

    // Firebase instance variables
    protected FirebaseAuth mFirebaseAuth;  // see https://codelabs.developers.google.com/codelabs/firebase-android/#5
    protected FirebaseDatabase database;
    protected DatabaseReference myRef;


    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch(item.getItemId()) {
            case(R.id.chat_help):
                return true;
            case(R.id.sign_out_menu):
                signOut();
                return true;
            default: return super.onOptionsItemSelected(item);
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main_menu, menu);
        //return true;
        return super.onCreateOptionsMenu(menu);
    }

    protected void signOut() {
        AuthUI.getInstance().signOut(this)
                .addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        Log.d(TAG, "USER LOGGED OUT");
                        finish();
                    }
                });
    }
}