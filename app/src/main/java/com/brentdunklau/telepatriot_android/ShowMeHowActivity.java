package com.brentdunklau.telepatriot_android;

import android.content.DialogInterface;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.Util;
import com.brentdunklau.telepatriot_android.util.VideoOffer;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by bdunklau on 8/30/18.
 */

public class ShowMeHowActivity extends BaseActivity {

    protected String TAG = "ShowMeHowActivity";

    private Map<String, String> stateMap = new HashMap<String, String>();
    private String selectedState;
    private TextView lights_camera_action_heading;
    private TextView shoot_video_instructions;
    private EditText phone_number_field;
    private EditText residential_address_line1;
    private EditText residential_address_line2;
    private EditText residential_address_city;
    private Spinner residential_address_state_abbrev;
    private EditText residential_address_zip;
    private Button send_video_offer_button;



    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_show_me_how);

        lights_camera_action_heading = findViewById(R.id.lights_camera_action_heading);
        shoot_video_instructions = findViewById(R.id.shoot_video_instructions);
        send_video_offer_button = findViewById(R.id.send_video_offer_button);
        phone_number_field = findViewById(R.id.phone_number_field);
        residential_address_line1 = findViewById(R.id.residential_address_line1);
        residential_address_line2 = findViewById(R.id.residential_address_line2);
        residential_address_city = findViewById(R.id.residential_address_city);
        residential_address_zip = findViewById(R.id.residential_address_zip);

        // for testing only...
//        residential_address_line1.setText("6400 Lakeshore Dr");
//        residential_address_city.setText("Dallas");
//        residential_address_zip.setText("75214");

        send_video_offer_button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                clickCallMe();
            }
        });

        initStateSpinner();
    }

    private void clickCallMe() {
        User.getInstance().setPhone(phone_number_field.getText().toString());
        User.getInstance().setResidential_address_line1(residential_address_line1.getText().toString());
        User.getInstance().setResidential_address_line2(residential_address_line2.getText().toString());
        User.getInstance().setResidential_address_city(residential_address_city.getText().toString());
        User.getInstance().setResidential_address_state_abbrev(selectedState);
        User.getInstance().setResidential_address_zip(residential_address_zip.getText().toString());

        VideoOffer offer = new VideoOffer(User.getInstance());
        FirebaseDatabase.getInstance()
                .getReference("video/offers/" + User.getInstance().getUid())
                .setValue(offer)
                .addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        Util.simpleOKDialog(ShowMeHowActivity.this, "Got it!\nSomeone will contact you soon", onPhoneEntered());
                    }
                })
                .addOnFailureListener(new OnFailureListener() {
                    @Override
                    public void onFailure(@NonNull Exception e) {
                        Util.simpleOKDialog(ShowMeHowActivity.this, "Houston, we have a problem\nYour info was not received\n(Error: " + e.getMessage() + ")", onPhoneEntered());
                    }
                });
    }

    private DialogInterface.OnClickListener onPhoneEntered() {
        return new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int id) {
                ShowMeHowActivity.this.finish();
            }
        };
    }

    private void initStateSpinner() {
        residential_address_state_abbrev = findViewById(R.id.residential_address_state_abbrev);

        FirebaseDatabase.getInstance().getReference("states/list").addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                // adapted from MyMissionFragment
                List<String> states = new ArrayList<String>();
                for (DataSnapshot child : dataSnapshot.getChildren()) {
                    String state_name = child.child("state_name").getValue(String.class);
                    String state_abbrev = child.getKey();
                    states.add(state_name);
                    stateMap.put(state_name, state_abbrev);
                }
                residential_address_state_abbrev = findViewById(R.id.residential_address_state_abbrev);
                ArrayAdapter<String> adapter = new ArrayAdapter<String>(ShowMeHowActivity.this, android.R.layout.simple_spinner_item, states);
                adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
                residential_address_state_abbrev.setAdapter(adapter);


                residential_address_state_abbrev.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
                    @Override
                    public void onItemSelected(AdapterView<?> adapterView, View view, int position, long l) {
                        String selectedItem = (String) adapterView.getItemAtPosition(position);
                        // Notify the selected item text
                        //Toast.makeText(getContext(), "Selected : " + selectedItem, Toast.LENGTH_SHORT).show();
                        // look up the abbrev given the long state name...
                        selectedState = stateMap.get(selectedItem);
                    }

                    @Override
                    public void onNothingSelected(AdapterView<?> adapterView) { }
                });

                ArrayAdapter myAdap = (ArrayAdapter) residential_address_state_abbrev.getAdapter(); //cast to an ArrayAdapter
                int spinnerPosition = myAdap.getPosition("Texas");
                residential_address_state_abbrev.setSelection(spinnerPosition);
            }

            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });

    }

}