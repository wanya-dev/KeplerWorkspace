/**
 * Platform Abstraction Layer (PAL) — Interface Definitions
 *
 * All platform-specific capabilities are defined here as TypeScript interfaces.
 * The shared business logic and UI depend ONLY on these interfaces, never on
 * concrete implementations. Each app (Vega, Google TV) provides its own
 * implementation via PalProvider.
 */

// ─── System Service ─────────────────────────────────────────────────────────

export interface ISystemService {
  /** Returns a unique device identifier. */
  getDeviceId(): Promise<string>;

  /** Returns the current system volume (0-100). */
  getSystemVolume(): Promise<number>;

  /** Shows a short toast/notification message on screen. */
  showToast(message: string): void;

  /** Notifies the platform that content is ready for indexing. */
  notifyContentReady(contentId: string): void;
}

// ─── Media Player ───────────────────────────────────────────────────────────

export interface DRMConfig {
  type: 'widevine' | 'playready' | 'fairplay';
  licenseUrl: string;
  headers?: Record<string, string>;
}

export interface IMediaPlayer {
  play(url: string, drmConfig?: DRMConfig): Promise<void>;
  pause(): void;
  seek(positionMs: number): void;
  stop(): void;
  getCurrentPosition(): Promise<number>;
  getDuration(): Promise<number>;
}

// ─── Voice Service ──────────────────────────────────────────────────────────

export interface IVoiceService {
  startListening(): Promise<void>;
  stopListening(): void;
  onCommand(handler: (cmd: string) => void): void;
}

// ─── PAL Container ─────────────────────────────────────────────────────────

/**
 * Injection container for all platform services.
 * Each app creates an instance of this and provides it via PalProvider.
 */
export interface PlatformServices {
  system: ISystemService;
  player: IMediaPlayer;
  voice: IVoiceService;
}
