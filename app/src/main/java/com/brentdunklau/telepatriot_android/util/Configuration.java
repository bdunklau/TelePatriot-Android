package com.brentdunklau.telepatriot_android.util;

import android.os.Parcel;
import android.os.Parcelable;

import java.util.Map;

/**
 * Created by bdunklau on 11/21/18.
 */

// Bean class for the administration/configuration node
public class Configuration {

    Map<String,String> cb_production_environment;
    Map<String,String> cb_qa_environment;
    String environment;
    String get_missions_from;
    String get_roles_from;
    String get_teams_from;
    String on_user_create;
    String on_user_login;
    Boolean simulate_banned;
    Boolean simulate_missing_email;
    Boolean simulate_missing_name;
    Boolean simulate_no_confidentiality_agreement;
    Boolean simulate_no_petition;
    Boolean simulate_passing_legal;

    public boolean getTeamsFromCB() {
        return get_teams_from == null || get_teams_from.equalsIgnoreCase("citizenbuilder");
    }

    public boolean getMissionsFromCB() {
        return get_missions_from == null || get_missions_from.equalsIgnoreCase("citizenbuilder");
    }

    private Map<String, String> getEnv() {
        Map<String, String> env = cb_production_environment;
        if(environment != null && environment.equalsIgnoreCase("cb_qa_environment"))
            env = cb_qa_environment;
        return env;
    }

    public String getCitizenBuilderDomain() {
        return getEnv().get("citizen_builder_domain");
    }

    public String getCitizenBuilderApiKeyName() {
        return getEnv().get("citizen_builder_api_key_name");
    }

    public String getCitizenBuilderApiKeyValue() {
        return getEnv().get("citizen_builder_api_key_value");
    }

    public Map<String, String> getCb_production_environment() {
        return cb_production_environment;
    }

    public void setCb_production_environment(Map<String, String> cb_production_environment) {
        this.cb_production_environment = cb_production_environment;
    }

    public Map<String, String> getCb_qa_environment() {
        return cb_qa_environment;
    }

    public void setCb_qa_environment(Map<String, String> cb_qa_environment) {
        this.cb_qa_environment = cb_qa_environment;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public String getGet_missions_from() {
        return get_missions_from;
    }

    public void setGet_missions_from(String get_missions_from) {
        this.get_missions_from = get_missions_from;
    }

    public String getGet_roles_from() {
        return get_roles_from;
    }

    public void setGet_roles_from(String get_roles_from) {
        this.get_roles_from = get_roles_from;
    }

    public String getGet_teams_from() {
        return get_teams_from;
    }

    public void setGet_teams_from(String get_teams_from) {
        this.get_teams_from = get_teams_from;
    }

    public String getOn_user_create() {
        return on_user_create;
    }

    public void setOn_user_create(String on_user_create) {
        this.on_user_create = on_user_create;
    }

    public String getOn_user_login() {
        return on_user_login;
    }

    public void setOn_user_login(String on_user_login) {
        this.on_user_login = on_user_login;
    }

    public Boolean getSimulate_banned() {
        return simulate_banned;
    }

    public void setSimulate_banned(Boolean simulate_banned) {
        this.simulate_banned = simulate_banned;
    }

    public Boolean getSimulate_missing_email() {
        return simulate_missing_email;
    }

    public void setSimulate_missing_email(Boolean simulate_missing_email) {
        this.simulate_missing_email = simulate_missing_email;
    }

    public Boolean getSimulate_missing_name() {
        return simulate_missing_name;
    }

    public void setSimulate_missing_name(Boolean simulate_missing_name) {
        this.simulate_missing_name = simulate_missing_name;
    }

    public Boolean getSimulate_no_confidentiality_agreement() {
        return simulate_no_confidentiality_agreement;
    }

    public void setSimulate_no_confidentiality_agreement(Boolean simulate_no_confidentiality_agreement) {
        this.simulate_no_confidentiality_agreement = simulate_no_confidentiality_agreement;
    }

    public Boolean getSimulate_no_petition() {
        return simulate_no_petition;
    }

    public void setSimulate_no_petition(Boolean simulate_no_petition) {
        this.simulate_no_petition = simulate_no_petition;
    }

    public Boolean getSimulate_passing_legal() {
        return simulate_passing_legal;
    }

    public void setSimulate_passing_legal(Boolean simulate_passing_legal) {
        this.simulate_passing_legal = simulate_passing_legal;
    }
}
