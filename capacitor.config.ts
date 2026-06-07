import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fahd.net',
  appName: 'الحبيلين اونلاين',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0A1A3A',
      showSpinner: false,
    }
  },
  android: {
    backgroundColor: '#0A1A3A',
    allowMixedContent: true,
  }
};

export default config;
