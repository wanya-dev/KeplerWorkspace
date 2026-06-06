import {Alert, Platform} from 'react-native';
import type {PlatformServices, ISystemService, IMediaPlayer, IVoiceService} from '@workspace/shared';

// ─── Vega System Service Implementation ─────────────────────────────────────
// Vega (Kepler OS) runs a web-like runtime. System APIs may be available
// through Kepler-specific modules. For now, we use fallbacks where native
// modules are not yet bridged.

class VegaSystemService implements ISystemService {
  async getDeviceId(): Promise<string> {
    // Kepler devices expose device info through the platform
    try {
      const {NativeModules} = require('react-native');
      if (NativeModules.KeplerDeviceInfo) {
        return await NativeModules.KeplerDeviceInfo.getDeviceId();
      }
    } catch (e) {
      // Fallback
    }
    return 'vega-device-' + Date.now();
  }

  async getSystemVolume(): Promise<number> {
    // Vega may not expose system volume via NativeModules.
    // Return a simulated value for demo purposes.
    // TODO: Bridge to Kepler audio API when available.
    return 75;
  }

  showToast(message: string): void {
    // Vega doesn't have Android Toast. Use RN Alert as fallback.
    // In production, this would use Kepler's notification API.
    Alert.alert('', message);
  }

  notifyContentReady(contentId: string): void {
    // TODO: Integrate with Amazon Catalog API
    console.log('[VegaSystemService] notifyContentReady:', contentId);
  }
}

// ─── Stub implementations for demo ──────────────────────────────────────────

class VegaMediaPlayer implements IMediaPlayer {
  async play(url: string): Promise<void> {
    console.log('[VegaMediaPlayer] play:', url);
  }
  pause(): void {
    console.log('[VegaMediaPlayer] pause');
  }
  seek(positionMs: number): void {
    console.log('[VegaMediaPlayer] seek:', positionMs);
  }
  stop(): void {
    console.log('[VegaMediaPlayer] stop');
  }
  async getCurrentPosition(): Promise<number> {
    return 0;
  }
  async getDuration(): Promise<number> {
    return 0;
  }
}

class VegaVoiceService implements IVoiceService {
  async startListening(): Promise<void> {
    console.log('[VegaVoiceService] startListening');
  }
  stopListening(): void {
    console.log('[VegaVoiceService] stopListening');
  }
  onCommand(_handler: (cmd: string) => void): void {
    console.log('[VegaVoiceService] onCommand registered');
  }
}

// ─── Export assembled PAL ────────────────────────────────────────────────────

export const vegaPalServices: PlatformServices = {
  system: new VegaSystemService(),
  player: new VegaMediaPlayer(),
  voice: new VegaVoiceService(),
};
