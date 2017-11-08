package com.brentdunklau.telepatriot_android;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.TelephonyManager;
import android.util.Log;

import com.brentdunklau.telepatriot_android.util.AccountStatusEvent;
import com.brentdunklau.telepatriot_android.util.User;
import com.firebase.ui.auth.AuthUI;

import java.util.Arrays;

/**
 * Created by bdunklau on 10/12/2017.
 */

public class LauncherActivity extends BaseActivity implements AccountStatusEvent.Listener {

    private static final int RC_SIGN_IN = 1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // We don't need to do this because we're never going to show this
        // screen.  We're either going to go to the Login screen provided by
        // FirebaseUI or we're going to go to MainActivity
        setContentView(R.layout.activity_launcher);

        if(User.getInstance().isLoggedIn()) {
            // then we can skip this and go straight to MainActivity
            startActivity(new Intent(this, MainActivity.class));
        }
        else {
            // gotta stick around and login
            AuthUI aui = AuthUI.getInstance();
            AuthUI.SignInIntentBuilder sib = aui.createSignInIntentBuilder()
                    .setAvailableProviders(Arrays.asList(
                            new AuthUI.IdpConfig.Builder(AuthUI.FACEBOOK_PROVIDER).build(),
                            //new AuthUI.IdpConfig.Builder(AuthUI.EMAIL_PROVIDER).build(),
                            new AuthUI.IdpConfig.Builder(AuthUI.GOOGLE_PROVIDER).build()
                            )
                    );

            Intent intent = sib.build();

            // NOTE:  FirebaseAuth.getInstance().getCurrentUser() = null  at this point
            startActivityForResult(intent, RC_SIGN_IN);
        }
    }


    /* We don't even need to do this because the singleton constructor in User.java registers
    itself as a Firebase Auth state listener.  Go look at the queries we do in login() and see how
    we fire different events when the user is written and removed from the /no_roles node
*/
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        // NOTE:  FirebaseAuth.getInstance().getCurrentUser() IS NOT null  at this point

        super.onActivityResult(requestCode, resultCode, data);
        if(requestCode == RC_SIGN_IN) {
            if(resultCode == RESULT_OK) {
                if(User.getInstance().hasAnyRole()) {
                    startActivity(new Intent(this, MainActivity.class));
                }
                else {
                    // We only do this if the user is brand new and doesn't have any roles yet.
                    // When the user is brand new, we send them to the LimboActivity screen
                    // where they just have to sit and wait for an admin to let them in.
                    // Look at fired(AccountStatusEvent evt) below...
                    User.getInstance().addAccountStatusEventListener(this);
                }

            } else {
                // user not authenticated
                Log.d("LauncherActivity", "USER NOT AUTHENTICATED");
            }

        }
    }

    // per AccountStatusEvent.Listener
    // This is what gets called by virtue of this call
    //    above: User.getInstance().addAccountStatusEventListener(this);
    @Override
    public void fired(AccountStatusEvent evt) {
        if(evt instanceof AccountStatusEvent.NoRoles)
            startActivity(new Intent(this, LimboActivity.class));
    }

}
