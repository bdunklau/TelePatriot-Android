package com.brentdunklau.telepatriot_android;


import android.content.Intent;
import android.support.annotation.NonNull;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;

import com.firebase.ui.auth.AuthUI;
//import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

import java.util.Arrays;

public class MainActivity extends AppCompatActivity
        //implements GoogleApiClient.OnConnectionFailedListener
{

    private static final int RC_SIGN_IN = 1;
    private static final String TAG = "MainActivity";
    public static final String ANONYMOUS = "anonymous";
    private String mUsername;

    // Firebase instance variables
    private FirebaseAuth mFirebaseAuth;  // see https://codelabs.developers.google.com/codelabs/firebase-android/#5
    private FirebaseUser mFirebaseUser;  // see https://codelabs.developers.google.com/codelabs/firebase-android/#5

    //private GoogleApiClient mGoogleApiClient;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Initialize Firebase Auth
        mFirebaseAuth = FirebaseAuth.getInstance();
        if(mFirebaseAuth.getCurrentUser() != null) {
            // user already signed in
        } else {
            AuthUI aui = AuthUI.getInstance();
            AuthUI.SignInIntentBuilder sib = aui.createSignInIntentBuilder()
                    .setAvailableProviders(Arrays.asList(
                            new AuthUI.IdpConfig.Builder(AuthUI.FACEBOOK_PROVIDER).build(),
                            new AuthUI.IdpConfig.Builder(AuthUI.GOOGLE_PROVIDER).build(),
                            new AuthUI.IdpConfig.Builder(AuthUI.EMAIL_PROVIDER).build()
                            )
                    );

            Intent intent = sib.build();
            intent.putExtra("backgroundImage", R.drawable.usflag);

            startActivityForResult(intent, RC_SIGN_IN);
        }


/*
        // Set default username is anonymous.
        mUsername = ANONYMOUS;

        // Initialize Firebase Auth
        mFirebaseAuth = FirebaseAuth.getInstance();
        mFirebaseUser = mFirebaseAuth.getCurrentUser();
        if (mFirebaseUser == null) {
            // Not signed in, launch the Sign In activity
            startActivity(new Intent(this, SignInActivity.class));
            finish();
            return;
        } else {
            mUsername = mFirebaseUser.getDisplayName();
            if (mFirebaseUser.getPhotoUrl() != null) {
                //mPhotoUrl = mFirebaseUser.getPhotoUrl().toString(); // put back in when code ready
            }
        }

        mGoogleApiClient = new GoogleApiClient.Builder(this)
                .enableAutoManage(this *//* FragmentActivity *//*, this *//* OnConnectionFailedListener *//*)
                .addApi(Auth.GOOGLE_SIGN_IN_API)
                .build();*/
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if(requestCode == RC_SIGN_IN) {
            if(resultCode == RESULT_OK) {
                // user logged in
                Log.d(TAG, mFirebaseAuth.getCurrentUser().getEmail());
            } else {
                // user not authenticated
                Log.d(TAG, "USER NOT AUTHENTICATED");
            }
        }
    }

    private void signOut() {
        AuthUI.getInstance().signOut(this)
                .addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        Log.d(TAG, "USER LOGGED OUT");
                        finish();
                    }
                });
    }

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

    /*

    @Override
    public void onConnectionFailed(@NonNull ConnectionResult connectionResult) {
        // An unresolvable error has occurred and Google APIs (including Sign-In) will not
        // be available.
        Log.d(TAG, "onConnectionFailed:" + connectionResult);
        Toast.makeText(this, "Network connection dropped", Toast.LENGTH_SHORT).show();
    }*/
}
