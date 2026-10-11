import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, SUITS, SUIT_NAME, SUIT_SYMBOL, Suit, isRed, cardId } from '../../engine/cards';
import { payouts } from '../../engine/economy';
import { GameState, KITTY, MODE_INFO, Settings, bidOptions, finishOrder, ranking, teamOf } from '../../engine/game';
import { LocalOnline, PlayerProfile, Room } from '../../services/online';
import { pt } from '../format';
import { PlayerCard } from './SocialScreens';
import { legalMoves } from '../../engine/rules';
import { Avatar, Crown } from '../components/Avatar';
import { ChatPanel } from '../components/ChatPanel';
import { Hand } from '../components/Hand';
import { BUBBLE_MS, ChatMsg, botOnBidFailed, botOnBidMade, botOnGameEnd, botReplyTo } from '../chat';
import { PlayingCard } from '../components/PlayingCard';
import { SUIT_PATH } from '../components/cardArt';
import { HUMAN, useGame } from '../useGame';
import { Prefs } from '../storage';
import { sfx } from '../sound';

const BOTS = ['Elif', 'Kerem', 'Deniz'];
type Seat = 'bottom' | 'right' | 'top' | 'left';
/** Play goes counter-clockwise: me → right → (top) → left. Gömmeli has no top seat. */
const seatOf = (p: number, n: number): Seat => (n === 3 ? (['bottom', 'right', 'left'] as const) : (['bottom', 'right', 'top', 'left'] as const))[p];
const FROM: Record<Seat, { x: number; y: number }> = {
  bottom: { x: 0, y: 260 },
  right: { x: 260, y: 0 },
  top: { x: 0, y: -260 },
  left: { x: -260, y: 0 },
};
const SLOT: Record<Seat, { x: number; y: number; r: number }> = {
  bottom: { x: 0, y: 52, r: -3 },
  right: { x: 60, y: 0, r: 8 },
  top: { x: 0, y: -52, r: 2 },
  left: { x: -60, y: 0, r: -8 },
};

const collectVariants = {
  collect: (seat: Seat | null) => ({
    ...(seat ? { x: FROM[seat].x * 0.7, y: FROM[seat].y * 0.7 } : {}),
    opacity: 0,
    scale: 0.5,
    transition: { duration: 0.4, ease: 'easeIn' },
  }),
};

interface Props {
  settings: Settings;
  prefs: Prefs;
  playerName: string;
  photoUrl: string | null;
  premium: boolean;
  /** set when playing at an online table (points at stake) */
  table?: { room: Room; players: PlayerProfile[] };
  online?: LocalOnline;
  /** abandoned = left a running table game (bot takes the seat, penalty applies) */
  onExit: (abandoned: boolean) => void;
  onGameEnd: (s: GameState, prizeWon: number) => void;
}

const BOT: PlayerProfile = { id: 'bot', name: 'Bot', points: 0, games: 0, wins: 0, premium: false, bot: true };

