import { Capacitor } from '@capacitor/core';

/** A light tap when the player throws a card (native haptics, or vibration on Android browsers). */
export function tap() {
  if (Capacitor.isNativePlatform()) {
    void import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ImpactStyle.Light })).catch(() => undefined);
  } else {
    navigator.vibrate?.(12);
  }
}
