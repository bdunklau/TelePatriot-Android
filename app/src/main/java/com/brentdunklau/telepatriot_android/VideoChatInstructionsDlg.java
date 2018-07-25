package com.brentdunklau.telepatriot_android;

import android.app.Activity;
import android.app.Dialog;
import android.content.DialogInterface;
import android.support.v7.app.AlertDialog;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.VideoNode;
import com.brentdunklau.telepatriot_android.util.VideoType;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

import java.util.List;

/**
 * Created by bdunklau on 7/24/18.
 */

public class VideoChatInstructionsDlg extends Dialog {


    //private EditText repNameEdit;
    //private EditText fbRepEdit;
    //private EditText twitterInfoEdit;
    private TextView videoChatDescriptionTitle;
    private TextView editDescriptionButton;
    private TextView videoChatDescriptionText;
    private TextView legislator_header;
    private TextView choose_legislator;
    private TextView legislator_first_name;
    private TextView legislator_last_name;
    private TextView legislator_state_abbrev;
    private TextView legislator_chamber;
    private TextView legislator_district;
    private TextView legislator_facebook;
    private ImageView edit_facebook;
    private TextView legislator_twitter;
    private ImageView edit_twitter;
    private TextView videoChatYouTubeVideoDescription;
    private TextView editYouTubeButton;
    private TextView videoChatYouTubeDescription;
    private VideoNode currentVideoNode;
    private Button back_to_video;
    private View myView;


