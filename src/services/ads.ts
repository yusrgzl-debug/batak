import { Capacitor } from '@capacitor/core';
import { MONETIZATION } from './config';
import { Premium } from './premium';

const native = Capacitor.isNativePlatform();
let initialized = false;
let gamesSinceAd = 0;

async function admob() {
  return import('@capacitor-community/admob');
}

const units = () => MONETIZATION.ADMOB[Capacitor.getPlatform() as 'ios' | 'android'];

export const adsActive = () => MONETIZATION.ADS_ENABLED && !Premium.isPremium;

export const Ads = {
  async init() {
    if (!native || !MONETIZATION.ADS_ENABLED || initialized) return;
    const { AdMob } = await admob();
    await AdMob.initialize({ initializeForTesting: MONETIZATION.ADMOB.testing });
    initialized = true;
    // Premium bought mid-session → drop the banner immediately.
    Premium.subscribe((p) => p && void Ads.hideBanner());
  },

  async showBanner() {
    if (!native || !adsActive() || !initialized) return;
    const { AdMob, BannerAdPosition, BannerAdSize } = await admob();
    await AdMob.showBanner({
      adId: units().banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      isTesting: MONETIZATION.ADMOB.testing,
    });
  },

  async hideBanner() {
    if (!native || !initialized) return;
    const { AdMob } = await admob();
    await AdMob.removeBanner().catch(() => undefined);
  },

  /** Call when a game finishes; shows an interstitial every N games. */
  async onGameFinished() {
    if (!adsActive()) return;
    gamesSinceAd++;
    if (gamesSinceAd < MONETIZATION.INTERSTITIAL_EVERY_N_GAMES) return;
    gamesSinceAd = 0;
    if (!native || !initialized) return;
    const { AdMob } = await admob();
    try {
      await AdMob.prepareInterstitial({ adId: units().interstitial, isTesting: MONETIZATION.ADMOB.testing });
      await AdMob.showInterstitial();
    } catch {
      /* no fill — never block the game on ads */
    }
  },
};
