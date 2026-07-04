// URL API selon l'environnement
// En dev  : pointe sur ton PC local (même WiFi)
// En prod : pointe sur Railway

const DEV_API_URL  = 'http://192.168.11.111:3001/api/v1';
const PROD_API_URL = 'https://elengi-api.railway.app/api/v1'; // ← mettre à jour après déploiement Railway

// __DEV__ est une variable globale React Native (true en dev, false en release)
export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
