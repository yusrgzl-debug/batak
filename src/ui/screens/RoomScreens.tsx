import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ECONOMY, Wallet, entryFee, payoutShares } from '../../engine/economy';
import { MODE_INFO, Mode, Settings } from '../../engine/game';
import { LocalOnline, Room, RoomOptions } from '../../services/online';
import { Avatar } from '../components/Avatar';
import { RoomForm } from '../components/RoomForm';
import { pt } from '../format';

function Header({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <div className="page-head">
      <button className="icon-btn back" onClick={onBack} aria-label="Geri">
        ‹
      </button>
      <h1>{title}</h1>
      <div className="page-head-right">{right}</div>
    </div>
  );
}

const Points = ({ wallet }: { wallet: Wallet }) => (
  <span className="points">
    <span className="pt-coin">Pt</span> {pt(wallet.points)}
  </span>
);

/* ---------- Botlarla Pratik ---------- */

export function PracticeScreen({
  settings,
  onChange,
  onPlay,
  onBack,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  onPlay: () => void;
  onBack: () => void;
}) {
  return (
    <div className="page">
      <Header title="Botlarla Pratik" onBack={onBack} />
      <section className="room">
        <RoomForm value={settings} onChange={onChange} />
        <p className="room-help">Pratik oyunlarında puan kazanılmaz ve kaybedilmez.</p>
        <motion.button className="btn btn--gold btn--xl wide" whileTap={{ scale: 0.96 }} onClick={onPlay}>
          OYNA
        </motion.button>
      </section>
    </div>
  );
}

/* ---------- Oda Kur ---------- */

function PrizeTable({ mode, prize }: { mode: Mode; prize: number }) {
  const shares = payoutShares(mode);
  return (
    <div className="prize-table">
      <div>
        Oyuna giriş bedeli <b className="gold">{pt(entryFee(mode, prize))} Pt</b>
      </div>
      {mode === 'esli' ? (
        <div>
          Kazanan takımın her oyuncusu <b className="gold">{pt(Math.round(prize * shares[0]))} Pt</b> alır
        </div>
      ) : (
        shares.map((s, i) => (
          <div key={i}>
            {i + 1}. <b className="gold">{pt(Math.round(prize * s))} Pt</b>
          </div>
        ))
      )}
    </div>
  );
}

