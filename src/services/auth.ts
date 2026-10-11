import { Capacitor } from '@capacitor/core';

export type Provider = 'google' | 'apple' | 'facebook' | 'guest';

export interface User {
  uid: string;
  name: string;
  provider: Provider;
  photoUrl: string | null;
}

type Listener = (u: User | null) => void;

/**
 * Sign-in goes through Firebase Authentication (@capacitor-firebase/authentication), which
 * handles the native Google / Apple / Facebook SDKs and anonymous (guest) accounts.
 *
 * Until Firebase is configured (GoogleService-Info.plist / google-services.json, see README),
 * FIREBASE_CONFIGURED stays false and sign-in is simulated locally so the app stays usable.
 */
export const FIREBASE_CONFIGURED = false;

const KEY = 'batak.user';
const live = FIREBASE_CONFIGURED && Capacitor.isNativePlatform();

let user: User | null = null;
const listeners = new Set<Listener>();

function set(u: User | null) {
  user = u;
  try {
    if (u) localStorage.setItem(KEY, JSON.stringify(u));
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(u));
}

async function plugin() {
  return (await import('@capacitor-firebase/authentication')).FirebaseAuthentication;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromFirebase(fu: any, provider: Provider, accessToken?: string): User {
  return {
    uid: fu.uid,
    name: fu.displayName || (provider === 'guest' ? guestName(fu.uid) : 'Oyuncu'),
    provider: fu.isAnonymous ? 'guest' : provider,
    photoUrl: profilePhoto(fu.photoUrl ?? null, provider, accessToken),
  };
}

/**
 * Firebase gives a tiny Facebook avatar (graph.facebook.com/<id>/picture). Ask the Graph API for a
 * larger one; Facebook requires the user's access token on that URL for apps created after 2020.
 */
function profilePhoto(url: string | null, provider: Provider, accessToken?: string): string | null {
  if (!url || provider !== 'facebook' || !url.includes('graph.facebook.com')) return url;
  const u = new URL(url);
  u.searchParams.set('height', '256');
  if (accessToken) u.searchParams.set('access_token', accessToken);
  return u.toString();
}

const guestName = (uid: string) => `Misafir${uid.replace(/\D/g, '').slice(0, 4).padEnd(4, '7')}`;

const DEMO_NAMES: Record<Provider, string> = {
  google: 'Google Oyuncusu',
  apple: 'Apple Oyuncusu',
  facebook: 'Facebook Oyuncusu',
  guest: '',
};

export const Auth = {
  get user() {
    return user;
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },

  async init(): Promise<User | null> {
    if (live) {
      const fa = await plugin();
      const { user: fu } = await fa.getCurrentUser();
      const saved = load();
      set(fu ? fromFirebase(fu, saved?.provider ?? 'guest') : null);
    } else {
      set(load());
    }
    return user;
  },

  async signIn(provider: Provider): Promise<User> {
    if (live) {
      const fa = await plugin();
      const res =
        provider === 'google'
          ? await fa.signInWithGoogle()
          : provider === 'apple'
            ? await fa.signInWithApple()
            : provider === 'facebook'
              ? await fa.signInWithFacebook()
              : await fa.signInAnonymously();
      if (!res.user) throw new Error('Giriş yapılamadı');
      set(fromFirebase(res.user, provider, res.credential?.accessToken));
      return user!;
    }
    const uid = `demo-${provider}-${Math.random().toString(36).slice(2, 10)}`;
    set({ uid, name: DEMO_NAMES[provider] || guestName(String(Date.now())), provider, photoUrl: null });
    return user!;
  },

  /** Upgrade a guest account to Google / Apple / Facebook while keeping the same uid. */
  async link(provider: Exclude<Provider, 'guest'>): Promise<User> {
    if (!user) throw new Error('Önce giriş yapın');
    if (live) {
      const fa = await plugin();
      const res =
        provider === 'google'
          ? await fa.linkWithGoogle()
          : provider === 'apple'
            ? await fa.linkWithApple()
            : await fa.linkWithFacebook();
      if (!res.user) throw new Error('Hesap bağlanamadı');
      set(fromFirebase(res.user, provider, res.credential?.accessToken));
      return user!;
    }
    set({ ...user, provider, name: user.provider === 'guest' ? DEMO_NAMES[provider] : user.name });
    return user!;
  },

  async signOut() {
    if (live) await (await plugin()).signOut();
    set(null);
  },

  /** Required by App Store guideline 5.1.1(v): users must be able to delete their account in-app. */
  async deleteAccount() {
    if (live) await (await plugin()).deleteUser();
    try {
      ['batak.stats', 'batak.prefs'].forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    set(null);
  },
};

function load(): User | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
