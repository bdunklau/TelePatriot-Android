package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.app.FragmentTransaction;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

/**
 * Created by bdunklau on 12/8/2017.
 */

public class ChooseSpreadsheetTypeFragment extends DirectorFragment {

    TextView choose_spreadsheet_type_header, explanatory_text_view;
    Button button_contains_names_and_numbers, button_links_to_other_spreadsheets;

    View myView;

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.choose_spreadsheet_type_fragment, container, false);

        // show two buttons, asking the user to choose what kind of spreadsheet to import
        //      Does it contain names and numbers?
        //      or does it point to other spreadsheets that contain names and numbers?
        //
        // So we need some explanatory text at the top
        // and then the two buttons

        choose_spreadsheet_type_header = myView.findViewById(R.id.choose_spreadsheet_type_header);
        choose_spreadsheet_type_header.setText("Choose Spreadsheet Type");

        explanatory_text_view = myView.findViewById(R.id.explanatory_text_view);
        explanatory_text_view.setText("Does your spreadsheet contains names and phone numbers? \n\nOr does your spreadsheet link to *other* spreadsheets that contain names and phone numbers?");

        button_contains_names_and_numbers = myView.findViewById(R.id.button_contains_names_and_numbers);
        button_links_to_other_spreadsheets = myView.findViewById(R.id.button_links_to_other_spreadsheets);

        Bundle b1 = new Bundle();
        b1.putString("spreadsheetType", "contains names and numbers");
        NewPhoneCampaignFragment n1 = new NewPhoneCampaignFragment();
        n1.setArguments(b1);
        Bundle b2 = new Bundle();
        b2.putString("spreadsheetType", "links to other spreadsheets");
        NewPhoneCampaignFragment n2 = new NewPhoneCampaignFragment();
        n2.setArguments(b2);

        wireUp(button_contains_names_and_numbers, n1);
        wireUp(button_links_to_other_spreadsheets, n2);


        setHasOptionsMenu(true);
        return myView;
    }


    private void wireUp(Button button, final Fragment fragment) {
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                showFragment(fragment);
            }
        });
    }

    private void showFragment(Fragment fragment) {
        FragmentManager fragmentManager = getFragmentManager();
        try {
            FragmentTransaction t = fragmentManager.beginTransaction();
            t.replace(R.id.content_frame, fragment);
            t.addToBackStack(fragment.getClass().getName());
            t.commit();
        } catch(Throwable t) {
            // TODO show alert dialog or  something - not this
            t.printStackTrace();
        }
    }

}
