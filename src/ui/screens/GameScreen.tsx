import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SUITS, SUIT_NAME, SUIT_SYMBOL, Suit, isRed, cardId } from '../../engine/cards';
import { GameState, MODE_INFO, Settings, bidOptions, ranking, teamOf } from '../../engine/game';
import { legalMoves } from '../../engine/rules';
import { PlayingCard } from '../components/PlayingCard';
import { HUMAN, useGame } from '../useGame';
import { Prefs } from '../storage';
import { sfx } from '../sound';

export const NAMES = ['Sen', 'Elif', 'Kerem', 'Deniz'];
const SEAT = ['bottom', 'right', 'top', 'left'] as const;
const FROM: Record<(typeof SEAT)[number], { x: number; y: number }> = {
  bottom: { x: 0, y: 260 },
  right: { x: 260, y: 0 },
  top: { x: 0, y: -260 },
  left: { x: -260, y: 0 },
};
const SLOT: Record<(typeof SEAT)[number], { x: number; y: number; r: number }> = {
  bottom: { x: 0, y: 52, r: -3 },
  right: { x: 60, y: 0, r: 8 },
  top: { x: 0, y: -52, r: 2 },
  left: { x: -60, y: 0, r: -8 },
};

const collectVariants = {
  collect: (seat: (typeof SEAT)[number] | null) => ({
    ...(seat ? { x: FROM[seat].x * 0.7, y: FROM[seat].y * 0.7 } : {}),
    opacity: 0,
    scale: 0.5,
    transition: { duration: 0.4, ease: 'easeIn' },
  }),
};

interface Props {
  settings: Settings;
  prefs: Prefs;
  onExit: () => void;
  onGameEnd: (s: GameState) => void;
}

