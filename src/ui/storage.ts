/** Tiny localStorage wrapper that never throws (private mode, quota, etc.). */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export interface Prefs {
  sound: boolean;
  speed: 'slow' | 'normal' | 'fast';
  playerName: string;
}

export const DEFAULT_PREFS: Prefs = { sound: true, speed: 'normal', playerName: 'Sen' };

export interface Stats {
  played: number;
  won: number;
  bestScore: number;
}

export const DEFAULT_STATS: Stats = { played: 0, won: 0, bestScore: 0 };
