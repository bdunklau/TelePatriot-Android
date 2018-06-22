package com.brentdunklau.telepatriot_android;

import android.app.Activity;
import android.app.Dialog;
import android.view.View;
import android.view.WindowManager;
import android.widget.EditText;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.VideoNode;

public class EditVideoMissionDescriptionDlg extends Dialog {

    private VideoNode currentVideoNode;
    private EditText video_mission_description;

    public EditVideoMissionDescriptionDlg(Activity activity, VideoNode v) {
        super(activity);

        setContentView(R.layout.edit_video_mission_description_fragment);

        TextView description_header = (TextView) findViewById(R.id.description_header);

        if(v != null) {
            currentVideoNode = v;
            video_mission_description = (EditText) findViewById(R.id.video_mission_description);
            video_mission_description.setText(currentVideoNode.getVideo_mission_description());
        }

        TextView cancel = (TextView) findViewById(R.id.cancel);
        cancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                dismiss();
            }
        });

        TextView save = (TextView) findViewById(R.id.save);
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
        if(currentVideoNode == null) return;
        currentVideoNode.setVideo_mission_description(video_mission_description.getText().toString());
        currentVideoNode.save();
    }
}
