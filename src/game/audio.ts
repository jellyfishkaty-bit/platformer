import type { ThemeId } from './levels/types';

export type SfxKind =
  | 'jump'
  | 'land'
  | 'heart'
  | 'coin'
  | 'ability'
  | 'hurt'
  | 'checkpoint'
  | 'fireball'
  | 'stomp'
  | 'win'
  | 'lose'
  | 'click';

interface MusicTrack {
  notes: number[];
  noteMs: number;
  wave: OscillatorType;
  gain: number;
}

const MUSIC_TRACKS: Record<ThemeId, MusicTrack> = {
  test: { notes: [220, 261, 329, 261], noteMs: 400, wave: 'triangle', gain: 0.05 },
  darkSouls: { notes: [110, 130, 98, 116], noteMs: 620, wave: 'sine', gain: 0.06 },
  seriousSam: { notes: [330, 392, 440, 392, 494, 440, 392, 330], noteMs: 180, wave: 'square', gain: 0.035 },
  neverhood: { notes: [392, 466, 523, 466, 349, 415, 349, 293], noteMs: 260, wave: 'triangle', gain: 0.045 },
  halfLife: { notes: [87, 87, 98, 82, 87, 73], noteMs: 480, wave: 'sawtooth', gain: 0.035 },
  sekiro: { notes: [293, 349, 392, 349, 440, 392, 349, 293], noteMs: 300, wave: 'sine', gain: 0.05 },
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  musicOn = true;
  sfxOn = true;

  private musicInterval: number | null = null;
  private musicStep = 0;
  private currentTrack: MusicTrack | null = null;

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 1;
      this.musicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** Call on first user interaction so autoplay policies don't block us. */
  unlock() {
    this.ensureCtx();
  }

  setMusicOn(on: boolean) {
    this.musicOn = on;
    if (this.musicGain) this.musicGain.gain.value = on ? 1 : 0;
  }

  setSfxOn(on: boolean) {
    this.sfxOn = on;
  }

  private tone(
    ctx: AudioContext,
    dest: AudioNode,
    freq: number,
    startAt: number,
    durationSec: number,
    wave: OscillatorType,
    peakGain: number,
    glideTo?: number,
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, startAt);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), startAt + durationSec);
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(peakGain, startAt + Math.min(0.02, durationSec / 4));
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + durationSec);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(startAt);
    osc.stop(startAt + durationSec + 0.02);
  }

  playSfx(kind: SfxKind) {
    if (!this.sfxOn) return;
    const ctx = this.ensureCtx();
    const t = ctx.currentTime;
    const dest = ctx.destination;
    switch (kind) {
      case 'jump':
        this.tone(ctx, dest, 260, t, 0.14, 'square', 0.08, 560);
        break;
      case 'land':
        this.tone(ctx, dest, 140, t, 0.1, 'sine', 0.06, 60);
        break;
      case 'heart':
        this.tone(ctx, dest, 523, t, 0.1, 'triangle', 0.09);
        this.tone(ctx, dest, 784, t + 0.08, 0.14, 'triangle', 0.09);
        break;
      case 'coin':
        this.tone(ctx, dest, 880, t, 0.06, 'square', 0.06);
        this.tone(ctx, dest, 1318, t + 0.05, 0.1, 'square', 0.06);
        break;
      case 'ability':
        this.tone(ctx, dest, 220, t, 0.4, 'sawtooth', 0.05, 880);
        break;
      case 'hurt':
        this.tone(ctx, dest, 180, t, 0.18, 'sawtooth', 0.1, 60);
        break;
      case 'stomp':
        this.tone(ctx, dest, 300, t, 0.12, 'square', 0.08, 90);
        break;
      case 'checkpoint':
        this.tone(ctx, dest, 392, t, 0.1, 'triangle', 0.08);
        this.tone(ctx, dest, 523, t + 0.1, 0.1, 'triangle', 0.08);
        this.tone(ctx, dest, 659, t + 0.2, 0.18, 'triangle', 0.08);
        break;
      case 'fireball':
        this.tone(ctx, dest, 500, t, 0.16, 'sawtooth', 0.06, 150);
        break;
      case 'win':
        [523, 659, 784, 1046].forEach((f, i) => this.tone(ctx, dest, f, t + i * 0.12, 0.22, 'triangle', 0.09));
        break;
      case 'lose':
        [392, 349, 293, 220].forEach((f, i) => this.tone(ctx, dest, f, t + i * 0.16, 0.3, 'sawtooth', 0.08));
        break;
      case 'click':
        this.tone(ctx, dest, 440, t, 0.05, 'square', 0.05);
        break;
    }
  }

  startMusic(theme: ThemeId) {
    const ctx = this.ensureCtx();
    const track = MUSIC_TRACKS[theme];
    if (this.currentTrack === track) return;
    this.stopMusic();
    this.currentTrack = track;
    this.musicStep = 0;
    const dest = this.musicGain!;
    const play = () => {
      if (!this.currentTrack) return;
      const freq = track.notes[this.musicStep % track.notes.length];
      this.musicStep++;
      this.tone(ctx, dest, freq, ctx.currentTime, (track.noteMs / 1000) * 0.9, track.wave, track.gain);
    };
    play();
    this.musicInterval = window.setInterval(play, track.noteMs);
  }

  stopMusic() {
    if (this.musicInterval !== null) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentTrack = null;
  }
}

export const audio = new AudioEngine();
