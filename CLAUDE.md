# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Elengi** — restaurant reservation and loyalty platform for Kinshasa, DRC.
Two independent workspaces: `api/` (NestJS backend) and `app/` (React frontend).

---

## Commands

### API (`api/`)
```bash
npm run start:dev      # Dev server hot reload (port 3001)
npm run build          # Compile TypeScript → dist/
npm run start:prod     # Run compiled build

# Prisma
npx prisma generate              # Regenerate client after schema changes
npx prisma migrate dev --name X  # Create migration
npx prisma db execute --stdin    # Raw SQL (use when DLL locked on Windows)

# Windows — DLL lock fix
wmic process where "name='node.exe'" delete
sleep 2 && npx prisma generate
```

### App (`app/`)
```bash
npm run dev      # Vite dev server (port 4000, shifts if busy)
npm run build    # TypeScript check + Vite build → dist/
```

### Seeds / test data
```bash
cd api
npx ts-node --transpile-only seed-fake.ts    # Fake resto MAMAN (Le Petit Congo)
npx ts-node --transpile-only seed-tiers.ts   # 4 comptes test, un par tier
```

### Test accounts (tous password: `Test1234!`)
| Email | Tier | Restaurant | QR Menu |
|---|---|---|---|
| `maman@test.cd` | MAMAN | Chez Mama Kimia | `/r/test-resto-maman-001` |
| `essentiel@test.cd` | ESSENTIEL | Le Bistro Moderne | `/r/test-resto-essentiel-001` |
| `croissance@test.cd` | CROISSANCE | Pizza & Grill Kinshasa | `/r/test-resto-croissance-001` |
| `domination@test.cd` | DOMINATION | Le Grand Fleuve | `/r/test-resto-domination-001` |
| `client@test.cd` | CLIENT | — (compte client) | Réservations sur les 4 restaurants ci-dessus (statuts variés : PENDING/CONFIRMED/COMPLETED/CANCELLED/NO_SHOW) |
| `livreur@test.cd` | LIVREUR | — (compte livreur) | Créé manuellement pour tester le matching livraison (`/driver`) |
| `livraison@test.cd` | RESTAURANT | Kin Express Livraison | CROISSANCE, `restaurantType: LIVRAISON` — pas de tables, uniquement livraison (`/restaurant/test-resto-livraison-001`) |

### Required services
- PostgreSQL port 5432
- Redis port 6379

### Accès réseau local (test mobile)
- Frontend : `http://192.168.11.111:4000`
- API : `http://192.168.11.111:3001/api/v1`
- VITE_API_URL dans `app/.env` pointe déjà sur 192.168.11.111
- CORS autorise toutes origines 192.168.x.x et 10.x.x.x en dev

---

## Architecture

### API — NestJS + Prisma + Redis

**Base URL:** `http://localhost:3001/api/v1`

**Tous les modules :**
| Module | Route prefix | Responsabilité |
|---|---|---|
| `AuthModule` | `/auth` | Register, OTP email, login, MFA admin, Google OAuth, refresh, logout |
| `RestaurantsModule` | `/restaurants` | Listing public, détail, CRUD owner, `GET /restaurants/mine` |
| `ReservationsModule` | `/reservations` | Réservations clients, vue restaurant, statuts, points |
| `WalletModule` | `/wallet` | Points solde, historique, rachat, admin award |
| `OrdersModule` | `/orders` | Commandes en ligne (CROISSANCE+) |
| `MenuModule` | `/menu` | CRUD sections/items, `GET /menu/public/:restaurantId` (no auth) |
| `OffersModule` | `/offers` | CRUD offres (ESSENTIEL+), `GET /offers/public/:restaurantId` (no auth) |
| `ReviewsModule` | `/reviews` | Avis clients, réponse owner (ESSENTIEL+), `GET /reviews/restaurant/:id` (no auth) |
| `TablesModule` | `/tables` | Tables QR (CROISSANCE+), `GET /tables/public/:tableId` (no auth) |
| `StatsModule` | `/stats` | `GET /stats/mine` analytics (CROISSANCE+) |
| `StaffModule` | `/staff` | CRUD personnel (CROISSANCE+) |
| `AdminModule` | `/admin` | Stats globales, gestion users/restaurants, création comptes |

**Auth flow:**
- `CLIENT`/`RESTAURANT` login → JWT cookies immédiatement
- `ADMIN`/`SUPER_ADMIN` login → `{ mfaRequired: true, mfaToken }` → `/auth/mfa/verify` → cookies
- Register → inactive → OTP email → `/auth/verify-email` → active + cookies
- Google OAuth → code Redis 60s → `/auth/google/exchange` → cookies

**JWT:** HttpOnly cookies — `access_token` (15 min) + `refresh_token` (7 jours). Rotation à chaque refresh.

**Subscription tiers gating :**
Import from `src/common/tiers.constants.ts` — ne pas redéfinir localement.
```typescript
import { ESSENTIEL_TIERS, CROISSANCE_TIERS, DOMINATION_TIERS, ORDER_TIERS } from '../common/tiers.constants';
```

### App — React + Vite + TailwindCSS

**Path alias:** `@/` → `src/`

**Routes publiques (no auth) :**
- `/r/:restaurantId` → `PublicMenuPage` — menu QR (MAMAN+)
- `/table/:tableId` → `TableOrderPage` — menu + panier + commande (CROISSANCE+)

