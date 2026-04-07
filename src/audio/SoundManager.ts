export class SoundManager {
  private enabled: boolean = true;
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    return this.audioCtx;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTilePlace(): void {
    if (!this.enabled) return;
    this.playTone(800, 0.05);
  }

  playTileDraw(): void {
    if (!this.enabled) return;
    this.playTone(400, 0.08);
  }

  playMarker(): void {
    if (!this.enabled) return;
    this.playTone(300, 0.1);
  }

  playRoundEnd(): void {
    if (!this.enabled) return;
    this.playTone(600, 0.15);
    setTimeout(() => this.playTone(800, 0.15), 150);
  }

  private playTone(freq: number, duration: number): void {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio not available
    }
  }
}
