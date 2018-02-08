package com.brentdunklau.telepatriot_android.util;

import android.support.v7.widget.RecyclerView;
import android.view.View;
import android.widget.TextView;

import com.brentdunklau.telepatriot_android.R;

/**
 * Created by bdunklau on 10/4/17.
 */

public class UserHolder extends RecyclerView.ViewHolder {

    // https://stackoverflow.com/a/41629505
    private UserHolder.ClickListener mClickListener;

    private TextView userField;
    private TextView emailField;
    private TextView dateField;
    private TextView has_signed_petition;
    private TextView has_signed_confidentiality_agreement;
    private TextView is_banned;

    public UserHolder(View itemView) {
        super(itemView);
        userField = itemView.findViewById(R.id.name);
        emailField = itemView.findViewById(R.id.email);
        dateField = itemView.findViewById(R.id.date);
        has_signed_petition = itemView.findViewById(R.id.has_signed_petition);
        has_signed_confidentiality_agreement = itemView.findViewById(R.id.has_signed_confidentiality_agreement);
        is_banned = itemView.findViewById(R.id.is_banned);

        // https://stackoverflow.com/a/41629505
        //listener set on ENTIRE ROW, you may set on individual components within a row.
        itemView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mClickListener.onItemClick(v, getAdapterPosition());
            }
        });
    }

    // https://stackoverflow.com/a/41629505
    //Interface to send callbacks...
    public interface ClickListener {
        public void onItemClick(View view, int position);
        public void onItemLongClick(View view, int position);
    }

    // https://stackoverflow.com/a/41629505
    public void setOnClickListener(UserHolder.ClickListener clickListener){
        mClickListener = clickListener;
    }

    public void setUser(UserBean user) {
        userField.setText(user.getName());
        emailField.setText(user.getEmail());
        dateField.setText("Joined: "+user.getCreated());

        if(user.getHas_signed_petition() == null) {
            has_signed_petition.setText("  Petition: unknown");
            has_signed_petition.setCompoundDrawablesWithIntrinsicBounds(R.drawable.warning, 0, 0, 0);
        }
        else if(user.getHas_signed_petition().booleanValue()) {
            has_signed_petition.setText("  Petition: Signed");
            has_signed_petition.setCompoundDrawablesWithIntrinsicBounds(R.drawable.check, 0, 0, 0);
        }
        else  {
            has_signed_petition.setText("  Petition: Not Signed");
            has_signed_petition.setCompoundDrawablesWithIntrinsicBounds(R.drawable.warning, 0, 0, 0);
        }


        /**
         * TODO This may need another look.  We are showing a warning when the conf agreement has
         * not been signed.  That's ok for new users who are being assigned to a training team.
         * But do we want to show the error icon when an admin is about to assign someone like this
         * to a real team?  Don't know.  Both icons get your attention.  The more important thing
         * is that the app prohibit people like this from being assigned to real teams.
         */
        if(user.getHas_signed_confidentiality_agreement() == null) {
            has_signed_confidentiality_agreement.setText("  Confidentiality Agreement: unknown");
            has_signed_confidentiality_agreement.setCompoundDrawablesWithIntrinsicBounds(R.drawable.warning, 0, 0, 0);
        }
        else if(user.getHas_signed_confidentiality_agreement().booleanValue()) {
            has_signed_confidentiality_agreement.setText("  Confidentiality Agreement: Signed");
            has_signed_confidentiality_agreement.setCompoundDrawablesWithIntrinsicBounds(R.drawable.check, 0, 0, 0);
        }
        else  {
            has_signed_confidentiality_agreement.setText("  Confidentiality Agreement: Not Signed");
            has_signed_confidentiality_agreement.setCompoundDrawablesWithIntrinsicBounds(R.drawable.error, 0, 0, 0);
        }


        if(user.getIs_banned() == null) {
            is_banned.setText("  Banned: unknown");
            is_banned.setCompoundDrawablesWithIntrinsicBounds(R.drawable.warning, 0, 0, 0);
        }
        else if(user.getIs_banned().booleanValue()) {
            is_banned.setText("  Banned: Yes");
            is_banned.setCompoundDrawablesWithIntrinsicBounds(R.drawable.error, 0, 0, 0);
        }
        else  {
            is_banned.setText("  Banned: No");
            is_banned.setCompoundDrawablesWithIntrinsicBounds(R.drawable.check, 0, 0, 0);
        }
    }

    public void setDate(String date) {
        dateField.setText(date);
    }

    public void setReviewedBy(String reviewedBy) {
        has_signed_petition.setText(reviewedBy);
    }
}