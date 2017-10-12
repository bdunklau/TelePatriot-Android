package com.brentdunklau.telepatriot_android;

import android.app.Fragment;
import android.app.FragmentManager;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v7.widget.LinearLayoutManager;
import android.support.v7.widget.RecyclerView;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;

import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.ChatMessage;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.ChatMessageHolder;
import com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util.User;
import com.firebase.ui.database.FirebaseRecyclerAdapter;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

/**
 * Created by bdunklau on 10/11/17.
 */

public class ChatFragment extends Fragment {


    private FirebaseRecyclerAdapter<ChatMessage, ChatMessageHolder> mAdapter;
    private RecyclerView messages;
    private Button mSendButton;
    private EditText messageEditText;
    private LinearLayoutManager mLinearLayoutManager;
    private DatabaseReference myRef;
    private String chatKey;

    View myView;

    public ChatFragment() {
        /**
         * Whatever calls this constructor has to make sure that User.getInstance().isLoggedIn()
         */
        if(User.getInstance().isVolunteerOnly())
            chatKey = User.getInstance().getUid();
    }

    public void setTo(String toUid) {
        chatKey = toUid;
    }

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        myView = inflater.inflate(R.layout.activity_chat, container, false);
        setUI();
        return myView;
    }

    private void setUI() {

        // ref:  https://github.com/firebase/FirebaseUI-Android/blob/master/database/README.md
        messages = (RecyclerView) myView.findViewById(R.id.admin_chat_messages);
        messages.setLayoutManager(new LinearLayoutManager(myView.getContext()));
        messageEditText = myView.findViewById(R.id.messageEditText);


        mLinearLayoutManager = new LinearLayoutManager(myView.getContext());
        mLinearLayoutManager.setStackFromEnd(true);


        myRef = FirebaseDatabase.getInstance().getReference().child("chat/"+ chatKey);

        mSendButton = myView.findViewById(R.id.sendButton);

        mSendButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                ChatMessage chatMessage = new ChatMessage(messageEditText.getText().toString(), User.getInstance().getName());
                myRef.push().setValue(chatMessage);
                messageEditText.setText("");
            }
        });

        myRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                doit();
            }

            @Override
            public void onCancelled(DatabaseError databaseError) { }
        });
    }


    private void doit() {

        // see:  https://www.youtube.com/watch?v=ynKWnC0XiXk
        mAdapter = new FirebaseRecyclerAdapter<ChatMessage, ChatMessageHolder>(
                ChatMessage.class,
                R.layout.chat_item,  // see 0:42 of https://www.youtube.com/watch?v=A-_hKWMA7mk
                ChatMessageHolder.class,
                myRef) {
            @Override
            public void populateViewHolder(ChatMessageHolder holder, ChatMessage chatMessage, int position) {
                holder.setChatMessage(chatMessage);
            }

        };


        mAdapter.registerAdapterDataObserver(new RecyclerView.AdapterDataObserver() {
            @Override
            public void onItemRangeInserted(int positionStart, int itemCount) {
                super.onItemRangeInserted(positionStart, itemCount);
                int friendlyMessageCount = mAdapter.getItemCount();
                int lastVisiblePosition =
                        mLinearLayoutManager.findLastCompletelyVisibleItemPosition();
                // If the recycler view is initially being loaded or the
                // user is at the bottom of the list, scroll to the bottom
                // of the list to show the newly added message.
                if (lastVisiblePosition == -1 ||
                        (positionStart >= (friendlyMessageCount - 1) &&
                                lastVisiblePosition == (positionStart - 1))) {
                    messages.scrollToPosition(positionStart);
                }
            }
        });

        messages.setLayoutManager(mLinearLayoutManager);

        messages.setAdapter(mAdapter);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if(mAdapter != null) mAdapter.cleanup();
    }
}
