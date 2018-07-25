package com.brentdunklau.telepatriot_android;

import android.app.Activity;
import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import com.brentdunklau.telepatriot_android.util.Legislator;
import com.brentdunklau.telepatriot_android.util.LegislatorHolder;
import com.brentdunklau.telepatriot_android.util.Util;
import com.brentdunklau.telepatriot_android.util.VideoNode;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
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

    private FirebaseRecyclerAdapter<Legislator, LegislatorHolder> mAdapter;
    private RecyclerView legislatorRecyclerView;

    public EditLegislatorForVideoDlg(/*Activity*/Context activity, VideoNode v) {
        super(activity);

        setContentView(R.layout.edit_legislator_for_video_dlg);

        state_spinner = findViewById(R.id.state_spinner);
        chamber_spinner = findViewById(R.id.chamber_spinner);
        district_spinner = findViewById(R.id.district_spinner);

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
                //Toast.makeText(getContext(), "Selected : " + selectedItem, Toast.LENGTH_SHORT).show();
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
                //Toast.makeText(getContext(), "Selected : " + selectedItem, Toast.LENGTH_SHORT).show();
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
                //Toast.makeText(getContext(), "Selected : " + selectedItem, Toast.LENGTH_SHORT).show();
                selectedDistrict = selectedItem;
                displayLegislators(selectedState, selectedChamber, selectedDistrict);
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) { }
        });



        legislatorRecyclerView = (RecyclerView) findViewById(R.id.legislator_list);
        legislatorRecyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
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
        String ch = chamber.equalsIgnoreCase("SD") ? "upper" :  "lower";
        String state_chamber_district = state+"-"+ch+"-"+district;
        final Query ref = FirebaseDatabase.getInstance().getReference("states/legislators")
                .orderByChild("state_chamber_district")
                .equalTo(state_chamber_district);
        ref.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                doit(ref);
            }

            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });
    }

    private void doit(final /*DatabaseReference*/ Query ref) {

        //final FragmentManager fragmentManager = getFragmentManager();

        // see:  https://www.youtube.com/watch?v=ynKWnC0XiXk
        mAdapter = new FirebaseRecyclerAdapter<Legislator, LegislatorHolder>(
                Legislator.class,
                R.layout.legislator_details,  // see 0:42 of https://www.youtube.com/watch?v=A-_hKWMA7mk
                LegislatorHolder.class,
                ref) {
            @Override
            public void populateViewHolder(LegislatorHolder holder, Legislator legislator, int position) {
                holder.setLegislator(legislator);
            }


            // https://stackoverflow.com/a/41629505
            @Override
            public LegislatorHolder onCreateViewHolder(ViewGroup parent, int viewType) {
                LegislatorHolder viewHolder = super.onCreateViewHolder(parent, viewType);

                /*************************************************************************************
                 See LegislatorHolder.setOnClickListener()
                 See LegislatorHolder.select_legislator.setOnClickListener(...mClickListener.onItemClick...)
                 Use case: Click "Select" next to a legislator -> fires the onClickListener attached to LegislatorHolder.select_legislator
                 The onClickListener is LegislatorHolder.mClickListener
                 And LegislatorHolder.mClickListener = clickListener below
                 So clicking "Select" next to a legislator's name has the effect of updating the /video/list/[video_node_key] node with the
                 selected legislator's info
                *************************************************************************************/
                LegislatorHolder.ClickListener clickListener = new LegislatorHolder.ClickListener() {
                    @Override
                    public void onItemClick(View view, int position) {
                        mAdapter.getRef(position).orderByKey().addListenerForSingleValueEvent(new ValueEventListener() {
                            @Override
                            public void onDataChange(DataSnapshot dataSnapshot) {
                                Legislator legislator = dataSnapshot.getValue(Legislator.class);
                                // now update the video node and put this legislator on that node
                                if(currentVideoNode != null) {
                                    DatabaseReference vref = FirebaseDatabase.getInstance().getReference("video/list/"+currentVideoNode.getKey());
                                    vref.updateChildren(legislator.getValuesForVideoNode());
                                }

                                // then dismiss this dialog
                                EditLegislatorForVideoDlg.this.dismiss();
                            }

                            @Override
                            public void onCancelled(DatabaseError databaseError) { }
                        });
                    }

                    //@Override
                    //public void onItemLongClick(View view, int position) {
                    //}
                };
                viewHolder.setOnClickListener(clickListener);
                return viewHolder;
            }
        };
        legislatorRecyclerView.setAdapter(mAdapter);
    }
}
