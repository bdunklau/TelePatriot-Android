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

/**
 * Created by bdunklau on 10/11/17.
 */

public class AdminFragment extends BaseFragment {

    protected UserBean user;
    Button button_unassigned_users, button_search_users;
    protected View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.admin_fragment, container, false);

        button_unassigned_users = myView.findViewById(R.id.button_unassigned_users);
        button_search_users = myView.findViewById(R.id.button_search_users);

        wireUp(button_unassigned_users, new UnassignedUsersFragment());
        wireUp(button_search_users, new SearchUsersFragment());

        //setHasOptionsMenu(true);
        return myView;
    }

    public void setUser(UserBean user) {
        this.user = user;
    }

    private void wireUp(Button button, final Fragment fragment) {
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                showFragment(fragment);
            }
        });
    }

//    private void showFragment(Fragment fragment) {
//        FragmentManager fragmentManager = getFragmentManager();
//        try {
//            FragmentTransaction t = fragmentManager.beginTransaction();
//            t.replace(R.id.content_frame, fragment);
//            t.addToBackStack(fragment.getClass().getName());
//            t.commit();
//        } catch(Throwable t) {
//            // TODO show alert dialog or  something - not this
//            t.printStackTrace();
//        }
//    }

    @Override
    public void onCreateOptionsMenu(Menu menu, MenuInflater inflater) {
        inflater.inflate(R.menu.admin_menu, menu);  // Use filter.xml from step 1
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        FragmentManager fragmentManager = getFragmentManager();
        switch(item.getItemId()) {
            case(R.id.list_unassigned_users):
                Fragment fragment = new UnassignedUsersFragment();
                fragmentManager.beginTransaction()
                        .replace(R.id.content_frame, fragment)
                        .addToBackStack(fragment.getClass().getName())
                        .commit();
                return true;
            case(R.id.list_users):
                fragment = new ListUsersFragment();
                fragmentManager.beginTransaction()
                        .replace(R.id.content_frame, fragment)
                        .addToBackStack(fragment.getClass().getName())
                        .commit();
                return true;
            case(R.id.search_users):
                fragment = new SearchUsersFragment();
                fragmentManager.beginTransaction()
                        .replace(R.id.content_frame, fragment)
                        .addToBackStack(fragment.getClass().getName())
                        .commit();
                return true;
            default: return super.onOptionsItemSelected(item);
        }
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
