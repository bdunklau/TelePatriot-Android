package com.brentdunklau.telepatriot_android.citizenbuilder;

import com.brentdunklau.telepatriot_android.util.TeamIF;

/**
 * Created by bdunklau on 11/21/18.
 */

public class CBTeam implements TeamIF {

    private Integer id;
    private String team_name;

    public CBTeam() {}
    public CBTeam(Integer id, String team_name) {
        this.id = id;
        this.team_name = team_name;
    }

    @Override
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    @Override
    public String getTeam_name() {
        return team_name;
    }

    public void setTeam_name(String team_name) {
        this.team_name = team_name;
    }
}
