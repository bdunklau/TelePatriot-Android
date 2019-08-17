package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.graphics.Paint;
import android.os.Bundle;
import android.os.Handler;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.util.UserBean;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 10/11/17.
 */

public class AdminFragment extends BaseFragment {

    TextView removed;
    TextView header_admin_screen;
    protected UserBean user;
    Button button_unassigned_users, button_search_users;
    protected View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.admin_fragment, container, false);

        showUI();
        hideLegacyUI();

        //setHasOptionsMenu(true);
        return myView;
    }

    private void hideLegacyUI() {

        header_admin_screen = myView.findViewById(R.id.header_admin_screen);
        button_unassigned_users = myView.findViewById(R.id.button_unassigned_users);
        button_search_users = myView.findViewById(R.id.button_search_users);
        header_admin_screen.setVisibility(View.GONE);
        button_unassigned_users.setVisibility(View.GONE);
        button_search_users.setVisibility(View.GONE);
    }

    private void showUI() {

        removed = myView.findViewById(R.id.removed);
        removed.setVisibility(View.VISIBLE);
    }

    public void setUser(UserBean user) {
        this.user = user;
    }

    protected void updateLabel(final int Rid, final String text) {
        updateLabel(Rid, text, false);
    }

    protected void updateLabel(final int Rid, final String text, final boolean underline) {
        Handler h = new Handler();
        h.post(new Runnable() {
            @Override
            public void run() {
                TextView t = (TextView)myView.findViewById(Rid);
                t.setText(text);
                if(underline) t.setPaintFlags(t.getPaintFlags() | Paint.UNDERLINE_TEXT_FLAG);
            }
        });
    }
}
