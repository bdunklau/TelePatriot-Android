package com.brentdunklau.telepatriot_android.util;

import java.util.Map;

/**
 * Created by bdunklau on 11/29/18.
 */

public interface MissionCompletedListener {
    public void missionCompleted(String citizen_builder_domain,
                                 String citizen_builder_api_key_name,
                                 String citizen_builder_api_key_value,
                                 boolean getAnother);
}
