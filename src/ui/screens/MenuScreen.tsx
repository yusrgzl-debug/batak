import { motion } from 'framer-motion';
import { ECONOMY, Wallet, adsLeft, canClaimDaily } from '../../engine/economy';
import { User } from '../../services/auth';
import appIcon from '../../assets/app-icon.png';
import { Avatar } from '../components/Avatar';
import { pt } from '../format';
import { ProviderIcon } from './LoginScreen';

interface Props {
  user: User;
  wallet: Wallet;
  premium: boolean;
  /** true while a rewarded ad is playing */
  watchingAd: boolean;
  onClaimDaily: () => void;
  onWatchAd: () => void;
  onNavigate: (to: 'rooms' | 'create' | 'leaderboard' | 'friends' | 'practice' | 'premium' | 'settings' | 'rules') => void;
}

export function MenuScreen({ user, wallet, premium, watchingAd, onClaimDaily, onWatchAd, onNavigate }: Props) {
  const daily = canClaimDaily(wallet);
  const ads = adsLeft(wallet);
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
            <span className="points">
              <span className="pt-coin">Pt</span> {pt(wallet.points)}
            </span>
          </div>
        </div>
        <button className="icon-btn" onClick={() => onNavigate('settings')} aria-label="Ayarlar">
          ⚙
        </button>
      </div>

      <div className="home-logo">
        <img src={appIcon} alt="" />
        <h1 className="logo logo--small">BATAK</h1>
      </div>

      {daily && (
        <motion.button className="daily" onClick={onClaimDaily} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
          <span className="daily-gift">🎁</span>
          <span>
            <b>Günlük ödülün hazır!</b>
            <small>Her gün giriş yap, puan topla</small>
          </span>
          <span className="daily-amount">+{pt(ECONOMY.DAILY_BONUS)}</span>
        </motion.button>
      )}

      <div className="home-grid">
        <button className="tile tile--primary" onClick={() => onNavigate('rooms')}>
          <span className="tile-icon">🔍</span>
          <b>Oda Bul</b>
          <small>Açık masalara katıl</small>
        </button>
        <button className="tile tile--primary" onClick={() => onNavigate('create')}>
          <span className="tile-icon">➕</span>
          <b>Oda Kur</b>
          <small>Kendi masanı aç</small>
        </button>
        <button className="tile" onClick={() => onNavigate('leaderboard')}>
          <span className="tile-icon">🏆</span>
          <b>Lider Tablosu</b>
        </button>
        <button className="tile" onClick={() => onNavigate('friends')}>
          <span className="tile-icon">👥</span>
          <b>Arkadaşlar</b>
        </button>
        <button className="tile tile--wide" onClick={() => onNavigate('practice')}>
          <span className="tile-icon">🤖</span>
          <b>Botlarla Pratik</b>
          <small>Puan harcamadan oyna</small>
        </button>
      </div>

      <button className="ad-reward" disabled={ads === 0 || watchingAd} onClick={onWatchAd}>
        🎬 {watchingAd ? 'Reklam oynatılıyor…' : ads > 0 ? `Reklam izle, +${pt(ECONOMY.AD_REWARD)} Pt kazan` : 'Bugünkü reklam ödülleri bitti'}
        <span className="ad-reward-left">
          {ads}/{ECONOMY.AD_REWARDS_PER_DAY}
        </span>
      </button>

      {premium ? (
        <span className="premium-tag">♛ Premium</span>
      ) : (
        <button className="premium-btn" onClick={() => onNavigate('premium')}>
          ♛ Reklamsız Oyna
        </button>
      )}

      <button className="link" onClick={() => onNavigate('rules')}>
        Nasıl oynanır?
      </button>
    </div>
  );
}
