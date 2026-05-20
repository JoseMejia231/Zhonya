// MONA - OS Integration
package com.mona.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

// MONA - OS Integration
public class SideKeyReceiver extends BroadcastReceiver {
    // MONA - OS Integration
    @Override
    public void onReceive(Context context, Intent intent) {
        Intent voice = new Intent(context, MONAVoiceActivator.class);
        voice.setAction(intent != null ? intent.getAction() : MONAIntentHandler.ACTION_ACTIVATE_VOICE);
        voice.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(voice);
        } catch (RuntimeException error) {
            context.startActivity(MONAIntentHandler.createLaunchIntent(context, MONAIntentHandler.MONACommand.open()));
        }
    }
}
