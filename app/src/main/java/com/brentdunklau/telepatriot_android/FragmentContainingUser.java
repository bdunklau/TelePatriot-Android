package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;

import com.brentdunklau.telepatriot_android.util.UserBean;

// TODO don't need this - get rid of it
public interface FragmentContainingUser {
    public void userSelected(UserBean user);
    public void setFragmentManager(FragmentManager fragmentManager, Fragment fragment);
    public Fragment getFragment();
}
