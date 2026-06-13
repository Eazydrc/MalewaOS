# Guide de mise en ligne — Elengi

Stack choisie : **Vercel** (frontend `app/`) + **Railway** (API `api/` + PostgreSQL + Redis).

Le code est prêt (build vérifié, scripts Prisma configurés, configs Vercel/Railway ajoutées,
`.gitignore` en place). Il reste les étapes ci-dessous, à faire toi-même car elles touchent
tes comptes et tes secrets.

---

## 0. Avant de commencer — sécurité (voir AVANT_MISE_EN_PROD.md)

- [ ] Régénérer `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET` : `openssl rand -hex 32`
- [ ] Régénérer le `GOOGLE_CLIENT_SECRET` sur https://console.cloud.google.com
- [ ] Préparer un compte SMTP transactionnel (Resend, SendGrid…)
- [ ] **Ne jamais committer `api/.env` ou `app/.env`** — ils sont dans `.gitignore`

---

## 1. Pousser le code sur GitHub

```bash
cd "D:\Taff\Claude\Nouveau dossier\MalewaOS"
git add .
git commit -m "Initial commit — prêt pour déploiement"
```

Crée un repo vide sur https://github.com/new (ex: `elengi`), puis :

```bash
git remote add origin https://github.com/<ton-compte>/elengi.git
git branch -M main
git push -u origin main
```

---

## 2. Backend — Railway (API + PostgreSQL + Redis)

1. Va sur https://railway.app → **New Project** → **Deploy from GitHub repo** → sélectionne `elengi`.
2. Railway crée un service. Dans ses **Settings** :
   - **Root Directory** : `api`
   - Railway détecte Node automatiquement (Nixpacks) et utilisera `npm run build` / `npm run start:prod`
     (déjà configurés pour lancer `prisma generate`, `prisma migrate deploy` puis le serveur).
3. **+ New → Database → PostgreSQL** dans le même projet. Railway génère `DATABASE_URL` automatiquement
   — copie-la dans les variables du service API (`DATABASE_URL` → référence la variable Postgres).
4. **+ New → Database → Redis** de même, pour `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD`.
5. Dans **Variables** du service API, ajoute toutes les clés de `api/.env.example` avec tes vraies valeurs
   (secrets régénérés à l'étape 0, identifiants SMTP, CinetPay, VAPID, Google OAuth…).
   - `NODE_ENV=production`
   - `PORT` : laisse vide, Railway l'injecte automatiquement (le code lit `process.env.PORT`)
   - `FRONTEND_URL` : à compléter après l'étape 3 (URL Vercel)
   - `BACKEND_URL` / `GOOGLE_CALLBACK_URL` : à compléter avec l'URL publique Railway (étape 6)
6. Génère un domaine public : **Settings → Networking → Generate Domain**. Note cette URL
   (ex: `https://elengi-api.up.railway.app`) — c'est ton `BACKEND_URL`.

---

## 3. Frontend — Vercel

1. Va sur https://vercel.com → **Add New → Project** → importe le même repo GitHub.
2. **Root Directory** : `app`
3. Vercel détecte Vite (build déjà configuré via `app/vercel.json` : `npm run build`, sortie `dist`).
4. **Environment Variables** :
   - `VITE_API_URL` = `https://elengi-api.up.railway.app/api/v1` (URL Railway de l'étape 2.6)
5. Déploie. Note l'URL Vercel (ex: `https://elengi.vercel.app`) — c'est ton `FRONTEND_URL`.

---

## 4. Reboucler les URLs

Retourne sur Railway → Variables du service API :
- `FRONTEND_URL=https://elengi.vercel.app` (doit être en HTTPS — vérifié par le code)
- `GOOGLE_CALLBACK_URL=https://elengi-api.up.railway.app/api/v1/auth/google/callback`
- `BACKEND_URL=https://elengi-api.up.railway.app`

Met aussi à jour l'URI de redirection autorisée dans Google Cloud Console (OAuth credentials)
avec la même `GOOGLE_CALLBACK_URL`.

Railway redéploie automatiquement après changement de variables.

---

## 5. Vérifications post-déploiement

- [ ] `https://elengi-api.up.railway.app/api/v1` répond (pas d'erreur 500)
- [ ] Login / register fonctionne depuis `https://elengi.vercel.app`
- [ ] Cookies `access_token`/`refresh_token` posés (vérifier `Secure` + cross-site en HTTPS)
- [ ] Flux Google OAuth complet
- [ ] Page publique `/r/:restaurantId` accessible sans auth
- [ ] Notifications push (VAPID) si pack DOMINATION testé

---

## ⚠️ Point d'attention — uploads de fichiers

`api/uploads/` est stocké sur le disque local du conteneur. Sur Railway, le système de fichiers
n'est **pas persistant** entre redéploiements : les images uploadées (logos, menus, galeries)
seront perdues à chaque déploiement.

Solution recommandée avant un usage en production réel : brancher un stockage objet
(Cloudflare R2, Backblaze B2, ou Railway Volumes) pour `UploadModule`. À traiter séparément
si tu veux que je le fasse.
