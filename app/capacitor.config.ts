import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cd.elengi.app',
  appName: 'Elengi',
  webDir: 'dist',
  server: {
    // En dev : pointe vers le PC sur le réseau local
    // Commente cette ligne pour la production (bundle embarqué)
    url: 'http://192.168.11.111:4001',
    cleartext: true, // autorise HTTP (non-HTTPS) sur Android
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
