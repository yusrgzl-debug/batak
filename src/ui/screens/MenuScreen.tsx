import { motion } from 'framer-motion';
import { MODE_INFO, Mode, Settings } from '../../engine/game';
import { PlayingCard } from '../components/PlayingCard';
import { Stats } from '../storage';

interface Props {
  settings: Settings;
  stats: Stats;
  premium: boolean;
  onChange: (s: Settings) => void;
  onPlay: () => void;
  onPremium: () => void;
  onSettings: () => void;
  onRules: () => void;
}

const ROUNDS = [5, 11, 21];

export function MenuScreen({ settings, stats, premium, onChange, onPlay, onPremium, onSettings, onRules }: Props) {
  return (
    <div className="menu">
      <div className="menu-top">
        <button className="icon-btn" onClick={onSettings} aria-label="Ayarlar">
          ⚙
        </button>
        {premium ? (
          <span className="premium-tag">♛ Premium</span>
        ) : (
          <button className="premium-btn" onClick={onPremium}>
            ♛ Reklamsız Oyna
          </button>
        )}
      </div>

      <div className="logo-wrap">
        <div className="logo-cards">
          {[
            { suit: 'H', rank: 14, r: -18, x: -46 },
            { suit: 'S', rank: 14, r: 0, x: 0 },
            { suit: 'D', rank: 13, r: 18, x: 46 },
          ].map((c, i) => (
            <motion.div
              key={i}
              className="logo-card"
              initial={{ y: 80, rotate: 0, opacity: 0 }}
              animate={{ y: 0, rotate: c.r, x: c.x, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.12, type: 'spring', stiffness: 200, damping: 18 }}
            >
              <PlayingCard card={{ suit: c.suit as 'S', rank: c.rank as 14 }} />
            </motion.div>
          ))}
        </div>
        <h1 className="logo">BATAK</h1>
        <div className="logo-sub">Klasik Türk Kart Oyunu</div>
      </div>

      <div className="mode-list">
        {(Object.keys(MODE_INFO) as Mode[]).map((m) => (
          <button
            key={m}
            className={`mode-card ${settings.mode === m ? 'mode-card--on' : ''}`}
            onClick={() => onChange({ ...settings, mode: m })}
          >
            <span className="mode-title">{MODE_INFO[m].title}</span>
            <span className="mode-desc">{MODE_INFO[m].desc}</span>
          </button>
        ))}
      </div>

      <div className="seg">
        <span className="seg-label">El sayısı</span>
        {ROUNDS.map((r) => (
          <button
            key={r}
            className={`seg-btn ${settings.rounds === r ? 'seg-btn--on' : ''}`}
            onClick={() => onChange({ ...settings, rounds: r })}
          >
            {r}
          </button>
        ))}
      </div>

      <motion.button className="btn btn--gold btn--xl" whileTap={{ scale: 0.96 }} onClick={onPlay}>
        OYNA
      </motion.button>

      <div className="menu-foot">
        <button className="link" onClick={onRules}>
          Nasıl oynanır?
        </button>
        <span className="muted small">
          {stats.played} oyun · {stats.won} galibiyet
        </span>
      </div>
    </div>
  );
}
