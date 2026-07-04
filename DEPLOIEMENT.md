# Guide de déploiement Elengi

## Étape 1 — Déployer l'API sur Railway

1. Va sur **railway.app** → créer un compte (GitHub recommandé)
2. **New Project** → **Deploy from GitHub repo** → sélectionne ce repo
3. Choisis le dossier **`api/`** comme service root
4. Ajoute deux services depuis le dashboard :
   - **Add Service** → **Database** → **PostgreSQL**
   - **Add Service** → **Database** → **Redis**
5. Dans le service API → **Variables** → ajoute toutes les variables du fichier `api/.env.production.example`
   - `DATABASE_URL` → copie depuis le service PostgreSQL Railway
   - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` → copie depuis le service Redis Railway
   - Génère `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET` :
     ```
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```
6. Railway déploie automatiquement → note l'URL : `https://xxx.railway.app`
7. Met à jour `FRONTEND_URL` dans Railway avec l'URL Vercel (après étape 2)

## Étape 2 — Déployer le Web sur Vercel

1. Va sur **vercel.com** → importe le même repo GitHub
2. **Root Directory** → `app/`
3. **Environment Variables** → ajoute :
   ```
   VITE_API_URL = https://xxx.railway.app/api/v1
   ```
4. Deploy → note l'URL : `https://elengi.vercel.app`
5. Retourne dans Railway et mets `FRONTEND_URL=https://elengi.vercel.app`

## Étape 3 — Mettre à jour l'URL dans l'app mobile

Dans `mobile/src/config.ts`, remplace :
```typescript
const PROD_API_URL = 'https://elengi-api.railway.app/api/v1';
```
par la vraie URL Railway.

## Étape 4 — Générer l'APK de production

```powershell
cd mobile/android
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot"
.\gradlew.bat assembleRelease
```

L'APK signé sera dans :
`mobile/android/app/build/outputs/apk/release/app-release.apk`

## Étape 5 — Seed production (super admin)

Après déploiement Railway, dans le terminal Railway :
```bash
npx ts-node --transpile-only seed-superadmin.ts
```

## Checklist finale

- [ ] API Railway accessible : `https://xxx.railway.app/api/v1/health`
- [ ] Web Vercel accessible : `https://elengi.vercel.app`
- [ ] Login fonctionne sur le web
- [ ] APK mobile installé et connecté à l'API prod
- [ ] MFA super admin **réactivé** dans `api/src/auth/auth.service.ts`
