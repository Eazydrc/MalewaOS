// CORS partagé entre le serveur HTTP (main.ts) et le serveur WebSocket
// (orders.gateway.ts) — évite la divergence entre les deux politiques.

export function isAllowedOrigin(origin: string | undefined, frontendUrl: string | undefined): boolean {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  if (nodeEnv === 'development') {
    if (!origin) return true;
    if (
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.')
    ) {
      return true;
    }
  }

  // Autoriser tous les sous-domaines Vercel (previews de déploiement)
  if (origin?.match(/^https:\/\/.*\.vercel\.app$/)) return true;

  const allowedOrigins = frontendUrl ? [frontendUrl] : ['http://localhost:5173', 'http://localhost:3001'];
  return allowedOrigins.includes(origin ?? '');
}

export function corsOriginCallback(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
  if (isAllowedOrigin(origin, process.env.FRONTEND_URL)) return callback(null, true);
  callback(new Error(`CORS bloqué pour l'origine : ${origin}`));
}
