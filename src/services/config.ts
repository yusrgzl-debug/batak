/**
 * Monetisation switches. Two business models are supported from the same code:
 *  - ADS_ENABLED = true  → free with ads; a Premium subscription (monthly/yearly) removes them.
 *  - ADS_ENABLED = false → completely ad-free; Premium can still be sold for extras or hidden.
 */
/**
 * Demo-only helpers (e.g. the "Test puanı yükle" button). Must be false in store builds:
 * real balances live on the server.
 */
export const DEMO_TOOLS = true;
export const TEST_POINTS = 100_000;

export const MONETIZATION = {
  ADS_ENABLED: true,
  /** Show an interstitial after every N finished games (never mid-game). */
  INTERSTITIAL_EVERY_N_GAMES: 2,
  /** RevenueCat entitlement that unlocks Premium. */
  ENTITLEMENT: 'premium',
  PRODUCTS: {
    monthly: 'batak_premium_monthly',
    yearly: 'batak_premium_yearly',
  },
  /** Shown until real store prices are fetched. */
  FALLBACK_PRICES: { monthly: '₺49,99', yearly: '₺299,99' },
  REVENUECAT_KEYS: {
    ios: 'appl_REPLACE_ME',
    android: 'goog_REPLACE_ME',
  },
  /** Google's official test IDs — replace with your own AdMob units before release. */
  ADMOB: {
    ios: {
      banner: 'ca-app-pub-3940256099942544/2934735716',
      interstitial: 'ca-app-pub-3940256099942544/4411468910',
      rewarded: 'ca-app-pub-3940256099942544/1712485313',
    },
    android: {
      banner: 'ca-app-pub-3940256099942544/6300978111',
      interstitial: 'ca-app-pub-3940256099942544/1033173712',
      rewarded: 'ca-app-pub-3940256099942544/5224354917',
    },
    testing: true,
  },
} as const;

export type Plan = keyof typeof MONETIZATION.PRODUCTS;
