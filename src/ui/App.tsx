import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, GameState, Settings, ranking, teamOf } from '../engine/game';
import { Ads, adsActive } from '../services/ads';
import { Auth, User } from '../services/auth';
import { LocalOnline, PlayerProfile, Room, roomSettings } from '../services/online';
import { Premium } from '../services/premium';
import { DEFAULT_PREFS, DEFAULT_STATS, Prefs, Stats, load, save } from './storage';
import { setSoundEnabled } from './sound';
import { GameScreen } from './screens/GameScreen';
import { LoginScreen } from './screens/LoginScreen';
import { MenuScreen } from './screens/MenuScreen';
import { PremiumScreen } from './screens/PremiumScreen';
import { RulesScreen, SettingsScreen } from './screens/InfoScreens';
import { CreateRoomScreen, LobbyScreen, PracticeScreen, RoomListScreen } from './screens/RoomScreens';
import { LeaderboardScreen } from './screens/SocialScreens';
import { HUMAN } from './useGame';

type Screen =
  | 'menu'
  | 'game'
  | 'premium'
  | 'rules'
  | 'settings'
  | 'rooms'
  | 'create'
  | 'lobby'
  | 'leaderboard'
  | 'friends'
  | 'practice';

/** Rotate the room's seats so the local player sits at index 0 (bottom of the table). */
function seatsFromMe(room: Room): PlayerProfile[] {
  const seats = room.seats as PlayerProfile[];
  const k = seats.findIndex((p) => p.id === 'me');
  return [...seats.slice(k), ...seats.slice(0, k)];
}

export function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [settings, setSettings] = useState<Settings>(() => load('batak.settings', DEFAULT_SETTINGS));
  const [prefs, setPrefs] = useState<Prefs>(() => load('batak.prefs', DEFAULT_PREFS));
  const [, setStats] = useState<Stats>(() => load('batak.stats', DEFAULT_STATS));
  const [premium, setPremium] = useState(Premium.isPremium);
  const [user, setUser] = useState<User | null>(Auth.user);
  const [authReady, setAuthReady] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const online = useMemo(() => (user ? new LocalOnline(user, () => Premium.isPremium) : null), [user]);
  const [wallet, setWallet] = useState(() => online?.wallet());
  const [lobby, setLobby] = useState<Room | null>(null);
  const [table, setTable] = useState<{ room: Room; players: PlayerProfile[] } | null>(null);
  const [watchingAd, setWatchingAd] = useState(false);

  useEffect(() => setWallet(online?.wallet()), [online]);

  const watchAd = async () => {
    if (!online) return;
    setWatchingAd(true);
    try {
      if (await Ads.showRewarded()) setWallet(online.creditAdReward());
    } finally {
      setWatchingAd(false);
    }
  };

  const startTable = useCallback(
    (room: Room) => {
      if (!online) return;
      setWallet(online.startGame(room));
      setTable({ room, players: seatsFromMe(room) });
      setLobby(null);
      setGameKey((k) => k + 1);
      setScreen('game');
    },
    [online],
  );

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

  const onGameEnd = useCallback(
    (s: GameState, prizeWon: number) => {
      const top = ranking(s)[0];
      const won = s.settings.mode === 'esli' ? teamOf(top) === 0 : top === HUMAN;
      setStats((st) => {
        const next = { played: st.played + 1, won: st.won + (won ? 1 : 0), bestScore: Math.max(st.bestScore, s.scores[HUMAN]) };
        save('batak.stats', next);
        return next;
      });
      if (table && online) setWallet(online.finishGame(prizeWon, won));
      void Ads.onGameFinished();
    },
    [table, online],
  );

  const showWebAdPlaceholder = !Capacitor.isNativePlatform() && adsActive() && screen === 'menu' && !!user;

  if (!authReady) return <div className={`app theme-${prefs.theme}`} />;
  if (!user || !online || !wallet)
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
          wallet={wallet}
          premium={premium}
          watchingAd={watchingAd}
          onClaimDaily={() => setWallet(online.claimDaily())}
          onWatchAd={watchAd}
          onNavigate={setScreen}
        />
      )}
      {screen === 'practice' && (
        <PracticeScreen
          settings={settings}
          onChange={setSettings}
          onPlay={() => {
            setTable(null);
            setGameKey((k) => k + 1);
            setScreen('game');
          }}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'rooms' && (
        <RoomListScreen
          online={online}
          wallet={wallet}
          onJoined={(r) => {
            setLobby(r);
            setScreen('lobby');
          }}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'create' && (
        <CreateRoomScreen
          online={online}
          wallet={wallet}
          initial={settings}
          onCreated={(r) => {
            setLobby(r);
            setScreen('lobby');
          }}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'lobby' && lobby && <LobbyScreen online={online} room={lobby} onStart={startTable} onBack={() => setScreen('menu')} />}
      {(screen === 'leaderboard' || screen === 'friends') && (
        <LeaderboardScreen
          key={screen}
          online={online}
          initialTab={screen === 'friends' ? 'arkadaslar' : 'genel'}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          key={gameKey}
          settings={table ? roomSettings(table.room) : settings}
          prefs={prefs}
          playerName={user.name.split(' ')[0] || 'Sen'}
          photoUrl={user.photoUrl}
          premium={premium}
          table={table ?? undefined}
          online={online}
          onExit={(abandoned) => {
            if (abandoned) setWallet(online.leaveGame());
            setTable(null);
            setScreen('menu');
          }}
          onGameEnd={onGameEnd}
        />
      )}
      {screen === 'premium' && <PremiumScreen premium={premium} user={user} onBack={() => setScreen('menu')} />}
      {screen === 'rules' && <RulesScreen onBack={() => setScreen('menu')} />}
      {screen === 'settings' && (
        <SettingsScreen prefs={prefs} user={user} premium={premium} onChange={setPrefs} onBack={() => setScreen('menu')} />
      )}
      {watchingAd && !Capacitor.isNativePlatform() && (
        <div className="overlay ad-sim">
          <div>
            <div className="ad-sim-box">Reklam (demo)</div>
            <p className="muted small">Gerçek uygulamada burada ödüllü video reklam oynar.</p>
          </div>
        </div>
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