export function GameScreen({ settings, prefs, onExit, onGameEnd }: Props) {
  const { state: s, bid, trump, play, advance, restart } = useGame(settings, prefs.speed);
  const [showScores, setShowScores] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const reported = useRef(false);
  const names = useMemo(() => [prefs.playerName || 'Sen', ...NAMES.slice(1)], [prefs.playerName]);
  const esli = settings.mode === 'esli';

  useEffect(() => {
    if (s.phase === 'gameEnd' && !reported.current) {
      reported.current = true;
      onGameEnd(s);
      ranking(s)[0] === HUMAN || (esli && teamOf(ranking(s)[0]) === 0) ? sfx.win() : sfx.fail();
    }
    if (s.phase !== 'gameEnd') reported.current = false;
  }, [s, onGameEnd, esli]);

  const myTurnToPlay = s.phase === 'playing' && s.turn === HUMAN;
  const legal = useMemo(
    () => (myTurnToPlay ? legalMoves(s.hands[HUMAN], s.trick, s.trump, s.trumpBroken) : []),
    [myTurnToPlay, s.hands, s.trick, s.trump, s.trumpBroken],
  );
  const isLegal = (id: string) => legal.some((c) => cardId(c) === id);

  // Cards fly towards whoever took the trick once it is collected.
  const winnerSeat = s.phase === 'trickEnd' ? SEAT[s.turn] : s.lastTrick ? SEAT[s.lastTrick.winner] : null;

  return (
    <div className="game">
      <header className="hud">
        <button className="icon-btn" onClick={() => setConfirmExit(true)} aria-label="Menü">
          ☰
        </button>
        <div className="hud-center">
          <span className="hud-mode">{MODE_INFO[settings.mode].title}</span>
          <span className="hud-round">
            El {s.round}/{settings.rounds}
          </span>
        </div>
        <div className="hud-chips">
          {s.trump && (
            <span className={`chip chip--trump ${isRed(s.trump) ? 'red' : ''}`} title="Koz">
              {SUIT_SYMBOL[s.trump]}
            </span>
          )}
          {s.highBid && <span className="chip">İhale {s.highBid.amount}</span>}
        </div>
        <button className="icon-btn" onClick={() => setShowScores(true)} aria-label="Puan tablosu">
          🏆
        </button>
      </header>

      <div className="table">
        <div className="table-felt">
          <div className="table-logo">BATAK</div>
        </div>

        {[1, 2, 3].map((p) => (
          <Opponent key={p} p={p} s={s} name={names[p]} esli={esli} />
        ))}

        <div className="trick">
          <AnimatePresence custom={winnerSeat}>
            {s.trick.map(({ player, card }) => {
              const seat = SEAT[player];
              const slot = SLOT[seat];
              return (
                <motion.div
                  key={cardId(card)}
                  className="trick-card"
                  custom={winnerSeat}
                  initial={{ x: FROM[seat].x, y: FROM[seat].y, rotate: slot.r * 4, opacity: 0.4, scale: 0.8 }}
                  animate={{ x: slot.x, y: slot.y, rotate: slot.r, opacity: 1, scale: 1 }}
                  variants={collectVariants}
                  exit="collect"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                >
                  <PlayingCard card={card} />
                </motion.div>
              );
            })}
          </AnimatePresence>
          {s.phase === 'bidding' && <BiddingStatus s={s} names={names} />}
          {s.phase === 'trump' && s.turn !== HUMAN && (
            <div className="center-msg">{names[s.turn]} kozu seçiyor…</div>
          )}
        </div>

        <PlayerBadge p={HUMAN} s={s} name={names[HUMAN]} esli={esli} />

        {/* Panels sit inside the table so the hand below stays visible while bidding. */}
        <AnimatePresence>
          {s.phase === 'bidding' && s.turn === HUMAN && <BidPanel key="bid" s={s} onBid={bid} />}
          {s.phase === 'trump' && s.turn === HUMAN && <TrumpPanel key="trump" onPick={trump} />}
        </AnimatePresence>
      </div>

      <Hand s={s} isLegal={isLegal} canPlay={myTurnToPlay} onPlay={play} />

      <AnimatePresence>
        {s.phase === 'roundEnd' && (
          <RoundEndModal key="round" s={s} names={names} onNext={advance} />
        )}
        {s.phase === 'gameEnd' && (
          <GameEndModal key="end" s={s} names={names} onRestart={restart} onExit={onExit} />
        )}
        {showScores && <ScoresModal key="scores" s={s} names={names} onClose={() => setShowScores(false)} />}
        {confirmExit && (
          <Modal key="exit" onClose={() => setConfirmExit(false)}>
            <h2>Oyundan çık?</h2>
            <p className="muted">Mevcut oyun kaydedilmeyecek.</p>
            <div className="row">
              <button className="btn btn--ghost" onClick={() => setConfirmExit(false)}>
                Devam et
              </button>
              <button className="btn btn--danger" onClick={onExit}>
                Çık
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function bidText(b: GameState['bids'][number]) {
  if (b === null) return null;
  return b === 'pass' ? 'Pas' : String(b);
}

function PlayerBadge({ p, s, name, esli }: { p: number; s: GameState; name: string; esli: boolean }) {
  const active = s.turn === p && (s.phase === 'bidding' || s.phase === 'playing' || s.phase === 'trump');
  const isBidder = s.highBid?.player === p && s.phase !== 'bidding';
  const b = bidText(s.bids[p]);
  return (
    <div className={`badge badge--${SEAT[p]} ${active ? 'badge--active' : ''}`}>
      <div className={`avatar avatar--${p} ${esli ? `team-${teamOf(p)}` : ''}`}>
        {name[0]}
        {isBidder && <span className="avatar-crown">♛</span>}
      </div>
      <div className="badge-info">
        <span className="badge-name">{name}</span>
        <span className="badge-stats">
          {s.phase !== 'bidding' && <span title="Aldığı el">🂠 {s.tricks[p]}</span>}
          <span className="badge-score">{s.scores[p]}</span>
        </span>
      </div>
      {b && (s.phase === 'bidding' || s.settings.mode === 'kozMaca') && (
        <span className={`bubble ${b === 'Pas' ? 'bubble--pass' : ''}`}>{b}</span>
      )}
    </div>
  );
}

function Opponent({ p, s, name, esli }: { p: number; s: GameState; name: string; esli: boolean }) {
  const n = s.hands[p].length;
  const seat = SEAT[p];
  const vertical = seat === 'left' || seat === 'right';
  return (
    <div className={`opponent opponent--${seat}`}>
      <div className={`opp-hand ${vertical ? 'opp-hand--v' : ''}`}>
        {Array.from({ length: n }, (_, i) => (
          <PlayingCard key={i} faceDown small style={{ zIndex: i }} />
        ))}
      </div>
      <PlayerBadge p={p} s={s} name={name} esli={esli} />
    </div>
  );
}

function useWidth() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return w;
}

function Hand({
  s,
  isLegal,
  canPlay,
  onPlay,
}: {
  s: GameState;
  isLegal: (id: string) => boolean;
  canPlay: boolean;
  onPlay: (c: GameState['hands'][number][number]) => void;
}) {
  const hand = s.hands[HUMAN];
  const width = Math.min(useWidth(), 760);
  const cardW = width < 420 ? 64 : 84;
  const cardH = cardW * 1.44;
  const n = hand.length;
  // leave room on both sides for the fan's rotation spill
  const step = n > 1 ? Math.min(cardW * 0.62, (width - cardW - 44) / (n - 1)) : 0;
  const total = cardW + step * (n - 1);
  const mid = (n - 1) / 2;
  const arc = 0.45;

  return (
    <div className="hand" style={{ height: cardH + arc * mid * mid + 30 }}>
      <AnimatePresence>
        {hand.map((c, i) => {
          const id = cardId(c);
          const legal = canPlay && isLegal(id);
          const off = i - mid;
          return (
            <motion.div
              key={id}
              className="hand-slot"
              initial={{ y: 120, opacity: 0 }}
              animate={{
                x: -total / 2 + i * step,
                y: off * off * arc + (legal ? -14 : 0),
                rotate: off * 1.6,
                opacity: 1,
              }}
              exit={{ y: -140, opacity: 0, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 28, delay: s.trick.length === 0 && s.tricks.every((t) => t === 0) ? i * 0.025 : 0 }}
              style={{ width: cardW, zIndex: i }}
              whileHover={legal ? { y: -26 } : undefined}
            >
              <PlayingCard card={c} playable={legal} dimmed={canPlay && !legal} onClick={() => onPlay(c)} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function BiddingStatus({ s, names }: { s: GameState; names: string[] }) {
  if (s.settings.mode === 'kozMaca') {
    return <div className="center-msg">Koz: Maça ♠ — Herkes kaç el alacağını söylüyor</div>;
  }
  return (
    <div className="center-msg">
      {s.highBid ? (
        <>
          İhale <b>{s.highBid.amount}</b> — {names[s.highBid.player]}
        </>
      ) : (
        'İhale başlıyor'
      )}
      {s.turn !== HUMAN && <div className="muted small">{names[s.turn]} düşünüyor…</div>}
    </div>
  );
}

const sheet = {
  initial: { y: 200, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 200, opacity: 0 },
  transition: { type: 'spring', stiffness: 300, damping: 30 },
} as const;

function BidPanel({ s, onBid }: { s: GameState; onBid: (b: number | 'pass') => void }) {
  const { min, max, canPass } = bidOptions(s);
  const kozMaca = s.settings.mode === 'kozMaca';
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <motion.div className="panel" {...sheet}>
      <div className="panel-title">{kozMaca ? 'Kaç el alacaksın?' : 'İhale ver'}</div>
      <div className="bid-grid">
        {nums.map((n) => (
          <button key={n} className="bid-btn" onClick={() => onBid(n)}>
            {n}
          </button>
        ))}
      </div>
      {canPass && (
        <button className="btn btn--ghost wide" onClick={() => onBid('pass')}>
          Pas
        </button>
      )}
    </motion.div>
  );
}

function TrumpPanel({ onPick }: { onPick: (s: Suit) => void }) {
  return (
    <motion.div className="panel" {...sheet}>
      <div className="panel-title">İhaleyi aldın! Kozu seç</div>
      <div className="trump-grid">
        {SUITS.map((suit) => (
          <button key={suit} className={`trump-btn ${isRed(suit) ? 'red' : ''}`} onClick={() => onPick(suit)}>
            <span className="trump-sym">{SUIT_SYMBOL[suit]}</span>
            <span>{SUIT_NAME[suit]}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function Modal({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="modal"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function RoundEndModal({ s, names, onNext }: { s: GameState; names: string[]; onNext: () => void }) {
  const r = s.history[s.history.length - 1];
  const kozMaca = s.settings.mode === 'kozMaca';
  const made = kozMaca ? r.delta[HUMAN] > 0 : r.delta[r.bidder] > 0;
  return (
    <Modal>
      <h2>{s.round}. El Bitti</h2>
      {!kozMaca && (
        <p className={made ? 'good' : 'bad'}>
          {names[r.bidder]} {r.bid} ihaleyi {SUIT_SYMBOL[r.trump]} kozla {made ? 'tutturdu' : 'tutturamadı — battı!'}
        </p>
      )}
      <table className="score-table">
        <thead>
          <tr>
            <th />
            <th>{kozMaca ? 'Söz' : 'İhale'}</th>
            <th>Aldı</th>
            <th>Puan</th>
            <th>Toplam</th>
          </tr>
        </thead>
        <tbody>
          {names.map((n, p) => (
            <tr key={p} className={p === HUMAN ? 'me' : ''}>
              <td>{n}</td>
              <td>{kozMaca ? (r.bids[p] as number) : p === r.bidder ? r.bid : '–'}</td>
              <td>{r.tricks[p]}</td>
              <td className={r.delta[p] >= 0 ? 'good' : 'bad'}>
                {r.delta[p] > 0 ? '+' : ''}
                {r.delta[p]}
              </td>
              <td>
                <b>{s.scores[p]}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn--gold wide" onClick={onNext}>
        Sonraki El
      </button>
    </Modal>
  );
}

function ScoresModal({ s, names, onClose }: { s: GameState; names: string[]; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <h2>Puan Tablosu</h2>
      <div className="scroll">
        <table className="score-table">
          <thead>
            <tr>
              <th>El</th>
              {names.map((n) => (
                <th key={n}>{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.history.map((r) => (
              <tr key={r.round}>
                <td>
                  {r.round} <span className={isRed(r.trump) ? 'red' : ''}>{SUIT_SYMBOL[r.trump]}</span>
                </td>
                {r.delta.map((d, p) => (
                  <td key={p} className={d >= 0 ? 'good' : 'bad'}>
                    {d}
                    {p === r.bidder && s.settings.mode !== 'kozMaca' && '♛'}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="total">
              <td>Toplam</td>
              {s.scores.map((v, p) => (
                <td key={p}>{v}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <button className="btn btn--ghost wide" onClick={onClose}>
        Kapat
      </button>
    </Modal>
  );
}

function GameEndModal({
  s,
  names,
  onRestart,
  onExit,
}: {
  s: GameState;
  names: string[];
  onRestart: () => void;
  onExit: () => void;
}) {
  const order = ranking(s);
  const esli = s.settings.mode === 'esli';
  const won = esli ? teamOf(order[0]) === 0 : order[0] === HUMAN;
  return (
    <Modal>
      {won && <Confetti />}
      <div className="trophy">{won ? '🏆' : '🃏'}</div>
      <h2>{won ? 'Tebrikler, kazandın!' : 'Oyun bitti'}</h2>
      {esli ? (
        <p className="muted">
          Takımın: {s.scores[0]} — Rakip: {s.scores[1]}
        </p>
      ) : (
        <ol className="podium">
          {order.map((p, i) => (
            <li key={p} className={p === HUMAN ? 'me' : ''}>
              <span>
                {i + 1}. {names[p]}
              </span>
              <b>{s.scores[p]}</b>
            </li>
          ))}
        </ol>
      )}
      <div className="row">
        <button className="btn btn--ghost" onClick={onExit}>
          Menü
        </button>
        <button className="btn btn--gold" onClick={onRestart}>
          Tekrar Oyna
        </button>
      </div>
    </Modal>
  );
}

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        color: ['#f5c542', '#e84855', '#3ec7a0', '#5aa9ff'][i % 4],
        rot: Math.random() * 360,
      })),
    [],
  );
  return (
    <div className="confetti" aria-hidden>
      {bits.map((b, i) => (
        <span key={i} style={{ left: `${b.left}%`, background: b.color, animationDelay: `${b.delay}s`, transform: `rotate(${b.rot}deg)` }} />
      ))}
    </div>
  );
}
