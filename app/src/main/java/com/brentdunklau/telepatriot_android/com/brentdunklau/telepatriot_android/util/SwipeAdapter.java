package com.brentdunklau.telepatriot_android.com.brentdunklau.telepatriot_android.util;

import android.content.Context;
import android.content.Intent;
import android.support.v4.view.GestureDetectorCompat;
import android.view.GestureDetector;
import android.view.MotionEvent;
import android.widget.Toast;

/**
 * So that I only have to implement onFling()...
 *
 * Created by bdunklau on 10/3/2017.
 */

public class SwipeAdapter implements GestureDetector.OnGestureListener {


    // 7:00  https://www.youtube.com/watch?v=zsNpiOihNXU&index=21&list=PL6gx4Cwl9DGBsvRxJJOzG4r4k_zLKrnxl
    private GestureDetectorCompat gestureDetector;
    private Context ctx;
    private WhereYouAre whereYouAre;
    private SlideIt slideIt;


    public SwipeAdapter(Context ctx, WhereYouAre whereYouAre, SlideIt slideIt) {
        // 9:00  https://www.youtube.com/watch?v=zsNpiOihNXU&index=21&list=PL6gx4Cwl9DGBsvRxJJOzG4r4k_zLKrnxl
        this.gestureDetector = new GestureDetectorCompat(ctx, this);
        this.ctx = ctx;
        this.whereYouAre = whereYouAre;
        this.slideIt = slideIt;
    }

    @Override
    public boolean onDown(MotionEvent motionEvent) {
        return false;
    }

    @Override
    public void onShowPress(MotionEvent motionEvent) {

    }

    @Override
    public boolean onSingleTapUp(MotionEvent motionEvent) {
        return false;
    }

    @Override
    public boolean onScroll(MotionEvent motionEvent, MotionEvent motionEvent1, float v, float v1) {
        return false;
    }

    @Override
    public void onLongPress(MotionEvent motionEvent) {

    }

    @Override
    public boolean onFling(MotionEvent m1, MotionEvent m2, float v, float v1) {
        String direction = "not known";
        if(Swipe.isBottomToTop(m1, m2))
            direction = "bottom to top";
        else if(Swipe.isTopToBottom(m1, m2))
            direction = "top to bottom";
        else if(Swipe.isRightToLeft(m1, m2)) {
            Class activity = whereYouAre.onTheRight();
            if(activity != null) {
                Intent it = new Intent(ctx, activity);
                ctx.startActivity(it);
                slideIt.rightToLeft();
                direction = "right to left";
            }
        }
        else if(Swipe.isLeftToRight(m1, m2)) {
            Class activity = whereYouAre.onTheLeft();
            if(activity != null) {
                Intent it = new Intent(ctx, activity);
                ctx.startActivity(it);
                slideIt.leftToRight();
                direction = "left to right";
            }
        }
        Toast.makeText(ctx, direction, Toast.LENGTH_SHORT).show();
        return true;
    }

    public void onTouchEvent(MotionEvent event) {
        // 1:00  https://www.youtube.com/watch?v=VKbEfhf1qc&list=PL6gx4Cwl9DGBsvRxJJOzG4r4k_zLKrnxl&index=22
        this.gestureDetector.onTouchEvent(event);
    }
}
