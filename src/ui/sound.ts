let ctx: AudioContext | null = null;
let enabled = true;

export const setSoundEnabled = (v: boolean) => {
  enabled = v;
};

/** Short synthesized blips — no audio assets needed. */
function tone(freq: number, dur: number, type: OscillatorType, gain: number) {
  if (!enabled) return;
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch {
    /* audio unavailable */
  }
}

export const sfx = {
  card: () => tone(320, 0.08, 'triangle', 0.08),
  trick: () => tone(520, 0.15, 'sine', 0.06),
  win: () => {
    tone(660, 0.18, 'sine', 0.08);
    setTimeout(() => tone(880, 0.25, 'sine', 0.08), 150);
  },
  fail: () => tone(180, 0.3, 'sawtooth', 0.04),
};
