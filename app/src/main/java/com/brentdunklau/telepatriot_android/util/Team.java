package com.brentdunklau.telepatriot_android.util;

import android.support.annotation.NonNull;

/**
 * Created by bdunklau on 10/19/17.
 */

public class Team implements Comparable<Team>, TeamIF {
    String team_name;

    public Team() {

    }

    public Team(String team_name) {
        setTeam_name(team_name);
    }

    // per TeamIF
    public Integer getId() {
        return null;
    }

    public String getTeam_name() {
        return team_name;
    }

    public void setTeam_name(String team_name) {
        this.team_name = team_name;
    }

    @Override
    public int compareTo(@NonNull Team o) {
        if(o == null)
            return 0;
        if(!(o instanceof Team)) return 0;
        Team thatteam = (Team)o;
        return thatteam.getTeam_name().compareTo(getTeam_name());
    }

    public boolean equals(Object o) {
        if(o == null)
            return false;
        if(!(o instanceof Team)) return false;
        Team thatteam = (Team)o;
        return thatteam.getTeam_name().equals(getTeam_name());
    }
}
