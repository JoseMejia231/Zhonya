// MONA - OS Integration
package com.mona.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

// MONA - OS Integration
public class MainActivity extends Activity {
    private WebView webView;

    // MONA - OS Integration
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        webView.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        configureWebView(webView);
        setContentView(webView);
        loadIntent(getIntent());
    }

    // MONA - OS Integration
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        loadIntent(intent);
    }

    // MONA - OS Integration
    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    // MONA - OS Integration
    private void configureWebView(WebView target) {
        target.setWebViewClient(new WebViewClient());
        WebSettings settings = target.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
    }

    // MONA - OS Integration
    private void loadIntent(Intent intent) {
        MONAIntentHandler.MONACommand command = MONAIntentHandler.fromIntent(intent);
        webView.loadUrl(MONAIntentHandler.toWebUrl(BuildConfig.MONA_WEB_URL, command));
    }
}