export function CreateRoomScreen({
  online,
  wallet,
  initial,
  onCreated,
  onBack,
}: {
  online: LocalOnline;
  wallet: Wallet;
  initial: Settings;
  onCreated: (r: Room) => void;
  onBack: () => void;
}) {
  const [opts, setOpts] = useState<RoomOptions>({
    mode: initial.mode,
    rounds: initial.rounds,
    trumpRule: initial.trumpRule,
    chat: initial.chat,
    prize: ECONOMY.PRIZES[1],
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const entry = entryFee(opts.mode, opts.prize);
  const short = wallet.points < entry;

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      onCreated(await online.createRoom(opts));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <Header title="Oda Kur" onBack={onBack} right={<Points wallet={wallet} />} />
      <section className="room">
        <RoomForm value={opts} onChange={setOpts} />
        <div className="room-row">
          <span className="room-label">Ödül</span>
          <div className="prize-grid">
            {ECONOMY.PRIZES.map((p) => (
              <button key={p} className={`seg-btn ${opts.prize === p ? 'seg-btn--on' : ''}`} onClick={() => setOpts({ ...opts, prize: p })}>
                {pt(p)}
              </button>
            ))}
          </div>
          <PrizeTable mode={opts.mode} prize={opts.prize} />
        </div>
        {error && <div className="toast">{error}</div>}
        <button className="btn btn--blue btn--xl wide" disabled={short || busy} onClick={create}>
          {short ? `Yetersiz puan (${pt(entry)} Pt gerekli)` : 'Odayı Aç'}
        </button>
      </section>
    </div>
  );
}

/* ---------- Oda Bul ---------- */

const FILTERS: (Mode | 'hepsi')[] = ['hepsi', 'ihaleli', 'esli', 'gommeli', 'kozMaca'];

export function RoomListScreen({
  online,
  wallet,
  onJoined,
  onBack,
}: {
  online: LocalOnline;
  wallet: Wallet;
  onJoined: (r: Room) => void;
  onBack: () => void;
}) {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [filter, setFilter] = useState<Mode | 'hepsi'>('hepsi');
  const [error, setError] = useState<string | null>(null);
  const refresh = () => {
    setRooms(null);
    void online.listRooms().then(setRooms);
  };
  useEffect(refresh, [online]);

  const join = async (r: Room) => {
    setError(null);
    try {
      onJoined(await online.joinRoom(r.id, r));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const shown = rooms?.filter((r) => filter === 'hepsi' || r.mode === filter) ?? [];
  return (
    <div className="page">
      <Header title="Oda Bul" onBack={onBack} right={<Points wallet={wallet} />} />
      <div className="filter-row">
        {FILTERS.map((f) => (
          <button key={f} className={`chip-btn ${filter === f ? 'chip-btn--on' : ''}`} onClick={() => setFilter(f)}>
            {f === 'hepsi' ? 'Hepsi' : MODE_INFO[f].title}
          </button>
        ))}
        <button className="chip-btn" onClick={refresh} aria-label="Yenile">
          ↻
        </button>
      </div>
      {error && <div className="toast">{error}</div>}
      {!rooms && <p className="muted center">Masalar yükleniyor…</p>}
      {rooms && shown.length === 0 && <p className="muted center">Bu türde açık masa yok. Kendi odanı kurabilirsin.</p>}
      <div className="room-list">
        {shown.map((r) => {
          const can = wallet.points >= r.entry;
          const taken = r.seats.filter(Boolean).length;
          return (
            <div key={r.id} className="room-card">
              <div className="room-card-top">
                <div>
                  <b>{MODE_INFO[r.mode].title}</b>
                  <span className="muted small">
                    {' '}
                    · {r.rounds} el · {r.trumpRule === 'zorunlu' ? 'Koz Çıkmalı' : 'Serbest'}
                    {!r.chat && ' · Mesaj kapalı'}
                  </span>
                </div>
                <span className="room-prize">🏆 {pt(r.prize)}</span>
              </div>
              <div className="room-card-bottom">
                <div className="seat-avatars">
                  {r.seats.map((p, i) =>
                    p ? (
                      <Avatar key={i} name={p.name} premium={p.premium} size={28} className={`avatar--${(i % 3) + 1}`} />
                    ) : (
                      <span key={i} className="seat-empty" />
                    ),
                  )}
                  <span className="muted small">
                    {taken}/{r.seats.length}
                  </span>
                </div>
                <button className="btn btn--gold room-join" disabled={!can} onClick={() => join(r)}>
                  {can ? `Katıl · ${pt(r.entry)} Pt` : `${pt(r.entry)} Pt gerekli`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- bekleme salonu ---------- */

export function LobbyScreen({
  online,
  room,
  onStart,
  onBack,
}: {
  online: LocalOnline;
  room: Room;
  onStart: (r: Room) => void;
  onBack: () => void;
}) {
  const [current, setCurrent] = useState(room);
  const full = current.seats.every(Boolean);
  useEffect(() => online.waitForPlayers(room, setCurrent), [online, room]);
  useEffect(() => {
    if (!full) return;
    const t = window.setTimeout(() => onStart(current), 1200);
    return () => window.clearTimeout(t);
  }, [full, current, onStart]);

  return (
    <div className="page">
      <Header title={MODE_INFO[room.mode].title} onBack={onBack} />
      <section className="room lobby">
        <div className="lobby-prize">
          🏆 Ödül <b>{pt(room.prize)} Pt</b> · Giriş {pt(room.entry)} Pt
        </div>
        <div className="lobby-seats">
          {current.seats.map((p, i) => (
            <motion.div key={i} className="lobby-seat" initial={false} animate={{ opacity: p ? 1 : 0.5, scale: p ? 1 : 0.95 }}>
              {p ? (
                <>
                  <Avatar name={p.name} photoUrl={p.photoUrl} premium={p.premium} size={56} className={`avatar--${p.id === 'me' ? 0 : (i % 3) + 1}`} />
                  <b>{p.id === 'me' ? 'Sen' : p.name}</b>
                  <span className="points small">
                    <span className="pt-coin">Pt</span> {pt(p.points)}
                  </span>
                </>
              ) : (
                <>
                  <span className="seat-empty seat-empty--big" />
                  <span className="muted small">Bekleniyor…</span>
                </>
              )}
            </motion.div>
          ))}
        </div>
        <p className="muted center">{full ? 'Masa doldu, oyun başlıyor!' : 'Oyuncular masaya oturuyor…'}</p>
        <p className="room-help center">
          Oyun başlayınca giriş bedeli düşülür. Oyun bitmeden çıkan oyuncunun yerine bot geçer ve {pt(ECONOMY.LEAVE_PENALTY)} Pt ceza
          alır.
        </p>
      </section>
    </div>
  );
}
