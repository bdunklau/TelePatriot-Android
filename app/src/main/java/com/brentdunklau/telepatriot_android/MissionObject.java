package com.brentdunklau.telepatriot_android;

public class MissionObject implements java.io.Serializable{

    public int missionKey;
    public String missionType;
    public String video_mission_description;

    public MissionObject(){
    }

    public MissionObject(int missionKey, String missionType, String video_mission_description) {
        this.missionKey = missionKey;
        this.missionType = missionType;
        this.video_mission_description = video_mission_description;
    }

    public int getMissionKey() {
        return missionKey;
    }

    public void setMissionKey(int missionKey) {
        this.missionKey = missionKey;
    }

    public String getMissionType() {
        return missionType;
    }

    public void setMissionType(String missionType) {
        this.missionType = missionType;
    }

    public String getVideo_mission_description() {
        return video_mission_description;
    }

    public void setVideo_mission_description(String video_mission_description) {
        this.video_mission_description = video_mission_description;
    }
}
