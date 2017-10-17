package com.brentdunklau.telepatriot_android.util;

import android.view.MotionEvent;

/**
 * Created by bdunklau on 10/3/2017.
 */

public class Swipe {

    public static boolean isRightToLeft(MotionEvent m1, MotionEvent m2) {
        if(isHorizontalSwipe(m1, m2)) {
            return m1.getX() - m2.getX() > 0;
        }
        return false;



/*
        float xdiff = Math.abs(m1.getX() - m2.getX());
        float ydiff = Math.abs(m1.getY() - m2.getY());
        if(xdiff > ydiff) {
            String direction = m1.getX() - m2.getX() > 0 ? "swipe right to left" : "swipe left to right";
        } else {
            String direction = m1.getY() - m2.getY() > 0 ? "swipe bottom to top" : "swipe top to bottom";
        }
        return true;*/
    }

    public static boolean isLeftToRight(MotionEvent m1, MotionEvent m2) {
        if (isHorizontalSwipe(m1, m2)) {
            return m1.getX() - m2.getX() < 0;
        }
        return false;
    }

    public static boolean isTopToBottom(MotionEvent m1, MotionEvent m2) {
        if(isVerticalSwipe(m1, m2)) {
            return m1.getY() - m2.getY() < 0;
        }
        return false;
    }

    public static boolean isBottomToTop(MotionEvent m1, MotionEvent m2) {
        if(isVerticalSwipe(m1, m2)) {
            return m1.getY() - m2.getY() > 0;
        }
        return false;
    }

    private static boolean isHorizontalSwipe(MotionEvent m1, MotionEvent m2) {
        float xdiff = Math.abs(m1.getX() - m2.getX());
        float ydiff = Math.abs(m1.getY() - m2.getY());
        return xdiff > ydiff;
    }

    private static boolean isVerticalSwipe(MotionEvent m1, MotionEvent m2) {
        return !isHorizontalSwipe(m1, m2);
    }
}
