import { motion } from 'framer-motion';
import { useState } from 'react';
import { Auth, FIREBASE_CONFIGURED, Provider } from '../../services/auth';
import appIcon from '../../assets/app-icon.png';

export const ProviderIcon = ({ p }: { p: Provider }) => {
  if (p === 'google')
    return (
      <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
    );
  if (p === 'apple')
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
        <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76-1.47.02-2.83.86-3.59 2.18-1.53 2.66-.39 6.6 1.1 8.75.73 1.05 1.6 2.24 2.73 2.2 1.1-.05 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13.84-1.22 1.18-2.4 1.2-2.46-.03-.01-2.3-.88-2.32-3.5zM14.2 6.13c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.64-1.05 1.67-.92 2.66.97.07 1.96-.49 2.56-1.21z" />
      </svg>
    );
  if (p === 'facebook')
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
      </svg>
    );
  return <span aria-hidden>👤</span>;
};

const BUTTONS: { p: Provider; label: string }[] = [
  { p: 'apple', label: 'Apple ile devam et' },
  { p: 'google', label: 'Google ile devam et' },
  { p: 'facebook', label: 'Facebook ile devam et' },
  { p: 'guest', label: 'Misafir olarak oyna' },
];

export function LoginScreen() {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const go = async (p: Provider) => {
    setBusy(p);
    setError(null);
    try {
      await Auth.signIn(p);
    } catch (e) {
      setError((e as Error).message || 'Giriş yapılamadı');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="login">
      <div className="logo-wrap">
        <motion.img
          className="login-icon"
          src={appIcon}
          alt=""
          initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        />
        <h1 className="logo">BATAK</h1>
        <div className="logo-sub">Klasik Türk Kart Oyunu</div>
      </div>

      <div className="login-buttons">
        {BUTTONS.map(({ p, label }, i) => (
          <motion.button
            key={p}
            className={`login-btn login-btn--${p}`}
            disabled={busy !== null}
            onClick={() => go(p)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.07 }}
            whileTap={{ scale: 0.97 }}
          >
            <ProviderIcon p={p} />
            <span>{busy === p ? 'Bağlanıyor…' : label}</span>
          </motion.button>
        ))}
      </div>

      {error && <div className="toast">{error}</div>}
      {!FIREBASE_CONFIGURED && <p className="muted small">Demo modu: giriş bu cihazda simüle edilir.</p>}
      <p className="legal">
        Devam ederek Kullanım Koşulları’nı ve Gizlilik Politikası’nı kabul etmiş olursun. Misafir hesabını daha sonra
        Ayarlar’dan Google, Apple veya Facebook hesabına bağlayabilirsin.
      </p>
    </div>
  );
}
