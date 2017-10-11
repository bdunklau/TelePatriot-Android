package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;

/**
 * Created by bdunklau on 10/11/17.
 */

public class AdminFragment extends Fragment {

    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.activity_admin, container, false);

        setHasOptionsMenu(true);
        return myView;
    }

    @Override
    public void onCreateOptionsMenu(Menu menu, MenuInflater inflater) {
        inflater.inflate(R.menu.admin_menu, menu);  // Use filter.xml from step 1
    }
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        FragmentManager fragmentManager = getFragmentManager();
        switch(item.getItemId()) {
            case(R.id.list_unassigned_users):
                fragmentManager.beginTransaction().replace(R.id.content_frame, new UnassignedUsersFragment()).commit();
                return true;
            case(R.id.list_users):
                try {
                    fragmentManager.beginTransaction()
                            .replace(R.id.content_frame, new ListUsersFragment())
                            .commit();
                    System.currentTimeMillis();
                } catch(Throwable t) {
                    System.currentTimeMillis();
                }
                return true;
            default: return super.onOptionsItemSelected(item);
        }
    }
}
