import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ducharkha.delivery',
  appName: 'DUCHARKHA',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP'
    },
    Geolocation: {
      requestPermissions: true,
      androidPermissions: {
        location: 'whenInUse'
      }
    },
    PushNotifications: {
      presentationOptions: ['alert', 'badge', 'sound']
    },
    Haptics: {
      enabled: true
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff',
      overlaysWebView: false
    },
    App: {
      androidDeepLinkDomains: [],
      androidCustomScheme: 'ducharkha',
      androidPackageName: 'com.ducharkha.delivery'
    }
  }
};

export default config;
