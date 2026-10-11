import { Capacitor } from '@capacitor/core';
import { MONETIZATION, Plan } from './config';

type Listener = (premium: boolean) => void;

const WEB_KEY = 'batak.premium';
const native = Capacitor.isNativePlatform();

let premium = false;
let prices: Record<Plan, string> = { ...MONETIZATION.FALLBACK_PRICES };
const listeners = new Set<Listener>();

function set(value: boolean) {
  premium = value;
  listeners.forEach((l) => l(value));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hasEntitlement = (info: any) => Boolean(info?.entitlements?.active?.[MONETIZATION.ENTITLEMENT]);

async function rc() {
  return (await import('@revenuecat/purchases-capacitor')).Purchases;
}

export const Premium = {
  get isPremium() {
    return premium;
  },
  get prices() {
    return prices;
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },

  async init() {
    if (!native) {
      try {
        set(localStorage.getItem(WEB_KEY) === '1');
      } catch {
        set(false);
      }
      return;
    }
    const Purchases = await rc();
    const platform = Capacitor.getPlatform() as 'ios' | 'android';
    await Purchases.configure({ apiKey: MONETIZATION.REVENUECAT_KEYS[platform] });
    await Purchases.addCustomerInfoUpdateListener((info) => set(hasEntitlement(info)));
    const { customerInfo } = await Purchases.getCustomerInfo();
    set(hasEntitlement(customerInfo));
    try {
      const offerings = await Purchases.getOfferings();
      for (const pkg of offerings.current?.availablePackages ?? []) {
        const id = pkg.product.identifier;
        if (id === MONETIZATION.PRODUCTS.monthly) prices = { ...prices, monthly: pkg.product.priceString };
        if (id === MONETIZATION.PRODUCTS.yearly) prices = { ...prices, yearly: pkg.product.priceString };
      }
    } catch {
      /* keep fallback prices */
    }
  },

  /** Returns true if the user is Premium after the flow (false on cancel). */
  async purchase(plan: Plan): Promise<boolean> {
    if (!native) {
      // Web/dev build: simulate the store so the flow can be tested end to end.
      try {
        localStorage.setItem(WEB_KEY, '1');
      } catch {
        /* ignore */
      }
      set(true);
      return true;
    }
    const Purchases = await rc();
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find((p) => p.product.identifier === MONETIZATION.PRODUCTS[plan]);
    if (!pkg) throw new Error('Ürün mağazada bulunamadı');
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      set(hasEntitlement(customerInfo));
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((e as any)?.userCancelled) return false;
      throw e;
    }
    return premium;
  },

  async restore(): Promise<boolean> {
    if (!native) return premium;
    const Purchases = await rc();
    const { customerInfo } = await Purchases.restorePurchases();
    set(hasEntitlement(customerInfo));
    return premium;
  },

  /** Dev helper so the free experience can be checked again on web. */
  resetWeb() {
    if (native) return;
    try {
      localStorage.removeItem(WEB_KEY);
    } catch {
      /* ignore */
    }
    set(false);
  },
};