export function GameScreen({ settings, prefs, playerName, photoUrl, premium, table, online, onExit, onGameEnd }: Props) {
  const { state: s, bid, bury, trump, play, advance, restart } = useGame(settings, prefs.speed);
  const [showScores, setShowScores] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [toBury, setToBury] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const reported = useRef(false);
  // seats that were abandoned mid-game and are now played by a bot
  const [left, setLeft] = useState<number[]>([]);
  const [openProfile, setOpenProfile] = useState<PlayerProfile | null>(null);
  const seatPlayer = (p: number): PlayerProfile | null => {
    if (!table) return null;
    if (left.includes(p)) return BOT;
    return table.players[p];
  };
  const names = useMemo(
    () =>
      Array.from({ length: s.n }, (_, p) => {
        if (p === HUMAN) return playerName;
        if (!table) return BOTS[p - 1];
        if (left.includes(p)) return '🤖 Bot';
        return table.players[p].name.split(' ')[0];
      }),
    [playerName, s.n, table, left],
  );
  const prizeWon = useMemo(
    () => (table && s.phase === 'gameEnd' ? payouts(settings.mode, table.room.prize, finishOrder(s))[HUMAN] : 0),
    [table, s, settings.mode],
  );

  // At an online table another player may leave; a bot takes the seat (demo: simulated now and then).
  const leavePlan = useMemo(() => {
    if (!table || Math.random() > 0.3) return null;
    return { seat: 1 + Math.floor(Math.random() * (s.n - 1)), round: 1 + Math.floor(Math.random() * Math.max(1, settings.rounds - 1)) };
  }, []);
  useEffect(() => {
    if (!leavePlan || left.includes(leavePlan.seat) || s.round < leavePlan.round || s.phase !== 'playing') return;
    const who = table!.players[leavePlan.seat].name.split(' ')[0];
    setLeft((l) => [...l, leavePlan.seat]);
    setToast(`${who} oyundan ayrıldı, yerine bot geçti`);
  }, [leavePlan, left, s.round, s.phase, table]);
  const esli = settings.mode === 'esli';
  const me = { photoUrl, premium };

  // ---- oda içi mesajlaşma ----
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLog, setChatLog] = useState<ChatMsg[]>([]);
  const [, setTick] = useState(0);
  const say = useCallback((player: number, text: string) => {
    const now = Date.now();
    setChatLog((log) => [...log.slice(-30), { id: now + Math.random(), player, text, at: now }]);
    window.setTimeout(() => setTick((t) => t + 1), BUBBLE_MS + 50); // re-render to hide the bubble
  }, []);
  const botSay = useCallback(
    (text: string | null, delay = 900) => {
      if (!text || !settings.chat) return;
      const bot = 1 + Math.floor(Math.random() * (s.n - 1));
      window.setTimeout(() => say(bot, text), delay + Math.random() * 800);
    },
    [say, settings.chat, s.n],
  );
  const bubbleOf = (p: number) => {
    const m = [...chatLog].reverse().find((x) => x.player === p);
    return m && Date.now() - m.at < BUBBLE_MS ? m.text : null;
  };
  const sendMine = (text: string) => {
    say(HUMAN, text);
    botSay(botReplyTo(text), 1200);
  };

  // bots react to how the hand went
  const rounds = s.history.length;
  useEffect(() => {
    if (rounds === 0 || settings.mode === 'kozMaca') return;
    const r = s.history[rounds - 1];
    if (Math.random() < 0.45) botSay(r.delta[r.bidder] < 0 ? botOnBidFailed() : botOnBidMade(), 500);
  }, [rounds]);
  useEffect(() => {
    if (s.phase === 'gameEnd') botSay(botOnGameEnd(), 1500);
  }, [s.phase === 'gameEnd']);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1600);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (s.phase !== 'bury') setToBury(new Set());
  }, [s.phase]);

  // El Sonu Yaz Boz kapalıysa el sonu tablosu gösterilmeden sonraki ele geçilir.
  useEffect(() => {
    if (s.phase !== 'roundEnd' || prefs.roundSummary) return;
    const r = s.history[s.history.length - 1];
    setToast(`${s.round}. el bitti · ${r.delta[HUMAN] > 0 ? '+' : ''}${r.delta[HUMAN]} puan`);
    const t = window.setTimeout(advance, 1800);
    return () => window.clearTimeout(t);
  }, [s.phase, s.round, s.history, prefs.roundSummary, advance]);

  useEffect(() => {
    if (s.phase === 'gameEnd' && !reported.current) {
      reported.current = true;
      onGameEnd(s, prizeWon);
      ranking(s)[0] === HUMAN || (esli && teamOf(ranking(s)[0]) === 0) ? sfx.win() : sfx.fail();
    }
    if (s.phase !== 'gameEnd') reported.current = false;
  }, [s, onGameEnd, esli, prizeWon]);

  const myTurnToPlay = s.phase === 'playing' && s.turn === HUMAN;
  const legal = useMemo(
    () => (myTurnToPlay ? legalMoves(s.hands[HUMAN], s.trick, s.trump, s.trumpBroken, settings.trumpRule) : []),
    [myTurnToPlay, s.hands, s.trick, s.trump, s.trumpBroken, settings.trumpRule],
  );
  const isLegal = (c: Card) => legal.some((l) => cardId(l) === cardId(c));
  const burying = s.phase === 'bury' && s.turn === HUMAN;
  // Gömmeli: after burying, the 4 kitty cards stand out (gold frame + YENİ) for 2 s or until a tap.
  const [fresh, setFresh] = useState<Set<string> | undefined>();
  const prevPhase = useRef(s.phase);
  useEffect(() => {
    const justBuried = prevPhase.current === 'bury' && s.phase === 'playing' && s.highBid?.player === HUMAN;
    prevPhase.current = s.phase;
    if (!justBuried) return;
    setFresh(new Set(s.kitty.map(cardId)));
    const clear = () => setFresh(undefined);
    const t = window.setTimeout(clear, 2000);
    // a tap anywhere ends the highlight (registered after this click has finished bubbling)
    const arm = window.setTimeout(() => window.addEventListener('pointerdown', clear, { once: true }), 0);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(arm);
      window.removeEventListener('pointerdown', clear);
    };
  }, [s.phase, s.highBid, s.kitty]);

  const onTap = (c: Card) => {
    if (burying) {
      const id = cardId(c);
      setToBury((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else if (next.size < KITTY) next.add(id);
        return next;
      });
      return;
    }
    if (!myTurnToPlay) return;
    if (isLegal(c)) play(c);
    else setToast('Bu kartı şu an atamazsın');
  };

  // Cards fly towards whoever took the trick once it is collected.
  const winnerSeat =
    s.phase === 'trickEnd' ? seatOf(s.turn, s.n) : s.lastTrick ? seatOf(s.lastTrick.winner, s.n) : null;

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
          {s.highBid && (
            <span className="chip">
              İhale {s.phase === 'bidding' ? s.highBid.amount : bidProgress(s, s.highBid.player)}
            </span>
          )}
        </div>
        {settings.chat && (
          <button className="icon-btn" onClick={() => setChatOpen(true)} aria-label="Mesajlar">
            💬
          </button>
        )}
        <button className="icon-btn" onClick={() => setShowScores(true)} aria-label="Puan tablosu">
          🏆
        </button>
      </header>

      <div className="table">
        <div className="table-felt">
          <div className="table-center">
            {s.trump && (
              <svg viewBox="0 0 100 100" className={`table-trump ${isRed(s.trump) ? 'table-trump--red' : ''}`} aria-label={`Koz ${SUIT_NAME[s.trump]}`}>
                <path d={SUIT_PATH[s.trump]} />
              </svg>
            )}
            <div className="table-logo">BATAK</div>
          </div>
        </div>

        {names.slice(1).map((_, i) => i + 1).map((p) => (
          <Opponent
            key={p}
            p={p}
            s={s}
            name={names[p]}
            esli={esli}
            bubble={bubbleOf(p)}
            photoUrl={seatPlayer(p)?.photoUrl}
            premium={seatPlayer(p)?.premium}
            onTap={() =>
              setOpenProfile(
                seatPlayer(p) ?? { ...BOT, name: names[p] },
              )
            }
          />
        ))}

        <div className="trick">
          <AnimatePresence custom={winnerSeat}>
            {s.trick.map(({ player, card }) => {
              const seat = seatOf(player, s.n);
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
          {s.phase === 'bury' && s.turn !== HUMAN && (
            <div className="center-msg">
              {names[s.turn]} {s.highBid?.amount} ile ihaleyi aldı
              <div className="muted small">4 kart gömüyor, sonra yerdeki 4 kartı alacak…</div>
            </div>
          )}
        </div>

        <PlayerBadge p={HUMAN} s={s} name={names[HUMAN]} esli={esli} bubble={bubbleOf(HUMAN)} {...me} />

        {/* Panels sit inside the table so the hand below stays visible while bidding. */}
        <AnimatePresence>
          {s.phase === 'bidding' && s.turn === HUMAN && <BidPanel key="bid" s={s} onBid={bid} />}
          {s.phase === 'trump' && s.turn === HUMAN && <TrumpPanel key="trump" onPick={trump} />}
          {burying && (
            <BuryPanel
              key="bury"
              count={toBury.size}
              onBury={() => bury(s.hands[HUMAN].filter((c) => toBury.has(cardId(c))))}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {toast && (
            <motion.div key="toast" className="game-toast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Hand
        cards={s.hands[HUMAN]}
        isActive={(c) => burying || (myTurnToPlay && (!prefs.cardHelper || isLegal(c)))}
        dimInactive={prefs.cardHelper && myTurnToPlay}
        selected={burying ? toBury : undefined}
        fresh={fresh}
        onTap={onTap}
      />

      <AnimatePresence>
        {s.phase === 'roundEnd' && prefs.roundSummary && (
          <RoundEndModal key="round" s={s} names={names} onNext={advance} />
        )}
        {s.phase === 'gameEnd' && (
          <GameEndModal
            key="end"
            s={s}
            names={names}
            prize={table ? prizeWon : null}
            onRestart={table ? null : restart}
            onExit={() => onExit(false)}
          />
        )}
        {chatOpen && <ChatPanel key="chat" log={chatLog} names={names} onSend={sendMine} onClose={() => setChatOpen(false)} />}
        {showScores && <ScoresModal key="scores" s={s} names={names} onClose={() => setShowScores(false)} />}
        {openProfile && <PlayerCard key="profile" online={online} player={openProfile} onClose={() => setOpenProfile(null)} />}
        {confirmExit && (
          <Modal key="exit" onClose={() => setConfirmExit(false)}>
            <h2>Oyundan çık?</h2>
            {table ? (
              <p className="muted">
                Yerine bot geçer. Giriş bedeli ({pt(table.room.entry)} Pt) iade edilmez ve <b className="bad">500 Pt ceza</b> alırsın.
              </p>
            ) : (
              <p className="muted">Mevcut oyun kaydedilmeyecek.</p>
            )}
            <div className="row">
              <button className="btn btn--ghost" onClick={() => setConfirmExit(false)}>
                Devam et
              </button>
              <button className="btn btn--danger" onClick={() => onExit(!!table && s.phase !== 'gameEnd')}>
                Çık
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * "aldığı / ihale" for whoever has to make a bid: the bidder (team total in Eşli), or every
 * player in Koz Maça. Null for players without a target.
 */
function bidProgress(s: GameState, p: number): string | null {
  if (s.settings.mode === 'kozMaca') {
    const b = s.bids[p];
    return typeof b === 'number' ? `${s.tricks[p]}/${b}` : null;
  }
  if (!s.highBid || s.highBid.player !== p) return null;
  const won = s.settings.mode === 'esli' ? s.tricks[p] + s.tricks[(p + 2) % 4] : s.tricks[p];
  return `${won}/${s.highBid.amount}`;
}

function bidText(b: GameState['bids'][number]) {
  if (b === null) return null;
  return b === 'pass' ? 'Pas' : String(b);
}

interface BadgeProps {
  p: number;
  s: GameState;
  name: string;
  esli: boolean;
  bubble: string | null;
  photoUrl?: string | null;
  premium?: boolean;
  onTap?: () => void;
}

function PlayerBadge({ p, s, name, esli, bubble, photoUrl, premium, onTap }: BadgeProps) {
  const active = s.turn === p && ['bidding', 'bury', 'trump', 'playing'].includes(s.phase);
  const isBidder = s.highBid?.player === p && s.phase !== 'bidding';
  const b = bidText(s.bids[p]);
  return (
    <div
      className={`badge badge--${seatOf(p, s.n)} ${active ? 'badge--active' : ''} ${onTap ? 'badge--tappable' : ''}`}
      onClick={onTap}
      role={onTap ? 'button' : undefined}
    >
      <Avatar name={name} photoUrl={photoUrl} premium={premium} className={`avatar--${p} ${esli ? `team-${teamOf(p)}` : ''}`}>
        {isBidder && <span className="bidder-tag">İHALE</span>}
      </Avatar>
      <div className="badge-info">
        <span className="badge-name">
          {name}
          {premium && (
            <span className="name-crown">
              <Crown size={14} />
            </span>
          )}
        </span>
        <span className="badge-stats">
          {s.phase !== 'bidding' &&
            (bidProgress(s, p) ? (
              <span className="progress" title="Aldığı el / ihale">
                {bidProgress(s, p)}
              </span>
            ) : (
              <span title="Aldığı el">🂠 {s.tricks[p]}</span>
            ))}
          <span className="badge-score">{s.scores[p]}</span>
        </span>
      </div>
      {b && (s.phase === 'bidding' || s.settings.mode === 'kozMaca') && (
        <span className={`bubble ${b === 'Pas' ? 'bubble--pass' : ''}`}>{b}</span>
      )}
      <AnimatePresence>
        {bubble && (
          <motion.div
            key={bubble}
            className={`speech speech--${seatOf(p, s.n)}`}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {bubble}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Opponent({ p, s, name, esli, bubble, photoUrl, premium, onTap }: BadgeProps) {
  const n = s.hands[p].length;
  const seat = seatOf(p, s.n);
  const vertical = seat === 'left' || seat === 'right';
  return (
    <div className={`opponent opponent--${seat}`}>
      <div className={`opp-hand ${vertical ? 'opp-hand--v' : ''}`}>
        {Array.from({ length: n }, (_, i) => (
          <PlayingCard key={i} faceDown small style={{ zIndex: i }} />
        ))}
      </div>
      <PlayerBadge p={p} s={s} name={name} esli={esli} bubble={bubble} photoUrl={photoUrl} premium={premium} onTap={onTap} />
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

function BuryPanel({ count, onBury }: { count: number; onBury: () => void }) {
  return (
    <motion.div className="panel" {...sheet}>
      <div className="panel-title">Gömmek istediğin 4 kartı seç ({count}/{KITTY})</div>
      <p className="panel-sub">Kartları gömünce yerdeki 4 kart eline gelecek.</p>
      <button className="btn btn--gold wide" disabled={count !== KITTY} onClick={onBury}>
        Kartları Göm
      </button>
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
      {s.buried.length > 0 && (
        <div className="buried">
          <span className="muted small">Gömülen kartlar</span>
          <div className="buried-cards">
            {s.buried.map((c) => (
              <div key={cardId(c)} className="buried-card">
                <PlayingCard card={c} />
              </div>
            ))}
          </div>
        </div>
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
  prize,
  onRestart,
  onExit,
}: {
  s: GameState;
  names: string[];
  /** points won at an online table (null in practice games) */
  prize: number | null;
  onRestart: (() => void) | null;
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
      {prize !== null && (
        <div className={`prize-result ${prize > 0 ? 'good' : 'muted'}`}>
          {prize > 0 ? `+${pt(prize)} Pt kazandın` : 'Bu masadan puan çıkmadı'}
        </div>
      )}
      <div className="row">
        <button className="btn btn--ghost" onClick={onExit}>
          Menü
        </button>
        {onRestart && (
          <button className="btn btn--gold" onClick={onRestart}>
            Tekrar Oyna
          </button>
        )}
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
