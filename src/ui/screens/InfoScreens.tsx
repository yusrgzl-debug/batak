import { Premium } from '../../services/premium';
import { Prefs } from '../storage';

export function RulesScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="page">
      <button className="icon-btn back" onClick={onBack} aria-label="Geri">
        ‹
      </button>
      <h1>Nasıl Oynanır?</h1>
      <section>
        <h3>Genel</h3>
        <p>52 kart 4 oyuncuya 13’er dağıtılır. Her elde en büyük kartı atan eli alır. Koz, diğer tüm renkleri keser.</p>
      </section>
      <section>
        <h3>Kurallar</h3>
        <ul>
          <li>Yerdeki rengi atmak zorunludur; elinde varsa yerdekinden büyük kart atmalısın.</li>
          <li>O renk yoksa koz atmak zorunludur; yerde koz varsa daha büyüğünü atmalısın.</li>
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
        <h3>Koz Maça</h3>
        <p>Koz her zaman maçadır. Herkes kaç el alacağını söyler; söylediğini tutturursan aldığın el kadar, tutturamazsan söz kadar eksi puan.</p>
      </section>
    </div>
  );
}

export function SettingsScreen({
  prefs,
  premium,
  onChange,
  onBack,
}: {
  prefs: Prefs;
  premium: boolean;
  onChange: (p: Prefs) => void;
  onBack: () => void;
}) {
  return (
    <div className="page">
      <button className="icon-btn back" onClick={onBack} aria-label="Geri">
        ‹
      </button>
      <h1>Ayarlar</h1>
      <label className="field">
        <span>Oyuncu adı</span>
        <input value={prefs.playerName} maxLength={12} onChange={(e) => onChange({ ...prefs, playerName: e.target.value })} />
      </label>
      <label className="field field--row">
        <span>Ses efektleri</span>
        <input type="checkbox" checked={prefs.sound} onChange={(e) => onChange({ ...prefs, sound: e.target.checked })} />
      </label>
      <div className="field">
        <span>Oyun hızı</span>
        <div className="seg">
          {(['slow', 'normal', 'fast'] as const).map((sp) => (
            <button key={sp} className={`seg-btn ${prefs.speed === sp ? 'seg-btn--on' : ''}`} onClick={() => onChange({ ...prefs, speed: sp })}>
              {{ slow: 'Yavaş', normal: 'Normal', fast: 'Hızlı' }[sp]}
            </button>
          ))}
        </div>
      </div>
      {import.meta.env.DEV && premium && (
        <button className="link" onClick={() => Premium.resetWeb()}>
          (Geliştirici) Premium’u sıfırla
        </button>
      )}
    </div>
  );
}
