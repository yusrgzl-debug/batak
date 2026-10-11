import { useState } from 'react';
import { Plan } from '../../services/config';
import { User } from '../../services/auth';
import { Premium } from '../../services/premium';
import { Avatar } from '../components/Avatar';

interface Props {
  premium: boolean;
  user: User;
  onBack: () => void;
}

const PERKS = [
  ['👑', 'Altın çerçeve ve kral tacı', 'Profil fotoğrafında ve masada herkes görsün'],
  ['🚫', 'Tüm reklamlar kalkar', 'Banner ve oyun arası reklam yok'],
  ['⚡', 'Kesintisiz oyun', 'Oyunlar arasında bekleme yok'],
  ['❤️', 'Geliştirmeyi destekle', 'Yeni modlar ve özellikler için'],
];

export function PremiumScreen({ premium, user, onBack }: Props) {
  const [plan, setPlan] = useState<Plan>('yearly');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const prices = Premium.prices;

  const run = async (fn: () => Promise<boolean>, okMsg: string, noMsg: string) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg((await fn()) ? okMsg : noMsg);
    } catch (e) {
      setMsg(`Hata: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="premium">
      <button className="icon-btn back" onClick={onBack} aria-label="Geri">
        ‹
      </button>
      {/* preview of the perk on the player's own avatar */}
      <div className="premium-preview">
        <Avatar name={user.name} photoUrl={user.photoUrl} premium size={92} />
      </div>
      <h1 className="premium-title">Batak Premium</h1>
      <p className="muted">Reklamsız, kesintisiz batak keyfi.</p>

      <ul className="perks">
        {PERKS.map(([icon, title, sub]) => (
          <li key={title}>
            <span className="perk-icon">{icon}</span>
            <div>
              <b>{title}</b>
              <div className="muted small">{sub}</div>
            </div>
          </li>
        ))}
      </ul>

      {premium ? (
        <div className="premium-active">✓ Premium üyeliğin aktif. Teşekkürler!</div>
      ) : (
        <>
          <div className="plans">
            <button className={`plan ${plan === 'yearly' ? 'plan--on' : ''}`} onClick={() => setPlan('yearly')}>
              <span className="plan-badge">En avantajlı</span>
              <span className="plan-name">Yıllık</span>
              <span className="plan-price">{prices.yearly}</span>
              <span className="muted small">yılda bir ödeme</span>
            </button>
            <button className={`plan ${plan === 'monthly' ? 'plan--on' : ''}`} onClick={() => setPlan('monthly')}>
              <span className="plan-name">Aylık</span>
              <span className="plan-price">{prices.monthly}</span>
              <span className="muted small">her ay yenilenir</span>
            </button>
          </div>
          <button
            className="btn btn--gold wide btn--xl"
            disabled={busy}
            onClick={() => run(() => Premium.purchase(plan), 'Premium aktif! 🎉', 'Satın alma iptal edildi.')}
          >
            {busy ? 'Lütfen bekleyin…' : 'Premium’a Geç'}
          </button>
          <button
            className="link"
            disabled={busy}
            onClick={() => run(() => Premium.restore(), 'Satın alımın geri yüklendi.', 'Aktif abonelik bulunamadı.')}
          >
            Satın alımları geri yükle
          </button>
        </>
      )}
      {msg && <div className="toast">{msg}</div>}
      <p className="legal">
        Abonelik, dönem bitiminden en az 24 saat önce iptal edilmezse otomatik yenilenir. Ödeme App Store / Google Play
        hesabından alınır; aboneliği hesap ayarlarından yönetebilirsin.
      </p>
    </div>
  );
}
