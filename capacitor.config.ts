import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.omnicraft.app',
  appName: 'OmniCraft',
  webDir: '.vercel/output/static',
  bundledWebRuntime: false,
  server: {
    url: 'https://creator-connect-hub-eight.vercel.app',
    cleartext: true,
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    backgroundColor: '#09090b',
  },
};

export default config;
