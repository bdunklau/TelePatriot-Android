package com.brentdunklau.telepatriot_android.util;

import android.accounts.Account;
import android.content.Context;
import android.support.design.widget.NavigationView;
import android.support.v4.widget.DrawerLayout;
import android.support.v7.app.ActionBarDrawerToggle;
import android.util.AttributeSet;
import android.view.Gravity;
import android.view.Menu;
import android.view.MenuItem;
import android.view.SubMenu;

import com.brentdunklau.telepatriot_android.R;

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

        // hack / missed notification.  User fires an accountStatusEvent from this
        // block in User.login():  userRef.child("current_team")...
        // but that happens before we have added this class as a listener on that event
        MenuItem it = getMenu().findItem(R.id.nav_switch_teams);
        it.setTitle("Team: "+User.getInstance().getCurrentTeamName());
    }

    public MainNavigationView(Context ctx, AttributeSet attributeSet) {
        super(ctx, attributeSet);
        /**
         * If you wait till inflateMenu to listen for role added events, that will be
         * too late.  And the result will be: The slide out menu won't have ANY of the
         * core menu items: My Mission, Directors, and Admins
         */
        User.getInstance().addAccountStatusEventListener(this);

        // hack / missed notification.  User fires an accountStatusEvent from this
        // block in User.login():  userRef.child("current_team")...
        // but that happens before we have added this class as a listener on that event
        MenuItem it = getMenu().findItem(R.id.nav_switch_teams);
        it.setTitle("Team: "+User.getInstance().getCurrentTeamName());
    }

    @Override
    public void inflateMenu(int resId) {
        super.inflateMenu(resId);

        // start out by setting menu items to invisible for all roles.
        // Then, when the user logs in, we listen for role added events and
        // make menu items visible corresponding to the user's role(s)
        Map<String, Boolean> roles = new HashMap<String, Boolean>();
        roles.put("Volunteer", User.getInstance().isVolunteer());
        roles.put("Director", User.getInstance().isDirector());
        roles.put("Admin", User.getInstance().isAdmin());
        roles.put("Video Creator", User.getInstance().isVideoCreator());
        for(String role : roles.keySet()) {
            MenuItem item = findMenuItemForRole(role);
            if(item != null) {
                boolean bool = roles.get(role);
                item.setVisible(bool);
            }
        }

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
        else if(evt instanceof AccountStatusEvent.TeamSelected) { // also fires when the user logs in, so we always have a team to display to the user
            // find MenuItem you want to change
            MenuItem it = menu.findItem(R.id.nav_switch_teams);
            it.setTitle("Team: "+evt.getEvent());
        }

    }

    // See also MainActivity.onNavigationItemSelected()
    private MenuItem findMenuItemForRole(String role) {
        Map<String, String> rolesToMenuItems = new HashMap<String, String>();
        rolesToMenuItems.put("Volunteer", "My Mission");
        rolesToMenuItems.put("Director", "Directors");
        rolesToMenuItems.put("Admin", "Admins");
        rolesToMenuItems.put("Video Creator", "Video Chat");
        rolesToMenuItems.put("Video Creator", "Video Offers");
        String title = rolesToMenuItems.get(role);

        Menu menu = getMenu();
        int size = menu.size();
        for(int i = 0; i < size; i++) {
            MenuItem item = menu.getItem(i);
            if( item.getTitle().toString().equalsIgnoreCase(title) )
                return item;
            else if(item.getSubMenu() != null) {
                SubMenu subMenu = item.getSubMenu();
                int subsize = subMenu.size();
                for(int j=0; j < subsize; j++) {
                    MenuItem subitem = subMenu.getItem(j);
                    if(subitem.getTitle().toString().equalsIgnoreCase(title)) {
                        return subitem;
                    }
                }
            }
        }
        return null;
    }
}
