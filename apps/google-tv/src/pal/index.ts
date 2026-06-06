import {NativeModules} from 'react-native';
import type {PlatformServices, ISystemService, IMediaPlayer, IVoiceService} from '@workspace/shared';

const {SystemService} = NativeModules;

// ─── Android TV System Service Implementation ──────────────────────────────

class AndroidSystemService implements ISystemService {
  async getDeviceId(): Promise<string> {
    return SystemService.getDeviceId();
  }

  async getSystemVolume(): Promise<number> {
    return SystemService.getSystemVolume();
  }

  showToast(message: string): void {
    SystemService.showToast(message);
  }

  notifyContentReady(contentId: string): void {
    SystemService.notifyContentReady(contentId);
  }
}

// ─── Stub implementations for demo ─────────────────────────────────────────

class AndroidMediaPlayer implements IMediaPlayer {
  async play(url: string): Promise<void> {
    console.log('[AndroidMediaPlayer] play:', url);
  }
  pause(): void {
    console.log('[AndroidMediaPlayer] pause');
  }
  seek(positionMs: number): void {
    console.log('[AndroidMediaPlayer] seek:', positionMs);
  }
  stop(): void {
    console.log('[AndroidMediaPlayer] stop');
  }
  async getCurrentPosition(): Promise<number> {
    return 0;
  }
  async getDuration(): Promise<number> {
    return 0;
  }
}

class AndroidVoiceService implements IVoiceService {
  async startListening(): Promise<void> {
    console.log('[AndroidVoiceService] startListening');
  }
  stopListening(): void {
    console.log('[AndroidVoiceService] stopListening');
  }
  onCommand(_handler: (cmd: string) => void): void {
    console.log('[AndroidVoiceService] onCommand registered');
  }
}

// ─── Export assembled PAL ───────────────────────────────────────────────────

export const androidPalServices: PlatformServices = {
  system: new AndroidSystemService(),
  player: new AndroidMediaPlayer(),
  voice: new AndroidVoiceService(),
};
