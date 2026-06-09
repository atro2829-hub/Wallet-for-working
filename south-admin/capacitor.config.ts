import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qtbm.south.admin',
  appName: 'محفظة الجنوب - الإدارة',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#1A0A2E',
      showSpinner: false,
    },
  },
  android: {
    backgroundColor: '#1A0A2E',
    allowMixedContent: true,
  },
};

export default config;
