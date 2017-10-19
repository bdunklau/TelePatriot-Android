package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.widget.SearchView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.brentdunklau.telepatriot_android.util.User;

/**
 * Created by bdunklau on 10/19/2017.
 */

public class SearchUsersFragment extends Fragment {

    SearchView search_users;
    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.search_users_fragment, container, false);
        search_users = myView.findViewById(R.id.search_users);
        return myView;
    }
}
