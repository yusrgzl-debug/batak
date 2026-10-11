let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let enabled = true;

export const setSoundEnabled = (v: boolean) => {
  enabled = v;
};

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    if (!noise) {
      // one second of white noise, reused for every paper-like sound
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return ctx;
  } catch {
    return null;
  }
}

interface Burst {
  /** seconds from now */
  at?: number;
  dur: number;
  gain: number;
  filter: BiquadFilterType;
  freq: number;
  /** filter frequency at the end of the burst (sweeps) */
  freqTo?: number;
  q?: number;
  /** attack time in seconds */
  attack?: number;
}

/** A short filtered noise burst: the building block of card sounds. */
function burst(c: AudioContext, b: Burst) {
  const t = c.currentTime + (b.at ?? 0);
  const src = c.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.9 + Math.random() * 0.2;
  const f = c.createBiquadFilter();
  f.type = b.filter;
  f.frequency.setValueAtTime(b.freq, t);
  if (b.freqTo) f.frequency.exponentialRampToValueAtTime(b.freqTo, t + b.dur);
  f.Q.value = b.q ?? 1;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(b.gain, t + (b.attack ?? 0.004));
  g.gain.exponentialRampToValueAtTime(0.0001, t + b.dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t, Math.random() * 0.5, b.dur + 0.05);
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, at = 0) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur);
}

/** Card leaving the hand ("fişt") and landing flat on the felt ("pat"). */
function cardThrow(c: AudioContext, at = 0, loud = 1) {
  const v = 0.85 + Math.random() * 0.3;
  // flick: crisp paper edge sliding out of the fan
  burst(c, { at, dur: 0.045, gain: 0.35 * loud * v, filter: 'highpass', freq: 3200, q: 0.7, attack: 0.002 });
  // air: the card travelling
  burst(c, { at: at + 0.01, dur: 0.07, gain: 0.08 * loud, filter: 'bandpass', freq: 1800, freqTo: 900, q: 0.9 });
  // slap: card hitting the cloth, dull and short
  burst(c, { at: at + 0.075, dur: 0.06, gain: 0.55 * loud * v, filter: 'bandpass', freq: 650 + Math.random() * 150, q: 1.2, attack: 0.001 });
  burst(c, { at: at + 0.075, dur: 0.025, gain: 0.18 * loud, filter: 'highpass', freq: 2500, q: 0.7, attack: 0.001 });
}

export const sfx = {
  card: () => {
    const c = audio();
    if (c) cardThrow(c);
  },
  /** Cards being swept off the table to the trick winner. */
  trick: () => {
    const c = audio();
    if (!c) return;
    burst(c, { dur: 0.28, gain: 0.16, filter: 'bandpass', freq: 500, freqTo: 2600, q: 0.8, attack: 0.03 });
    burst(c, { at: 0.22, dur: 0.05, gain: 0.25, filter: 'bandpass', freq: 800, q: 1 });
  },
  /** A quick riffle of cards being dealt. */
  deal: () => {
    const c = audio();
    if (!c) return;
    for (let i = 0; i < 10; i++) cardThrow(c, i * 0.055, 0.45);
  },
  win: () => {
    tone(660, 0.18, 'sine', 0.08);
    tone(880, 0.25, 'sine', 0.08, 0.15);
  },
  fail: () => tone(180, 0.3, 'sawtooth', 0.04),
};
