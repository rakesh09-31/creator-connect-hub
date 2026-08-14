import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creatorconnecthub.app',
  appName: 'Creator Connect Hub',
  webDir: '.output/public',
  bundledWebRuntime: false,
  server: {
    url: 'https://creator-connect-hub-eight.vercel.app',
    cleartext: true
  }
};

export default config;
