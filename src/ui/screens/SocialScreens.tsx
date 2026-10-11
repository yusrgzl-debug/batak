import { useEffect, useReducer, useState } from 'react';
import { FriendStatus, LocalOnline, PlayerProfile } from '../../services/online';
import { Avatar } from '../components/Avatar';
import { pt } from '../format';
import { Modal } from './GameScreen';

/* ---------- Lider Tablosu (+ Arkadaşlar sekmesi) ---------- */

export function LeaderboardScreen({
  online,
  initialTab,
  onBack,
}: {
  online: LocalOnline;
  initialTab: 'genel' | 'arkadaslar';
  onBack: () => void;
}) {
  const [tab, setTab] = useState(initialTab);
  const [rows, setRows] = useState<{ rank: number; player: PlayerProfile }[] | null>(null);
  const [open, setOpen] = useState<PlayerProfile | null>(null);
  useEffect(() => {
    setRows(null);
    void online.leaderboard(tab).then(setRows);
  }, [online, tab]);

  return (
    <div className="page">
      <div className="page-head">
        <button className="icon-btn back" onClick={onBack} aria-label="Geri">
          ‹
        </button>
        <h1>{tab === 'genel' ? 'Lider Tablosu' : 'Arkadaşlar'}</h1>
        <div className="page-head-right" />
      </div>
      <div className="seg seg--full tabs">
        <button className={`seg-btn ${tab === 'genel' ? 'seg-btn--on' : ''}`} onClick={() => setTab('genel')}>
          Genel
        </button>
        <button className={`seg-btn ${tab === 'arkadaslar' ? 'seg-btn--on' : ''}`} onClick={() => setTab('arkadaslar')}>
          Arkadaşlar
        </button>
      </div>
      {!rows && <p className="muted center">Yükleniyor…</p>}
      {rows && tab === 'arkadaslar' && rows.length <= 1 && (
        <p className="muted center">
          Henüz arkadaşın yok. Oyunda bir oyuncunun üstüne dokunup <b>Arkadaş Ekle</b> diyebilirsin.
        </p>
      )}
      <ol className="leaderboard">
        {rows?.map(({ rank, player }) => (
          <li key={player.id} className={player.id === 'me' ? 'me' : ''}>
            <button onClick={() => player.id !== 'me' && setOpen(player)}>
              <span className={`lb-rank lb-rank--${rank <= 3 ? rank : 'n'}`}>{rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}</span>
              <Avatar name={player.name} photoUrl={player.photoUrl} premium={player.premium} size={36} className={`avatar--${player.id === 'me' ? 0 : (rank % 3) + 1}`} />
              <span className="lb-name">{player.id === 'me' ? `${player.name} (sen)` : player.name}</span>
              <span className="points">
                <span className="pt-coin">Pt</span> {pt(player.points)}
              </span>
            </button>
          </li>
        ))}
      </ol>
      {open && <PlayerCard online={online} player={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

/* ---------- oyuncu kartı (lider tablosu ve masada oyuncuya dokununca) ---------- */

export function PlayerCard({ online, player, onClose }: { online?: LocalOnline; player: PlayerProfile; onClose: () => void }) {
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const status: FriendStatus = online ? online.friendStatus(player.id) : 'none';
  const rate = player.games ? Math.round((player.wins / player.games) * 100) : 0;
  return (
    <Modal onClose={onClose}>
      <div className="player-card">
        <Avatar name={player.name} photoUrl={player.photoUrl} premium={player.premium} size={84} className="avatar--2" />
        <h2>{player.bot ? 'Bot' : player.name}</h2>
        {player.bot ? (
          <p className="muted">Bilgisayar oyuncusu. Masadan ayrılan oyuncunun yerine oynar.</p>
        ) : (
          <>
            <div className="points big">
              <span className="pt-coin">Pt</span> {pt(player.points)}
            </div>
            <div className="player-stats">
              <span>
                <b>{pt(player.games)}</b>
                <small>Oyun</small>
              </span>
              <span>
                <b>{pt(player.wins)}</b>
                <small>Galibiyet</small>
              </span>
              <span>
                <b>%{rate}</b>
                <small>Kazanma</small>
              </span>
            </div>
            {online && player.id !== 'me' && (
              <button
                className={`btn wide ${status === 'none' ? 'btn--gold' : 'btn--ghost'}`}
                disabled={status !== 'none'}
                onClick={() => online.addFriend(player.id, rerender)}
              >
                {status === 'none' ? '➕ Arkadaş Ekle' : status === 'pending' ? 'İstek gönderildi…' : '✓ Arkadaşsınız'}
              </button>
            )}
          </>
        )}
        <button className="btn btn--ghost wide" onClick={onClose}>
          Kapat
        </button>
      </div>
    </Modal>
  );
}
