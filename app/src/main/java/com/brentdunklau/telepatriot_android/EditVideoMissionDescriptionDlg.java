package com.brentdunklau.telepatriot_android;

import android.app.Activity;
import android.app.Dialog;
import android.support.annotation.NonNull;
import android.view.View;
import android.view.WindowManager;
import android.widget.EditText;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.User;
import com.brentdunklau.telepatriot_android.util.VideoNode;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.database.FirebaseDatabase;

// Note: We're making this class do double duty.  We use it to update both the video
// mission description field AND the Youtube video description.  Just depends on what
// 'attribute' we pass in to the constructor.  See VidyoChatFragment.editVideoMissionDescription()
// and VidyoChatFragment.editYoutubeVideoDescription()
public class EditVideoMissionDescriptionDlg extends Dialog {

//    private VideoNode currentVideoNode;
    String attribute, video_node_key;
    private EditText description;

    public EditVideoMissionDescriptionDlg(Activity activity, String video_node_key, String heading, String attribute, String initialValue) {
        super(activity);
        this.attribute = attribute;
        this.video_node_key = video_node_key;
        setContentView(R.layout.edit_video_mission_description_dlg);

        TextView description_header = (TextView) findViewById(R.id.description_header);
        description_header.setText(heading);

        description = (EditText) findViewById(R.id.video_mission_description);
        description.setText(initialValue);

//        if(v != null) {
//            currentVideoNode = v;
//            description = (EditText) findViewById(R.id.video_mission_description);
//            description.setText(currentVideoNode.getVideo_mission_description());
//        }

        TextView cancel = findViewById(R.id.cancel);
        cancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                dismiss();
            }
        });

        TextView save = findViewById(R.id.save);
        save.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                save();
                dismiss();
            }
        });
    }

    @Override
    public void show() {
        super.show();
        getWindow().setLayout(WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT);
    }

    private void save() {
        FirebaseDatabase.getInstance().getReference("video/list/"+video_node_key+"/"+attribute).setValue(description.getText()+"").addOnCompleteListener(new OnCompleteListener<Void>() {
            @Override
            public void onComplete(@NonNull Task<Void> task) {
                // don't really need this.  just included here as a reminder of how to do things once the update completes
            }
        });
    }
}
