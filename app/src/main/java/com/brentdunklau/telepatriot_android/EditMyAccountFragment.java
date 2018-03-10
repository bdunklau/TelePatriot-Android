package com.brentdunklau.telepatriot_android;

import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;

import com.brentdunklau.telepatriot_android.util.User;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;

import java.util.regex.Pattern;

/**
 * Created by bdunklau on 3/5/18.
 */

public class EditMyAccountFragment  extends BaseFragment {

    private static final String REQUIRED_MSG = "required";
    private static final String EMAIL_REGEX = "^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$";
    EditText edit_my_name;
    EditText edit_my_email;
    EditText edit_my_photo_url;
    Button button_save_my_account;
    OnCompleteListener<Void> listener;
    View myView;

    @Nullable
    @Override
    // called by MissionListFragment
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.edit_my_account_fragment, container, false);

        edit_my_name = myView.findViewById(R.id.edit_my_name);
        edit_my_email = myView.findViewById(R.id.edit_my_email);
        edit_my_photo_url = myView.findViewById(R.id.edit_my_photo_url);
        button_save_my_account = myView.findViewById(R.id.button_save_my_account);

        edit_my_name.setText(User.getInstance().getName());
        if(User.getInstance().isEmailMissing()) {
            edit_my_email.setText("");
        }
        else {
            edit_my_email.setText(User.getInstance().getEmail());
        }
        edit_my_photo_url.setText(User.getInstance().getPhotoURL());

        button_save_my_account.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if(!isEmailAddress(edit_my_email, true))
                    return;

                User.getInstance().update(edit_my_name.getText()+"",
                                        edit_my_email.getText()+"",
                                        edit_my_photo_url.getText()+"",
                                        getOnCompleteListener());
            }
        });

        //setHasOptionsMenu(true);
        return myView;
    }

    // this is the callback object that gets called once the Firebase user has been updated
    private OnCompleteListener<Void> getOnCompleteListener() {
        return listener;
    }

    public void setOnCompleteListener(OnCompleteListener<Void> listener) {
        this.listener = listener;
    }

    // call this method when you need to check email validation
    public static boolean isEmailAddress(EditText editText, boolean required) {
        return isValid(editText, EMAIL_REGEX, "invalid email", required);
    }

    // return true if the input field is valid, based on the parameter passed
    public static boolean isValid(EditText editText, String regex, String errMsg, boolean required) {

        String text = editText.getText().toString().trim();
        // clearing the error, if it was previously set by some other values
        editText.setError(null);

        // text required and editText is blank, so return false
        if ( required && !hasText(editText) )
            return false;

        // pattern doesn't match so returning false
        if (required && !Pattern.matches(regex, text)) {
            editText.setError(errMsg);
            return false;
        };

        return true;
    }

    // check the input field has any text or not
    // return true if it contains text otherwise false
    public static boolean hasText(EditText editText) {

        String text = editText.getText().toString().trim();
        editText.setError(null);

        // length 0 means there is no text
        if (text.length() == 0) {
            editText.setError(REQUIRED_MSG);
            return false;
        }

        return true;
    }
}
