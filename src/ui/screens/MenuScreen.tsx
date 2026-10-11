import { motion } from 'framer-motion';
import { MODE_INFO, Mode, ROUND_OPTIONS, Settings, TrumpRule, playerCount } from '../../engine/game';
import { User } from '../../services/auth';
import { Avatar } from '../components/Avatar';
import { Stats } from '../storage';
import { ProviderIcon } from './LoginScreen';

interface Props {
  user: User;
  settings: Settings;
  stats: Stats;
  premium: boolean;
  onChange: (s: Settings) => void;
  onPlay: () => void;
  onPremium: () => void;
  onSettings: () => void;
  onRules: () => void;
}

const MODES: Mode[] = ['ihaleli', 'esli', 'gommeli', 'kozMaca'];
const TRUMP_RULES: { value: TrumpRule; label: string; desc: string }[] = [
  { value: 'zorunlu', label: 'Koz Çıkmalı', desc: 'Elinde yerdeki renk yoksa koz atmak zorunlu.' },
  { value: 'serbest', label: 'Serbest', desc: 'Renk yoksa istediğin kartı atabilirsin.' },
];

export function MenuScreen({ user, settings, stats, premium, onChange, onPlay, onPremium, onSettings, onRules }: Props) {
  const rule = TRUMP_RULES.find((r) => r.value === settings.trumpRule)!;
  return (
    <div className="menu">
      <div className="profile-bar">
        <div className="profile">
          <Avatar name={user.name} photoUrl={user.photoUrl} premium={premium} size={52} className="profile-avatar">
            <span className={`profile-provider profile-provider--${user.provider}`}>
              <ProviderIcon p={user.provider} />
            </span>
          </Avatar>
          <div className="profile-info">
            <b>{user.name}</b>
            <span className="muted small">
              {stats.played} oyun · {stats.won} galibiyet
            </span>
          </div>
        </div>
        <button className="icon-btn" onClick={onSettings} aria-label="Ayarlar">
          ⚙
        </button>
      </div>

      <h1 className="logo logo--small">BATAK</h1>

      {premium ? (
        <span className="premium-tag">♛ Premium</span>
      ) : (
        <button className="premium-btn" onClick={onPremium}>
          ♛ Reklamsız Oyna
        </button>
      )}

      <section className="room">
        <div className="room-title">Oda Kur</div>

        <div className="room-row">
          <span className="room-label">Oyun Tipi</span>
          <div className="mode-grid">
            {MODES.map((m) => (
              <button
                key={m}
                className={`mode-chip ${settings.mode === m ? 'mode-chip--on' : ''}`}
                onClick={() => onChange({ ...settings, mode: m })}
              >
                {MODE_INFO[m].title}
                <span className="mode-chip-sub">{playerCount(m)} kişi</span>
              </button>
            ))}
          </div>
          <span className="room-help">{MODE_INFO[settings.mode].desc}</span>
        </div>

        <div className="room-row">
          <span className="room-label">El Sayısı</span>
          <div className="seg seg--full">
            {ROUND_OPTIONS.map((r) => (
              <button
                key={r}
                className={`seg-btn ${settings.rounds === r ? 'seg-btn--on' : ''}`}
                onClick={() => onChange({ ...settings, rounds: r })}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="room-row">
          <span className="room-label">Koz Oynama Kuralı</span>
          <div className="seg seg--full">
            {TRUMP_RULES.map((r) => (
              <button
                key={r.value}
                className={`seg-btn ${settings.trumpRule === r.value ? 'seg-btn--on' : ''}`}
                onClick={() => onChange({ ...settings, trumpRule: r.value })}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="room-help">{rule.desc}</span>
        </div>

        <div className="room-row room-row--inline">
          <span className="room-label">Mesaj Gönderme</span>
          <div className="seg">
            {[true, false].map((on) => (
              <button
                key={String(on)}
                className={`seg-btn ${settings.chat === on ? 'seg-btn--on' : ''}`}
                onClick={() => onChange({ ...settings, chat: on })}
              >
                {on ? 'Açık' : 'Kapalı'}
              </button>
            ))}
          </div>
        </div>

        <motion.button className="btn btn--gold btn--xl wide" whileTap={{ scale: 0.96 }} onClick={onPlay}>
          OYNA
        </motion.button>
      </section>

      <button className="link" onClick={onRules}>
        Nasıl oynanır?
      </button>
    </div>
  );
}
