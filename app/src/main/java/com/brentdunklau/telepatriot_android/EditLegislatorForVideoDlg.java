package com.brentdunklau.telepatriot_android;

import android.app.Activity;
import android.app.Dialog;
import android.view.View;
import android.view.WindowManager;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import com.brentdunklau.telepatriot_android.util.VideoNode;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class EditLegislatorForVideoDlg extends Dialog {

    private VideoNode currentVideoNode;
    private Spinner state_spinner, chamber_spinner, district_spinner;
    // just some default values...
    private String selectedState = "tx", selectedChamber = "HD", selectedDistrict = "1";
    private Map<String, String> stateMap = new HashMap<String, String>();

    public EditLegislatorForVideoDlg(Activity activity, VideoNode v) {
        super(activity);

        setContentView(R.layout.edit_legislator_for_video_dlg);

        state_spinner = (Spinner) findViewById(R.id.state_spinner);
        chamber_spinner = (Spinner) findViewById(R.id.chamber_spinner);
        district_spinner = (Spinner) findViewById(R.id.district_spinner);

        if(v != null) {
            currentVideoNode = v;
        }

        TextView cancel = (TextView) findViewById(R.id.cancel);
        cancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                dismiss();
            }
        });

        loadStates();
        loadChambers();
        chamber_spinner.setSelection(0);
        // districts have to be loaded dynamically

        state_spinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int position, long l) {
                String selectedItem = (String) adapterView.getItemAtPosition(position);
                // Notify the selected item text
                Toast.makeText(getContext(), "Selected : " + selectedItem, Toast.LENGTH_SHORT).show();
                // look up the abbrev given the long state name...
                selectedState = stateMap.get(selectedItem);
                displayListOfDistricts(selectedState, selectedChamber);
                displayLegislators(selectedState, selectedChamber, selectedDistrict);
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) { }
        });

        chamber_spinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int position, long l) {
                String selectedItem = (String) adapterView.getItemAtPosition(position);
                // Notify the selected item text
                Toast.makeText(getContext(), "Selected : " + selectedItem, Toast.LENGTH_SHORT).show();
                selectedChamber = selectedItem;
                displayListOfDistricts(selectedState, selectedChamber);
                displayLegislators(selectedState, selectedChamber, selectedDistrict);
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) { }
        });

        district_spinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int position, long l) {
                String selectedItem = (String) adapterView.getItemAtPosition(position);
                // Notify the selected item text
                Toast.makeText(getContext(), "Selected : " + selectedItem, Toast.LENGTH_SHORT).show();
                selectedDistrict = selectedItem;
                displayLegislators(selectedState, selectedChamber, selectedDistrict);
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) { }
        });
    }

    @Override
    public void show() {
        super.show();
        getWindow().setLayout(WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT);
    }

    private void loadStates() {

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
                Spinner spinner = findViewById(R.id.state_spinner);
                ArrayAdapter<String> adapter = new ArrayAdapter<String>(getContext(), android.R.layout.simple_spinner_item, states);
                adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
                spinner.setAdapter(adapter);
            }

            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });

    }

    private void loadChambers() {
        Spinner spinner = findViewById(R.id.chamber_spinner);
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(getContext(), android.R.layout.simple_spinner_item, Arrays.asList(new String[]{"HD", "SD"}));
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(adapter);
    }

    private void displayListOfDistricts(String state, String chamber) {
        String ch = chamber.equalsIgnoreCase("SD") ? "upper" : "lower";
        String state_chamber = state+"-"+ch;

        FirebaseDatabase.getInstance().getReference("states/districts").orderByChild("state_chamber").equalTo(state_chamber).addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                // adapted from MyMissionFragment
                List<String> districts = new ArrayList<String>();
                for (DataSnapshot child : dataSnapshot.getChildren()) {
                    districts.add(child.child("name").getValue(String.class));
                }
                Spinner spinner = findViewById(R.id.district_spinner);
                ArrayAdapter<String> adapter = new ArrayAdapter<String>(getContext(), android.R.layout.simple_spinner_item, districts);
                adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
                spinner.setAdapter(adapter);
            }

            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });
    }

    private void displayLegislators(String state, String chamber, String district) {
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
        System.out.println("displayLegislators:  nothing here yet");
    }
}
