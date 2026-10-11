import { MODE_INFO, Mode, ROUND_OPTIONS, TrumpRule, playerCount } from '../../engine/game';

export interface RoomFormValue {
  mode: Mode;
  rounds: number;
  trumpRule: TrumpRule;
  chat: boolean;
}

const MODES: Mode[] = ['ihaleli', 'esli', 'gommeli', 'kozMaca'];
const TRUMP_RULES: { value: TrumpRule; label: string; desc: string }[] = [
  { value: 'zorunlu', label: 'Koz Çıkmalı', desc: 'Elinde yerdeki renk yoksa koz atmak zorunlu.' },
  { value: 'serbest', label: 'Serbest', desc: 'Renk yoksa istediğin kartı atabilirsin.' },
];

/** Oyun tipi, el sayısı, koz kuralı ve mesajlaşma: shared by Oda Kur and Botlarla Pratik. */
export function RoomForm<T extends RoomFormValue>({ value, onChange }: { value: T; onChange: (v: T) => void }) {
  const rule = TRUMP_RULES.find((r) => r.value === value.trumpRule)!;
  return (
    <>
      <div className="room-row">
        <span className="room-label">Oyun Tipi</span>
        <div className="mode-grid">
          {MODES.map((m) => (
            <button key={m} className={`mode-chip ${value.mode === m ? 'mode-chip--on' : ''}`} onClick={() => onChange({ ...value, mode: m })}>
              {MODE_INFO[m].title}
              <span className="mode-chip-sub">{playerCount(m)} kişi</span>
            </button>
          ))}
        </div>
        <span className="room-help">{MODE_INFO[value.mode].desc}</span>
      </div>

      <div className="room-row">
        <span className="room-label">El Sayısı</span>
        <div className="seg seg--full">
          {ROUND_OPTIONS.map((r) => (
            <button key={r} className={`seg-btn ${value.rounds === r ? 'seg-btn--on' : ''}`} onClick={() => onChange({ ...value, rounds: r })}>
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
              className={`seg-btn ${value.trumpRule === r.value ? 'seg-btn--on' : ''}`}
              onClick={() => onChange({ ...value, trumpRule: r.value })}
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
            <button key={String(on)} className={`seg-btn ${value.chat === on ? 'seg-btn--on' : ''}`} onClick={() => onChange({ ...value, chat: on })}>
              {on ? 'Açık' : 'Kapalı'}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
