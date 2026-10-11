import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Auth, Provider, User } from '../../services/auth';
import { Premium } from '../../services/premium';
import { Prefs, Theme } from '../storage';
import { Modal } from './GameScreen';
import { ProviderIcon } from './LoginScreen';

export function RulesScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="page">
      <button className="icon-btn back" onClick={onBack} aria-label="Geri">
        ‹
      </button>
      <h1>Nasıl Oynanır?</h1>
      <section>
        <h3>Genel</h3>
        <p>52 kart 4 oyuncuya 13’er dağıtılır (Gömmeli’de 3 oyuncuya 16’şar). Her elde en büyük kartı atan eli alır. Koz, diğer tüm renkleri keser.</p>
      </section>
      <section>
        <h3>Kurallar</h3>
        <ul>
          <li>Yerdeki rengi atmak zorunludur; elinde varsa yerdekinden büyük kart atmalısın.</li>
          <li>O renk yoksa koz atmak zorunludur; yerde koz varsa daha büyüğünü atmalısın (Koz Çıkmalı kuralı).</li>
          <li>Ne renk ne koz varsa istediğin kartı atabilirsin.</li>
          <li>Koz açılmadan kozla oyuna başlanamaz (elinde sadece koz yoksa).</li>
        </ul>
      </section>
      <section>
        <h3>İhaleli Batak</h3>
        <p>
          Oyuncular sırayla kaç el alacaklarını söyler (en az 5). En yüksek ihaleyi veren kozu seçer ve ilk kartı atar.
          İhaleyi tutturursa aldığı el kadar puan alır, tutturamazsa ihale kadar puan kaybeder. Diğer oyuncular aldıkları el
          kadar puan alır; hiç el alamayan ihale kadar puan kaybeder.
        </p>
      </section>
      <section>
        <h3>Eşli Batak</h3>
        <p>Karşılıklı oturanlar takımdır. İhaleyi alan takım, iki oyuncunun aldığı ellerin toplamıyla ihaleyi tutturmalıdır.</p>
      </section>
      <section>
        <h3>Gömmeli Batak (3 kişi)</h3>
        <p>
          3 oyuncuya 16’şar kart dağıtılır, kalan 4 kart kapalı olarak yere konur. İhale en az 7’den başlar. İhaleyi alan
          yerdeki 4 kartı eline alır, istemediği 4 kartı kapalı olarak gömer, sonra kozu seçip ilk kartı atar. Gömülen
          kartlar oyuna girmez; elde 16 el oynanır. Puanlama İhaleli ile aynıdır.
        </p>
      </section>
      <section>
        <h3>Koz Oynama Kuralı</h3>
        <p>
          <b>Koz Çıkmalı:</b> yerdeki renk elinde yoksa koz atmak zorundasın (yerde koz varsa büyüğünü). <b>Serbest:</b> renk
          yoksa istediğin kartı atabilirsin.
        </p>
      </section>
      <section>
        <h3>Koz Maça</h3>
        <p>Koz her zaman maçadır. Herkes kaç el alacağını söyler; söylediğini tutturursan aldığın el kadar, tutturamazsan söz kadar eksi puan.</p>
      </section>
    </div>
  );
}

export function SettingsScreen({
  prefs,
  user,
  premium,
  onChange,
  onBack,
}: {
  prefs: Prefs;
  user: User;
  premium: boolean;
  onChange: (p: Prefs) => void;
  onBack: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const toggle = (key: 'sound' | 'cardHelper' | 'roundSummary', label: string, help: string) => (
    <label className="field field--row">
      <span>
        {label}
        <small className="muted">{help}</small>
      </span>
      <input type="checkbox" checked={prefs[key]} onChange={(e) => onChange({ ...prefs, [key]: e.target.checked })} />
    </label>
  );
  const link = async (p: Exclude<Provider, 'guest'>) => {
    try {
      await Auth.link(p);
      setMsg('Hesabın bağlandı.');
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  return (
    <div className="page">
      <button className="icon-btn back" onClick={onBack} aria-label="Geri">
        ‹
      </button>
      <h1>Ayarlar</h1>
      {toggle('sound', 'Ses Efekti', '')}
      {toggle('roundSummary', 'El Sonu Yaz Boz', 'Her elin sonunda puan tablosunu göster')}
      {toggle('cardHelper', 'Kart Gösterici', 'Atabileceğin kartları vurgula')}
      <div className="field">
        <span>Arka Plan</span>
        <div className="seg seg--full">
          {(Object.keys(THEMES) as Theme[]).map((t) => (
            <button key={t} className={`seg-btn ${prefs.theme === t ? 'seg-btn--on' : ''}`} onClick={() => onChange({ ...prefs, theme: t })}>
              {THEMES[t]}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Oyun Hızı</span>
        <div className="seg seg--full">
          {(['slow', 'normal', 'fast'] as const).map((sp) => (
            <button key={sp} className={`seg-btn ${prefs.speed === sp ? 'seg-btn--on' : ''}`} onClick={() => onChange({ ...prefs, speed: sp })}>
              {{ slow: 'Yavaş', normal: 'Normal', fast: 'Hızlı' }[sp]}
            </button>
          ))}
        </div>
      </div>

      <h3 className="section-title">Hesap</h3>
      <div className="account">
        <ProviderIcon p={user.provider} />
        <div>
          <b>{user.name}</b>
          <div className="muted small">{PROVIDER_LABEL[user.provider]}</div>
        </div>
      </div>
      {user.provider === 'guest' && (
        <div className="field">
          <span>
            Hesabı Bağla
            <small className="muted">İlerlemen kaybolmasın diye misafir hesabını bağla</small>
          </span>
          <div className="link-row">
            {(['google', 'facebook', 'apple'] as const).map((p) => (
              <button key={p} className={`login-btn login-btn--${p} login-btn--icon`} onClick={() => link(p)} aria-label={PROVIDER_LABEL[p]}>
                <ProviderIcon p={p} />
              </button>
            ))}
          </div>
        </div>
      )}
      {msg && <div className="toast">{msg}</div>}
      <div className="row">
        <button className="btn btn--ghost" onClick={() => setConfirmDelete(true)}>
          Hesabımı Sil
        </button>
        <button className="btn btn--ghost" onClick={() => void Auth.signOut()}>
          Oturumu Kapat
        </button>
      </div>

      {import.meta.env.DEV && premium && (
        <button className="link" onClick={() => Premium.resetWeb()}>
          (Geliştirici) Premium’u sıfırla
        </button>
      )}

      <AnimatePresence>
        {confirmDelete && (
          <Modal onClose={() => setConfirmDelete(false)}>
            <h2>Hesabın silinsin mi?</h2>
            <p className="muted">Hesabın ve istatistiklerin kalıcı olarak silinir. Premium aboneliğini mağaza hesabından ayrıca iptal etmelisin.</p>
            <div className="row">
              <button className="btn btn--ghost" onClick={() => setConfirmDelete(false)}>
                Vazgeç
              </button>
              <button className="btn btn--danger" onClick={() => void Auth.deleteAccount()}>
                Sil
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

const THEMES: Record<Theme, string> = { yesil: 'Yeşil Çuha', mavi: 'Gece Mavisi', bordo: 'Bordo' };
const PROVIDER_LABEL: Record<Provider, string> = {
  google: 'Google hesabı',
  apple: 'Apple hesabı',
  facebook: 'Facebook hesabı',
  guest: 'Misafir hesabı',
};
