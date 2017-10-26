package com.brentdunklau.telepatriot_android.util;

/**
 * Created by bdunklau on 10/24/17.
 */

public class MissionDetail {

    private String name, phone;

    public MissionDetail() {

    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name!=null ? name : "(no name)";
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone!=null ? phone : "(no phone)";
    }

}