    public VideoChatInstructionsDlg(Activity activity, View myView) {
        super(activity);

        setContentView(R.layout.video_chat_instructions_dlg);

        this.myView = myView;

        //repNameEdit = findViewById(R.id.repNameEdit);
        //fbRepEdit = findViewById(R.id.fbRepEdit);
        //twitterInfoEdit = findViewById(R.id.twitterInfoEdit);
        videoChatDescriptionTitle = findViewById(R.id.videoChatDescriptionTitle);
        editDescriptionButton = findViewById(R.id.editDescriptionButton);
        videoChatDescriptionText = findViewById(R.id.videoChatDescriptionText);
        legislator_header = findViewById(R.id.legislator_header);
        choose_legislator = findViewById(R.id.choose_legislator);
        legislator_first_name = findViewById(R.id.legislator_first_name);
        legislator_last_name = findViewById(R.id.legislator_last_name);
        legislator_state_abbrev = findViewById(R.id.legislator_state_abbrev);
        legislator_chamber = findViewById(R.id.legislator_chamber);
        legislator_district = findViewById(R.id.legislator_district);
        legislator_facebook = findViewById(R.id.legislator_facebook);
        edit_facebook = findViewById(R.id.edit_facebook);
        legislator_twitter = findViewById(R.id.legislator_twitter);
        edit_twitter = findViewById(R.id.edit_twitter);
        videoChatYouTubeVideoDescription = findViewById(R.id.videoChatYouTubeVideoDescription);
        editYouTubeButton = findViewById(R.id.editYouTubeButton);
        editYouTubeButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                editYouTubeDescription();
            }
        });

        videoChatYouTubeDescription = findViewById(R.id.videoChatYouTubeDescription);

        videoChatDescriptionText = findViewById(R.id.videoChatDescriptionText);
        List<VideoType> videoTypes = VideoType.getTypes();
        VideoType videoType = videoTypes.get(0); // TODO how are we going to choose different video types?
        videoChatDescriptionText.setText(videoType.getVideo_mission_description());

        choose_legislator = findViewById(R.id.choose_legislator);
        choose_legislator.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                chooseLegislator();
            }
        });

        edit_facebook.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // pop up a dialog with a field allowing you to set facebook handle
                dlg(currentVideoNode, "legislator_facebook",
                        currentVideoNode.getLegislator_facebook(), legislator_facebook,
                        "Facebook Handle");
            }
        });

        edit_twitter.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // pop up a dialog with a field allowing you to set twitter handle
                dlg(currentVideoNode, "legislator_twitter",
                        currentVideoNode.getLegislator_twitter(), legislator_twitter,
                        "Twitter Handle");
            }
        });

        String vtype = "Video Petition"; // TODO at some point, get this from the database
        final String videoNodeKey = getVideoNodeKey(vtype);

        if(videoNodeKey != null) {
            FirebaseDatabase.getInstance().getReference("video/list/" + videoNodeKey).addValueEventListener(new ValueEventListener() {
                @Override
                public void onDataChange(DataSnapshot dataSnapshot) {
                    VideoNode vnode = dataSnapshot.getValue(VideoNode.class);
                    if(vnode == null) return;
                    currentVideoNode = vnode;
                    currentVideoNode.setKey(videoNodeKey);
                    videoChatDescriptionText.setText(currentVideoNode.getVideo_mission_description());
                    setLegislatorFields(currentVideoNode);

                    editYouTubeButton.setText(currentVideoNode.getYoutube_video_description());
                }

                @Override
                public void onCancelled(DatabaseError databaseError) { }
            });
        }

        back_to_video = findViewById(R.id.back_to_video);
        back_to_video.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                VideoChatInstructionsDlg.this.dismiss();
            }
        });

    }

    private String getVideoNodeKey(String vtype) {

        String current_video_node_key = User.getInstance().getCurrent_video_node_key();
        if(current_video_node_key != null) {
            return current_video_node_key;
        }
        else {
            VideoNode vn = createVideoNode(vtype);
            if(vn == null)
                return null;
            User.getInstance().setCurrent_video_node_key(vn.getKey());
            return vn.getKey();
        }
    }


    private void chooseLegislator() {
        EditLegislatorForVideoDlg dialog = new EditLegislatorForVideoDlg(getContext(), currentVideoNode);
        dialog.show();
    }


    @Override
    public void show() {
        super.show();
        getWindow().setLayout(WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT);
    }

    private void setLegislatorFields(VideoNode node) {
        if(node.getLeg_id() == null || node.getLeg_id().trim().equals("")) {
            legislator_first_name.setText("");
            legislator_last_name.setText("");
            legislator_state_abbrev.setText("");
            legislator_chamber.setText("");
            legislator_district.setText("");
            legislator_facebook.setText("");
            legislator_twitter.setText("");
        }
        else {
            legislator_first_name.setText(node.getLegislator_first_name());
            legislator_last_name.setText(node.getLegislator_last_name());
            String state_abbrev = "";
            if(node.getLegislator_state() != null)
                state_abbrev = node.getLegislator_state().toUpperCase();
            legislator_state_abbrev.setText(state_abbrev);

            if(node.getLegislator_chamber() == null)
                legislator_chamber.setText("");
            else
                legislator_chamber.setText("lower".equalsIgnoreCase(node.getLegislator_chamber()) ? "HD" : "SD");

            legislator_district.setText(node.getLegislator_district());

            String fb = "FB: -";
            if(node.getLegislator_facebook() != null)
                fb = "FB: "+node.getLegislator_facebook();
            legislator_facebook.setText(fb);

            String tw = "TW: -";
            if(node.getLegislator_twitter() != null)
                tw = "TW: "+node.getLegislator_twitter();
            legislator_twitter.setText(tw);
        }


    }

    /**
     * Created so that we could pop up a simple dialog and edit facebook and twitter handles
     * for legislators
     * @param videoNode The node under video/list
     * @param attributeName The name of the attribute in the video node, i.e. It would be the
     *                      "legislator_facebook" part of video/list/{key}/legislator_facebook
     * @param attributeValue the value of the node, i.e. the value of video/list/{key}/legislator_facebook
     * @param screenElement the corresponding screen element on this fragmenet, i.e. legislator_facebook
     */
    private void dlg(final VideoNode videoNode, final String attributeName, String attributeValue, TextView screenElement, String what) {
        LayoutInflater li = LayoutInflater.from(getContext());
        final View promptsView = li.inflate(R.layout.ok_cancel_dialog_one_numeric_input, null);
        TextView heading = promptsView.findViewById(R.id.dialog_heading);
        heading.setText("Edit "+what);
        TextView moreInf = promptsView.findViewById(R.id.dialog_additional_information);
        String moreInfo = "Update the "+what+" for "+videoNode.getLegislator_first_name()+" "+videoNode.getLegislator_last_name();
        moreInf.setText(moreInfo);
        EditText thefield = promptsView.findViewById(R.id.dialog_input);
        thefield.setText(attributeValue);

        AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(getContext());
        alertDialogBuilder.setView(myView);

        // set prompts.xml to alertdialog builder
        alertDialogBuilder.setView(promptsView);

        final EditText userInput = (EditText) promptsView
                .findViewById(R.id.dialog_input);

        // set dialog message
        alertDialogBuilder
                .setCancelable(false)
                .setPositiveButton("OK",
                        new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog,int id) {
                                // this is where we save the new value to the database
                                String newval = ((EditText) promptsView.findViewById(R.id.dialog_input)).getText().toString();

                                // See EditSocialMediaVC in Swift - You can't just update the social media node like this.
                                // You have to update the legislator's channel.  And I'm not even sure if the swift code then
                                // updates the social handle under /video/list/{key}/legislator_facebook or legislator_twitter
                                // That might be happening via firebase trigger function.  I would have to see how the iPhone
                                // version works to be sure.
                                FirebaseDatabase.getInstance().getReference("video/list/"+videoNode.getKey()+"/"+attributeName).setValue(newval);
                                dialog.dismiss();
                            }
                        })
                .setNegativeButton("Cancel",
                        new DialogInterface.OnClickListener() {
                            public void onClick(DialogInterface dialog, int id) {
                                dialog.cancel();
                            }
                        });

        // create alert dialog
        AlertDialog alertDialog = alertDialogBuilder.create();
        // show it
        alertDialog.show();
    }

    private void editYouTubeDescription() {
        if (editYouTubeButton.getText().toString().trim().equals("Edit")){
            videoChatYouTubeDescription.setVisibility(View.INVISIBLE);
            //mYouTubeEditText.setVisibility(View.VISIBLE);
            editYouTubeButton.setText("Done");
        }else{
            //videoChatYouTubeDescription.setText(mYouTubeEditText.getText());
            videoChatYouTubeDescription.setVisibility(View.VISIBLE);
            //mYouTubeEditText.setVisibility(View.GONE);
            editYouTubeButton.setText("Edit");
        }
    }

    private VideoNode createVideoNode(String t) {
        VideoType vtype = VideoType.getType(t /*"Video Petition"*/);
        if(vtype == null)
            return null; // might want some sensible default

        return new VideoNode(User.getInstance(), vtype);
    }
}
