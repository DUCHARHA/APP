import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ducharha.delivery',
  appName: 'DUCHARHA',
  webDir: 'dist/public',
  // Убрана настройка server для локального WebView
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#5B21B6',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      showSpinner: false
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
      style: 'dark',
      backgroundColor: '#5B21B6',
      overlaysWebView: false
    },
    App: {
      androidDeepLinkDomains: [],
      androidCustomScheme: 'ducharha',
      androidPackageName: 'com.ducharha.delivery'
    }
  }
};

export default config;
