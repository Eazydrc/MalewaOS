// URL API selon l'environnement
// En dev  : pointe sur ton PC local (même WiFi)
// En prod : pointe sur Railway

const DEV_API_URL  = 'http://192.168.11.101:3001/api/v1';
const PROD_API_URL = 'https://malewaos-production.up.railway.app/api/v1';

// __DEV__ est une variable globale React Native (true en dev, false en release)
export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
