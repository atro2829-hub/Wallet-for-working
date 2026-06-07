import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fahednet.wallet',
  appName: 'محفظة الجنوب',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#E60000',
      showSpinner: false,
    }
  },
  android: {
    backgroundColor: '#E60000',
    allowMixedContent: true,
  }
};

export default config;
