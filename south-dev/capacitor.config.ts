import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qtbm.south.dev',
  appName: 'مركز النسخ',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#1A0A2E',
      showSpinner: false,
      fadeOutDuration: 300,
    },
  },
  android: {
    backgroundColor: '#1A0A2E',
    allowMixedContent: true,
  },
};

export default config;
