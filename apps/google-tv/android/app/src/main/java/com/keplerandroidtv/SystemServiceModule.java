package com.keplerandroidtv;

import android.content.Context;
import android.media.AudioManager;
import android.app.Activity;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * Native module exposing Android system services to the JS PAL layer.
 * Implements the native side of ISystemService for Google TV.
 */
public class SystemServiceModule extends ReactContextBaseJavaModule {

    SystemServiceModule(ReactApplicationContext context) {
        super(context);
    }

    @NonNull
    @Override
    public String getName() {
        return "SystemService";
    }

    @ReactMethod
    public void getDeviceId(Promise promise) {
        try {
            String deviceId = android.provider.Settings.Secure.getString(
                    getReactApplicationContext().getContentResolver(),
                    android.provider.Settings.Secure.ANDROID_ID
            );
            promise.resolve(deviceId);
        } catch (Exception e) {
            promise.reject("DEVICE_ID_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getSystemVolume(Promise promise) {
        try {
            AudioManager audioManager = (AudioManager) getReactApplicationContext()
                    .getSystemService(Context.AUDIO_SERVICE);
            if (audioManager == null) {
                promise.resolve(0);
                return;
            }
            int currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
            int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            // Normalize to 0-100 range
            int volumePercent = maxVolume > 0 ? (currentVolume * 100) / maxVolume : 0;
            promise.resolve(volumePercent);
        } catch (Exception e) {
            promise.reject("VOLUME_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void showToast(String message) {
        Activity activity = getCurrentActivity();
        if (activity == null) {
            return;
        }
        activity.runOnUiThread(() -> {
            Toast.makeText(getReactApplicationContext(), message, Toast.LENGTH_SHORT).show();
        });
    }

    @ReactMethod
    public void notifyContentReady(String contentId) {
        // TODO: Integrate with Google TV Watch Next / Content Provider
        android.util.Log.d("SystemService", "Content ready: " + contentId);
    }
}
