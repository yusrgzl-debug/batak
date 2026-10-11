import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.batak.premium',
  appName: 'Batak',
  webDir: 'dist',
  ios: { contentInset: 'never' },
  plugins: {
    AdMob: {},
  },
};

export default config;
