package com.brentdunklau.telepatriot_android;

import android.content.Intent;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

import com.brentdunklau.telepatriot_android.util.AccountStatusEvent;
import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.Util;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserProfileChangeRequest;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by bdunklau on 10/25/18.
 */

public class MissingInformationActivity extends AppCompatActivity {

    private String uid;
    private EditText name_field;
    private EditText email_field;
    private Button save_button;

    @Override
    protected void onCreate(final Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_missing_information);

        uid = getIntent().getStringExtra("uid");
        name_field = findViewById(R.id.name_field);
        email_field = findViewById(R.id.email_field);
        save_button = findViewById(R.id.save_button);

        save_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                saveInfo();
            }
        });
    }

    @Override
    public void onBackPressed() {
        // super.onBackPressed(); commented this line in order to disable back press

        // If you land on this screen, I don't WANT you to be able to back up
    }

    private void saveInfo() {
        final String name = name_field.getText().toString();
        final String email = email_field.getText().toString();
        if(name == null || email == null || name.trim().equals("") || email.trim().equals("")) {
            Util.simpleOKDialog(this, "All fields on this screen are required");
        }
        else if(!Util.valid(email)) {
            Util.simpleOKDialog(this, "This is not a valid email address:\n"+email);
        }
        else {
            UserProfileChangeRequest cr = new UserProfileChangeRequest.Builder().setDisplayName(name).build();
            FirebaseAuth.getInstance().getCurrentUser().updateProfile(cr).addOnCompleteListener(new OnCompleteListener<Void>() {
                @Override
                public void onComplete(@NonNull Task<Void> task) {

                    // multi-path update example
                    Map m = new HashMap();
                    m.put("account_disposition", "enabled");
                    m.put("name", name);
                    m.put("email", email);
                    FirebaseDatabase.getInstance().getReference("users").child(uid).updateChildren(m);
                    FirebaseAuth.getInstance().getCurrentUser().updateEmail(email);
                }
            });
            Intent intent = new Intent(this, LimboActivity.class);
            intent.putExtra("name", name);
            intent.putExtra("email", email);
            startActivity(intent);
            finish();
        }

//        FirebaseDatabase.getInstance().getReference()
//        startActivity(new Intent(this, LimboActivity.class));
    }

}
