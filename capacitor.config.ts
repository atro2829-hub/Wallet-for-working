import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qtbm.south',
  appName: 'محفظة الجنوب',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#E60000',
      showSpinner: false,
      fadeOutDuration: 300,
    }
  },
  android: {
    backgroundColor: '#E60000',
    allowMixedContent: true,
  }
};

export default config;
