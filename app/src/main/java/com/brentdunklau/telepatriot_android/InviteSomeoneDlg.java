package com.brentdunklau.telepatriot_android;

import android.app.Dialog;
import android.content.Context;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;

import com.brentdunklau.telepatriot_android.util.VideoNode;

/**
 * Created by bdunklau on 10/6/19.
 *
 * Modeled after SearchUsersDlg
 */

public class InviteSomeoneDlg extends Dialog {


    private Button button_invite_by_name;
    private Button button_invite_by_text_message;


    public InviteSomeoneDlg(final Context activity, final VideoNode currentVideoNode) {
        super(activity);

        setContentView(R.layout.invite_someone_dlg);

        button_invite_by_name = findViewById(R.id.button_invite_by_name);
        button_invite_by_text_message = findViewById(R.id.button_invite_by_text_message);

        button_invite_by_name.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                WindowManager.LayoutParams lp = new WindowManager.LayoutParams();
                SearchUsersDlg dialog = new SearchUsersDlg(activity, currentVideoNode);
//              InviteSomeoneDlg dialog = new InviteSomeoneDlg(getActivity(), currentVideoNode);
                lp.copyFrom(dialog.getWindow().getAttributes());
                lp.width = WindowManager.LayoutParams.MATCH_PARENT;
                lp.height = WindowManager.LayoutParams.MATCH_PARENT;
                dialog.show();
                dialog.getWindow().setAttributes(lp);
                InviteSomeoneDlg.this.dismiss();
            }
        });

        button_invite_by_text_message.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                WindowManager.LayoutParams lp = new WindowManager.LayoutParams();
                InviteByTextMessage dialog = new InviteByTextMessage(activity, currentVideoNode);
                lp.copyFrom(dialog.getWindow().getAttributes());
                lp.width = WindowManager.LayoutParams.MATCH_PARENT;
                lp.height = WindowManager.LayoutParams.MATCH_PARENT;
                dialog.show();
                dialog.getWindow().setAttributes(lp);
                InviteSomeoneDlg.this.dismiss();
            }
        });
    }
}
