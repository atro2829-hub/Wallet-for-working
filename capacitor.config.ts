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
