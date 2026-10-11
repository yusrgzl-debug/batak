import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, GameState, Settings, ranking, teamOf } from '../engine/game';
import { Ads, adsActive } from '../services/ads';
import { Auth, User } from '../services/auth';
import { Premium } from '../services/premium';
import { DEFAULT_PREFS, DEFAULT_STATS, Prefs, Stats, load, save } from './storage';
import { setSoundEnabled } from './sound';
import { GameScreen } from './screens/GameScreen';
import { LoginScreen } from './screens/LoginScreen';
import { MenuScreen } from './screens/MenuScreen';
import { PremiumScreen } from './screens/PremiumScreen';
import { RulesScreen, SettingsScreen } from './screens/InfoScreens';
import { HUMAN } from './useGame';

type Screen = 'menu' | 'game' | 'premium' | 'rules' | 'settings';

export function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [settings, setSettings] = useState<Settings>(() => load('batak.settings', DEFAULT_SETTINGS));
  const [prefs, setPrefs] = useState<Prefs>(() => load('batak.prefs', DEFAULT_PREFS));
  const [stats, setStats] = useState<Stats>(() => load('batak.stats', DEFAULT_STATS));
  const [premium, setPremium] = useState(Premium.isPremium);
  const [user, setUser] = useState<User | null>(Auth.user);
  const [authReady, setAuthReady] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    const off = Auth.subscribe((u) => {
      setUser(u);
      if (!u) {
        // signed out or account deleted: back to the login screen with fresh local data
        setScreen('menu');
        setStats(load('batak.stats', DEFAULT_STATS));
        setPrefs(load('batak.prefs', DEFAULT_PREFS));
      }
    });
    Auth.init()
      .catch((e) => console.warn('auth init failed', e))
      .finally(() => setAuthReady(true));
    return off;
  }, []);

  useEffect(() => {
    const off = Premium.subscribe(setPremium);
    Premium.init()
      .then(() => Ads.init())
      .catch((e) => console.warn('monetization init failed', e));
    return off;
  }, []);

  useEffect(() => save('batak.settings', settings), [settings]);
  useEffect(() => {
    save('batak.prefs', prefs);
    setSoundEnabled(prefs.sound);
  }, [prefs]);

  // Native banner only on the menu, never on top of the cards.
  useEffect(() => {
    if (user && screen === 'menu' && !premium) void Ads.showBanner();
    else void Ads.hideBanner();
  }, [user, screen, premium]);

  const onGameEnd = useCallback((s: GameState) => {
    const top = ranking(s)[0];
    const won = s.settings.mode === 'esli' ? teamOf(top) === 0 : top === HUMAN;
    setStats((st) => {
      const next = { played: st.played + 1, won: st.won + (won ? 1 : 0), bestScore: Math.max(st.bestScore, s.scores[HUMAN]) };
      save('batak.stats', next);
      return next;
    });
    void Ads.onGameFinished();
  }, []);

  const showWebAdPlaceholder = !Capacitor.isNativePlatform() && adsActive() && screen === 'menu' && !!user;

  if (!authReady) return <div className={`app theme-${prefs.theme}`} />;
  if (!user)
    return (
      <div className={`app theme-${prefs.theme}`}>
        <LoginScreen />
      </div>
    );

  return (
    <div className={`app theme-${prefs.theme}`}>
      {screen === 'menu' && (
        <MenuScreen
          user={user}
          settings={settings}
          stats={stats}
          premium={premium}
          onChange={setSettings}
          onPlay={() => {
            setGameKey((k) => k + 1);
            setScreen('game');
          }}
          onPremium={() => setScreen('premium')}
          onSettings={() => setScreen('settings')}
          onRules={() => setScreen('rules')}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          key={gameKey}
          settings={settings}
          prefs={prefs}
          playerName={user.name.split(' ')[0] || 'Sen'}
          onExit={() => setScreen('menu')} onGameEnd={onGameEnd} />
      )}
      {screen === 'premium' && <PremiumScreen premium={premium} onBack={() => setScreen('menu')} />}
      {screen === 'rules' && <RulesScreen onBack={() => setScreen('menu')} />}
      {screen === 'settings' && (
        <SettingsScreen prefs={prefs} user={user} premium={premium} onChange={setPrefs} onBack={() => setScreen('menu')} />
      )}
      {showWebAdPlaceholder && (
        <div className="ad-placeholder" onClick={() => setScreen('premium')}>
          <span>
            Reklam alanı · <u>Kaldırmak için Premium</u>
          </span>
        </div>
      )}
    </div>
  );
}
