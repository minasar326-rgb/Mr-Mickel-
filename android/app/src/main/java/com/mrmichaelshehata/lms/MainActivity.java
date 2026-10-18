package com.mrmichaelshehata.lms;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 🔒 Hardware-Enforced Anti-Screenshot & Anti-Screen Recording Protection (FLAG_SECURE)
        // Strictly prevents screenshots, screen recording, HDMI capture, and hides preview in recent apps.
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
    }

    @Override
    public void onBackPressed() {
        if (getBridge() != null && getBridge().getWebView() != null && getBridge().getWebView().canGoBack()) {
            getBridge().getWebView().goBack();
        } else {
            super.onBackPressed();
        }
    }
}
