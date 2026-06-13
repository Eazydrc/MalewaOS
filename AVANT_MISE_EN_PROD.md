# ✅ Checklist avant mise en production

## 🔴 Sécurité — À faire AVANT de déployer

### 1. Révoquer et remplacer le Google OAuth Client Secret
- Aller sur https://console.cloud.google.com
- APIs & Services → Credentials → OAuth 2.0 Client IDs
- Régénérer le Client Secret
- Mettre à jour `GOOGLE_CLIENT_SECRET` dans les variables d'environnement du serveur
- **Ne jamais mettre le vrai secret dans un fichier `.env` commité**

### 2. Secrets JWT en production
- Générer de nouveaux secrets avec `openssl rand -hex 32`
- Les stocker dans les variables d'environnement du serveur (pas dans `.env`)

### 3. Variables d'environnement serveur
- `NODE_ENV=production`
- `FRONTEND_URL=https://ton-domaine.cd` (HTTPS obligatoire)
- Redis avec mot de passe en production
- SMTP avec un vrai compte transactionnel (SendGrid, Resend, etc.)

### 4. Base de données
- Changer le mot de passe PostgreSQL par défaut (`postgres:postgres`)
- Activer SSL sur la connexion DB (`?sslmode=require`)
- Mettre en place des backups automatiques

### 5. Throttler Redis
- Configurer `@nestjs-throttler-storage-redis` pour que le rate limiting
  fonctionne avec plusieurs instances du serveur

### 6. HTTPS
- Certificat SSL obligatoire (Let's Encrypt)
- Redirection HTTP → HTTPS

---

## 📋 Rappel fonctionnel
- Tester le flux complet OAuth Google avec le nouveau Client Secret
- Vérifier que les cookies `Secure` fonctionnent bien en HTTPS
