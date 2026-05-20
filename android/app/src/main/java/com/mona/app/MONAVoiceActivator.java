// MONA - OS Integration
package com.mona.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.RecognizerIntent;

import java.util.ArrayList;
// MONA - OS Integration
public class MONAVoiceActivator extends Activity {
    private static final int REQUEST_SPEECH = 4201;
    private static final int REQUEST_AUDIO = 4202;
    private static final String MONA_LOCALE = "es-DO";

    // MONA - OS Integration
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        startVoiceRecognition();
    }

    // MONA - OS Integration
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_AUDIO && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            launchSpeechRecognizer();
            return;
        }
        openMONA();
    }

    // MONA - OS Integration
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_SPEECH && resultCode == RESULT_OK && data != null) {
            ArrayList<String> results = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (results != null && !results.isEmpty()) {
                MONAIntentHandler.MONACommand command = MONAIntentHandler.fromVoiceText(results.get(0));
                startActivity(MONAIntentHandler.createLaunchIntent(this, command));
                finish();
                return;
            }
        }
        openMONA();
    }

    // MONA - OS Integration
    private void startVoiceRecognition() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M
            && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[] { Manifest.permission.RECORD_AUDIO }, REQUEST_AUDIO);
            return;
        }
        launchSpeechRecognizer();
    }

    // MONA - OS Integration
    private void launchSpeechRecognizer() {
        Intent speech = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        speech.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        speech.putExtra(RecognizerIntent.EXTRA_LANGUAGE, MONA_LOCALE);
        speech.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, MONA_LOCALE);
        speech.putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, false);
        speech.putExtra(RecognizerIntent.EXTRA_PROMPT, "MONA");
        speech.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        try {
            startActivityForResult(speech, REQUEST_SPEECH);
        } catch (ActivityNotFoundException error) {
            openMONA();
        }
    }

    // MONA - OS Integration
    private void openMONA() {
        startActivity(MONAIntentHandler.createLaunchIntent(this, MONAIntentHandler.MONACommand.open()));
        finish();
    }
}