**Routes restaurant :**
- `/dashboard` → `RestaurantDashboardPage` — raccourcis + réservations + commandes live
- `/mon-restaurant` → `RestaurantProfilePage` — 9 onglets :
  - Menu, Réservations, Offres, Avis, Tables, Analytics, Personnel, Horaires, Infos

**Hooks dans `src/hooks/` :**
| Hook file | Exports |
|---|---|
| `useMenu.ts` | useMenu, useCreateSection, useUpdateSection, useDeleteSection, useCreateItem, useUpdateItem, useToggleItem, useDeleteItem |
| `useOffers.ts` | useMyOffers, usePublicOffers, useCreateOffer, useUpdateOffer, useDeleteOffer |
| `useReviews.ts` | useMyReviews, usePublicReviews, useCreateReview, useReplyReview |
| `useTables.ts` | useMyTables, useCreateTable, useDeleteTable |
| `useStats.ts` | useMyStats |
| `useStaff.ts` | useMyStaff, useCreateStaff, useUpdateStaff, useDeleteStaff |

**Styling:** CSS variables pour theming. Classes custom : `card`, `text-text`, `text-text-2`, `text-text-3`, `bg-surface`, `bg-surface-2`, `border-border`, `text-accent`. Dark mode via `dark:`.

---

## Packs — État d'avancement

### ✅ MAMAN ($3/mois) — COMPLET
- Profil restaurant (CRUD infos, photo, catégories, gamme prix)
- Menu digital (sections + items, toggle disponibilité)
- Horaires d'ouverture (par jour, ouvert/fermé)
- Réservations clients (confirm/cancel/complete/no-show)
- QR code menu public → `/r/:restaurantId`

### ✅ ESSENTIEL ($10/mois) — COMPLET
Tout MAMAN +
- Badges plats : 🔥 Vente chaude, ⚡ Dernières unités
- Prix promotionnel sur les plats (promoPrice)
- Offres & promotions (PROMO / POINTS / FLASH) avec expiration et maxUses
- Répondre aux avis clients
- QR menu affiche les offres actives

### ✅ CROISSANCE ($25/mois) — COMPLET
Tout ESSENTIEL +
- Commandes en ligne (`/orders`) avec statuts PENDING→ACCEPTED→PREPARING→READY→DELIVERED
- Tables QR (`/tables`) — QR par table, client commande depuis la table
- Analytics (`/stats/mine`) — KPIs semaine/mois, graphique revenus 7j, top plats, statuts
- Gestion personnel (`/staff`) — CRUD serveurs/cuisiniers/managers/caissiers

### ✅ DOMINATION ($45/mois) — COMPLET
Tout CROISSANCE +
- **Analytics avancés** — comparaisons périodes, taux conversion, heures de pointe, graphe 14j (`GET /stats/mine/advanced`)
- **Personnel complet** — comptes staff avec login (`POST /staff/:id/login`, `DELETE /staff/:id/login`), rôle STAFF isolé, `/staff` dashboard
- **Design personnalisé** — couleurs/logo custom par restaurant (`primaryColor`, `accentColor`, `customLogoUrl`) appliqués sur page publique
- **Notifications push** — VAPID web-push, service worker `app/public/sw.js`, `NotificationsModule`, alertes réservations/commandes en temps réel

---

## Modèles Prisma (résumé)

```
User            — CLIENT / RESTAURANT / ADMIN / SUPER_ADMIN
Restaurant      — ownerId, subscription (MAMAN/ESSENTIEL/CROISSANCE/DOMINATION)
Reservation     — userId, restaurantId, date, partySize, status
Order           — userId, restaurantId, tableId?, status, totalCents
OrderItem       — orderId, menuItemId, name, priceUsdCents, quantity
Menu            — restaurantId
MenuSection     — menuId, title, order
MenuItem        — sectionId, name, priceUsdCents, promoPrice?, isHot, isLastUnits
Offer           — restaurantId, type (PROMO/POINTS/FLASH), discountPct?, pointsCost?, expiresAt
Review          — userId, restaurantId, rating, comment?, ownerReply?, repliedAt?
RestaurantTable — restaurantId, number, label?
StaffMember     — restaurantId, firstName, lastName, role, phone?, isActive
RefreshToken    — userId, token, expiresAt
PointTransaction — userId, restaurantId?, amount, type, description
```

---

## Conventions

**Nouvel endpoint API :**
1. Service → Controller → DTO (class-validator complet avec @IsEnum sur les enums)
2. Guard : `JwtAuthGuard` par route individuelle si endpoint mixte public/privé
3. Jamais de `select` manuel sauf si `password` ou tokens doivent être exclus

**Nouvelle page frontend :**
1. `src/pages/NomPage.tsx`
2. Hook dans `src/hooks/useNom.ts`
3. Route dans `App.tsx` avec AuthGuard ou GuestGuard

**Schema change (Windows) :**
```bash
npx prisma db execute --stdin  # SQL direct — évite les migrations bloquées
# Éditer schema.prisma manuellement
wmic process where "name='node.exe'" delete
sleep 2 && npx prisma generate
```

**Points:** 1 pt = 50 FC. Min rachat : 20 pts = 1 000 FC. Attribution idempotente à la complétion réservation.

---

## Environment

`api/.env` — variables requises :
```
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
REDIS_HOST
MAIL_HOST / MAIL_USER / MAIL_PASS
FRONTEND_URL
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
```

`app/.env` :
```
VITE_API_URL=http://192.168.11.111:3001/api/v1   # réseau local
# ou
VITE_API_URL=http://localhost:3001/api/v1         # localhost seulement
```
