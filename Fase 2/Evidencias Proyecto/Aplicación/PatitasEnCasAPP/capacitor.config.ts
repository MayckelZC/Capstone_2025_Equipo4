import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mayckel.patitasencasapp', // Cambiado para ser único
  appName: 'PatitasEnCasAPP',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    allowNavigation: [
      'identitytoolkit.googleapis.com',
      'securetoken.googleapis.com',
      'firestore.googleapis.com',
      'firebasestorage.googleapis.com'
    ]
  }
};

export default config;
