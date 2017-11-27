package com.brentdunklau.telepatriot_android.util;

import android.content.Context;
import android.support.design.widget.NavigationView;
import android.util.AttributeSet;
import android.view.Menu;
import android.view.MenuItem;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by bdunklau on 11/18/17.
 */

public class MainNavigationView extends NavigationView implements AccountStatusEvent.Listener {

    //Map<String, MenuItem> items = new HashMap<String, MenuItem>();

    public MainNavigationView(Context ctx) {
        super(ctx);
        /**
         * If you wait till inflateMenu to listen for role added events, that will be
         * too late.  And the result will be: The slide out menu won't have ANY of the
         * core menu items: My Mission, Directors, and Admins
         */
        User.getInstance().addAccountStatusEventListener(this);
    }

    public MainNavigationView(Context ctx, AttributeSet attributeSet) {
        super(ctx, attributeSet);
        /**
         * If you wait till inflateMenu to listen for role added events, that will be
         * too late.  And the result will be: The slide out menu won't have ANY of the
         * core menu items: My Mission, Directors, and Admins
         */
        User.getInstance().addAccountStatusEventListener(this);
    }

    @Override
    public void inflateMenu(int resId) {
        super.inflateMenu(resId);

        // start out by setting menu items to invisible for all roles.
        // Then, when the user logs in, we listen for role added events and
        // make menu items visible corresponding to the user's role(s)
        List<String> roles = Arrays.asList("Volunteer", "Director", "Admin");
        for(String role : roles) {
            MenuItem item = findMenuItemForRole(role);
            if(item != null)
                item.setVisible(false);
        }

        //User.getInstance().addAccountStatusEventListener(this); // this is too late.  The user has already logged in
        // and roles have already been discovered

        /*********
        Menu menu = getMenu();
        int size = menu.size();
        for(int i = 0; i < size; i++) {
            MenuItem item = menu.getItem(i);
            String title = item.getTitle().toString();
            items.put(title, item);
        }
         ************/

    }

    @Override
    public void fired(AccountStatusEvent evt) {

        // this is where we add/remove menu items based on the role that's
        // been added or removed
        Menu menu = getMenu();
        int size = menu.size();
        if(evt instanceof AccountStatusEvent.RoleAdded) {
            String role = evt.getEvent();
            MenuItem item = findMenuItemForRole(role);
            if(item != null)
                item.setVisible(true);
        }
        else if(evt instanceof AccountStatusEvent.RoleRemoved) {
            String role = evt.getEvent();
            MenuItem item = findMenuItemForRole(role);
            if(item != null)
                item.setVisible(false);
        }
    }

    private MenuItem findMenuItemForRole(String role) {
        Map<String, String> rolesToMenuItems = new HashMap<String, String>();
        rolesToMenuItems.put("Volunteer", "My Mission");
        rolesToMenuItems.put("Director", "Directors");
        rolesToMenuItems.put("Admin", "Admins");
        String title = rolesToMenuItems.get(role);

        Menu menu = getMenu();
        int size = menu.size();
        for(int i = 0; i < size; i++) {
            MenuItem item = menu.getItem(i);
            if( item.getTitle().toString().equalsIgnoreCase(title) )
                return item;
        }
        return null;
    }
}
