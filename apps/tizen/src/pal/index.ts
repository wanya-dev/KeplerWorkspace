import type {PlatformServices, ISystemService, IMediaPlayer, IVoiceService} from '@workspace/shared';

// ─── Tizen System Service Implementation ────────────────────────────────────
// Uses Tizen Web API when available, falls back to Web API for browser testing.

class TizenSystemService implements ISystemService {
  async getDeviceId(): Promise<string> {
    try {
      // Tizen Web Device API
      const webapis = (window as any).webapis;
      if (webapis?.productinfo) {
        return webapis.productinfo.getDuid();
      }
    } catch (e) {
      // Fallback
    }
    return 'tizen-' + Date.now();
  }

  async getSystemVolume(): Promise<number> {
    try {
      // Tizen TV Audio Control API
      const tizen = (window as any).tizen;
      if (tizen?.tvaudiocontrol) {
        return tizen.tvaudiocontrol.getVolume();
      }
    } catch (e) {
      // Fallback
    }
    return 50; // Default for browser testing
  }

  showToast(message: string): void {
    // Create a toast overlay element (no native Toast in web)
    const toast = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.85)',
      color: '#fff',
      padding: '16px 32px',
      borderRadius: '8px',
      fontSize: '24px',
      fontFamily: 'sans-serif',
      zIndex: '99999',
      transition: 'opacity 0.3s',
    });
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  notifyContentReady(contentId: string): void {
    console.log('[TizenSystemService] notifyContentReady:', contentId);
  }
}

// ─── Stub implementations ───────────────────────────────────────────────────

class TizenMediaPlayer implements IMediaPlayer {
  async play(url: string): Promise<void> {
    console.log('[TizenMediaPlayer] play:', url);
  }
  pause(): void {
    console.log('[TizenMediaPlayer] pause');
  }
  seek(positionMs: number): void {
    console.log('[TizenMediaPlayer] seek:', positionMs);
  }
  stop(): void {
    console.log('[TizenMediaPlayer] stop');
  }
  async getCurrentPosition(): Promise<number> {
    return 0;
  }
  async getDuration(): Promise<number> {
    return 0;
  }
}

class TizenVoiceService implements IVoiceService {
  async startListening(): Promise<void> {
    console.log('[TizenVoiceService] startListening');
  }
  stopListening(): void {
    console.log('[TizenVoiceService] stopListening');
  }
  onCommand(_handler: (cmd: string) => void): void {
    console.log('[TizenVoiceService] onCommand registered');
  }
}

// ─── Export assembled PAL ────────────────────────────────────────────────────

export const tizenPalServices: PlatformServices = {
  system: new TizenSystemService(),
  player: new TizenMediaPlayer(),
  voice: new TizenVoiceService(),
};
