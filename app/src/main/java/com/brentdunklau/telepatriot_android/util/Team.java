package com.brentdunklau.telepatriot_android.util;

/**
 * Created by bdunklau on 10/19/17.
 */

public class Team {
    String team_name;

    public Team() {

    }

    public Team(String team_name) {
        setTeam_name(team_name);
    }

    public String getTeam_name() {
        return team_name;
    }

    public void setTeam_name(String team_name) {
        this.team_name = team_name;
    }
}
