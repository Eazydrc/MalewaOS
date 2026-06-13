const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, PageBreak, NumberFormat,
  Header, Footer, PageNumber, TabStopPosition, TabStopType,
  UnderlineType, convertInchesToTwip, ImageRun,
} = require("docx");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "documents", "MalewaOS_Plan_Developpement.docx");

// ── Couleurs ──────────────────────────────────────────────────────────────────
const C_DARK    = "18181B";
const C_ORANGE  = "E85D26";
const C_LIGHT   = "F4F4F5";
const C_BORDER  = "E4E4E7";
const C_WHITE   = "FFFFFF";
const C_TEXT2   = "52525B";
const C_SUCCESS = "16A34A";
const C_BLUE    = "2563EB";

// ── Helpers ───────────────────────────────────────────────────────────────────

function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 120 },
    border: { bottom: { color: C_ORANGE, size: 12, style: BorderStyle.SINGLE } },
    run: { color: C_ORANGE, bold: true, size: 28 },
  });
}

function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 80 },
    run: { color: C_DARK, bold: true, size: 22 },
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 20, color: C_DARK })],
    spacing: { before: 200, after: 60 },
  });
}

function body(text, color = "000000") {
  return new Paragraph({
    children: [new TextRun({ text, size: 18, color })],
    spacing: { before: 40, after: 40 },
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 18, color: C_TEXT2 })],
    bullet: { level },
    spacing: { before: 20, after: 20 },
  });
}

function note(text) {
  return new Paragraph({
    children: [new TextRun({ text: `💡 ${text}`, size: 17, color: C_TEXT2, italics: true })],
    shading: { type: ShadingType.SOLID, color: "FEF3EB" },
    border: { left: { color: C_ORANGE, size: 16, style: BorderStyle.SINGLE } },
    spacing: { before: 80, after: 80 },
    indent: { left: 180 },
  });
}

function sep() {
  return new Paragraph({
    border: { bottom: { color: C_BORDER, size: 6, style: BorderStyle.SINGLE } },
    spacing: { before: 120, after: 120 },
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function tableRow(cells, isHeader = false) {
  return new TableRow({
    tableHeader: isHeader,
    children: cells.map((text, i) =>
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({
            text: String(text),
            bold: isHeader,
            color: isHeader ? C_WHITE : C_TEXT2,
            size: 17,
          })],
          alignment: AlignmentType.LEFT,
        })],
        shading: isHeader
          ? { type: ShadingType.SOLID, color: C_DARK }
          : { type: ShadingType.SOLID, color: "FFFFFF" },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
      })
    ),
  });
}

function makeTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 60, bottom: 60 },
    rows: [
      tableRow(headers, true),
      ...rows.map((r, i) => {
        const row = tableRow(r, false);
        if (i % 2 === 1) {
          row.cells.forEach(cell => {
            cell.options = cell.options || {};
          });
        }
        return row;
      }),
    ],
  });
}

function space(n = 1) {
  return new Paragraph({ text: "", spacing: { after: n * 80 } });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT
// ─────────────────────────────────────────────────────────────────────────────

const doc = new Document({
  title: "MalewaOS — Plan de Développement",
  description: "Document de cadrage complet — v1.0",
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 18 },
      },
      heading1: {
        run: { font: "Calibri", bold: true, size: 28, color: C_ORANGE },
      },
      heading2: {
        run: { font: "Calibri", bold: true, size: 22, color: C_DARK },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1.1),
          right: convertInchesToTwip(1.1),
        },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "MalewaOS", bold: true, color: C_ORANGE, size: 16 }),
              new TextRun({ text: "  |  Plan de Développement — v1.0", color: C_TEXT2, size: 16 }),
            ],
            border: { bottom: { color: C_BORDER, size: 6, style: BorderStyle.SINGLE } },
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "MalewaOS — Document confidentiel — Marché RDC — Mai 2026    Page ", size: 15, color: C_TEXT2 }),
              new TextRun({ children: [PageNumber.CURRENT], size: 15, color: C_TEXT2 }),
            ],
            alignment: AlignmentType.CENTER,
            border: { top: { color: C_BORDER, size: 6, style: BorderStyle.SINGLE } },
          }),
        ],
      }),
    },
    children: [

      // ══════════════════════════════════════════════ PAGE DE TITRE
      new Paragraph({
        children: [
          new TextRun({ text: "MalewaOS", bold: true, size: 72, color: C_ORANGE }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 1400, after: 160 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Plan de Développement Complet", size: 32, color: C_DARK })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Plateforme de réservation & fidélité — Marché RDC", size: 22, color: C_TEXT2, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      makeTable(
        ["Paramètre", "Valeur"],
        [
          ["Nom du produit", "MalewaOS"],
          ["Version", "v1.0"],
          ["Date", "Mai 2026"],
          ["Marché cible", "République Démocratique du Congo (RDC)"],
          ["Devise", "USD (affichage CDF — Franc Congolais)"],
          ["Stack technique", "React (Web responsive) → React Native (Mobile)"],
          ["Statut", "Cadrage — Phase 1 en cours"],
        ]
      ),
      space(2),
      new Paragraph({
        children: [new TextRun({ text: "Document confidentiel — Usage interne uniquement", size: 16, color: C_TEXT2, italics: true })],
        alignment: AlignmentType.CENTER,
      }),
      pageBreak(),

      // ══════════════════════════════════════════════ TABLE DES MATIÈRES
      h1("Table des Matières"),
      body("1. Design Fonctionnel — Besoins & Parcours Utilisateur"),
      body("2. Architecture — Flux, API, Base de données, Auth"),
      body("3. Base de Données — Tables, Relations, Modèles"),
      body("4. Backend — API, Auth, Logique Métier, Sécurité"),
      body("5. Front-End — Interface React (Web responsif → Mobile)"),
      body("6. Connexion Front / Backend — Intégration API"),
      body("7. Tests — Fonctionnels & Vérifications"),
      body("8. Roadmap & Priorités"),
      body("   8.4 Mobile Money — Intégration Paiements RDC (CinetPay)"),
      pageBreak(),

      // ══════════════════════════════════════════════ 1. DESIGN FONCTIONNEL
      h1("1. Design Fonctionnel"),
      h2("1.1 Présentation du Produit"),
      body("MalewaOS est une plateforme SaaS de réservation de restaurants et de fidélisation des clients, conçue spécifiquement pour le marché congolais (RDC). Elle s'adresse à deux types d'utilisateurs :"),
      bullet("Les restaurateurs : gestion des réservations, menu digital, offres promotionnelles"),
      bullet("Les clients : découverte de restaurants, réservation en ligne, accumulation de points"),
      space(),

      h2("1.2 Contexte & Opportunité (RDC)"),
      makeTable(
        ["Segment", "Population", "Revenu moyen/mois", "Cible MalewaOS"],
        [
          ["Extrême pauvreté", "~75%", "< $65", "❌ Hors cible initiale"],
          ["Pauvreté modérée", "~10%", "$65–$150", "⚠️ Secondaire"],
          ["Classe moyenne", "~12%", "$150–$600", "✅ Cible principale"],
          ["Classe aisée / Expats", "~3%", "$600+", "✅ Cible premium"],
        ]
      ),
      space(),
      note("La cible principale est la classe moyenne de Kinshasa (Gombe, Limete, Ngaliema) et Lubumbashi. Environ 2–3 millions de personnes connectées avec smartphone Android."),
      space(),

      h2("1.3 Fonctionnalités — Vue Globale"),
      makeTable(
        ["Module", "Fonctionnalité", "Priorité", "Utilisateur"],
        [
          ["Auth", "Inscription / Connexion / Déconnexion", "🔴 Must", "Client + Resto"],
          ["Auth", "Rafraîchissement automatique de session", "🔴 Must", "Client + Resto"],
          ["Home", "Affichage offres last-minute actives", "🔴 Must", "Client"],
          ["Home", "Liste restaurants populaires", "🔴 Must", "Client"],
          ["Recherche", "Recherche par nom / cuisine / ville", "🔴 Must", "Client"],
          ["Recherche", "Filtres prix, disponibilité, note", "🟠 Important", "Client"],
          ["Restaurant", "Fiche complète + menu par catégorie", "🔴 Must", "Client"],
          ["Restaurant", "Horaires d'ouverture + téléphone", "🔴 Must", "Client"],
          ["Réservation", "Formulaire date + heure + personnes", "🔴 Must", "Client"],
          ["Réservation", "Confirmation WhatsApp", "🔴 Must", "Client"],
          ["Réservation", "Annulation depuis l'app", "🟠 Important", "Client"],
          ["Last-Minute", "Offres avec countdown + places restantes", "🟠 Important", "Client"],
          ["Wallet", "Solde points + historique transactions", "🔴 Must", "Client"],
          ["Wallet", "Valeur en FC et USD", "🔴 Must", "Client"],
          ["Profil", "Modifier infos personnelles", "🟠 Important", "Client"],
          ["Admin Resto", "Gestion menu (CRUD)", "🔴 Must", "Restaurateur"],
          ["Admin Resto", "Voir/gérer réservations reçues", "🔴 Must", "Restaurateur"],
          ["Admin Resto", "Créer offre last-minute", "🟠 Important", "Restaurateur"],
          ["Admin Resto", "Générer QR Code menu", "🔴 Must", "Restaurateur"],
          ["Admin Resto", "Promos plats / prix exceptionnels", "🟠 Important", "Restaurateur"],
          ["Admin Resto", "Analytics basiques", "🟡 Plus tard", "Restaurateur"],
          ["QR Menu", "Scan QR → menu responsive (sans app)", "🔴 Must", "Client (invité)"],
          ["QR Menu", "Commander depuis le QR menu", "🟠 Important", "Client (Croissance+)"],
          ["Publicité", "Mettre en avant un plat / prix spécial", "🟠 Important", "Restaurateur"],
          ["Publicité", "Bannière partenaire externe (ex: Primus)", "🟡 Plus tard", "Super Admin"],
          ["Publicité", "Restaurant sponsorisé dans les résultats", "🟡 Plus tard", "Restaurateur"],
          ["Super Admin", "Gestion globale tous les restaurants", "🔴 Must", "Équipe MalewaOS"],
          ["Super Admin", "Activer/suspendre un restaurant", "🔴 Must", "Équipe MalewaOS"],
          ["Super Admin", "Suivi paiements Mobile Money", "🔴 Must", "Équipe MalewaOS"],
          ["Super Admin", "Statistiques globales plateforme", "🔴 Must", "Équipe MalewaOS"],
          ["Super Admin", "Activer pub externe / codes promo", "🟠 Important", "Équipe MalewaOS"],
          ["Super Admin", "Gérer taux de change USD/CDF", "🔴 Must", "Équipe MalewaOS"],
        ]
      ),
      space(),

      h2("1.4 Parcours Utilisateur — Client"),
      h3("Parcours 1 : Première utilisation"),
      bullet("1. Ouvre l'app → voit la page d'accueil (Home publique)"),
      bullet("2. Parcourt les restaurants disponibles à Kinshasa"),
      bullet("3. Clique sur un restaurant → voit le menu avec prix en FC"),
      bullet("4. Clique sur 'Réserver' → redirigé vers inscription"),
      bullet("5. Crée son compte → reçoit +100 points de bienvenue"),
      bullet("6. Finalise sa réservation → reçoit confirmation WhatsApp"),
      space(),

      h3("Parcours 2 : Client fidèle"),
      bullet("1. Ouvre l'app → déjà connecté (session restaurée)"),
      bullet("2. Voit une offre last-minute : 'Chez Tintin — 3 places, -20%, expire dans 2h'"),
      bullet("3. Réserve en 3 clics"),
      bullet("4. Après le repas → +25 points crédités automatiquement"),
      bullet("5. Consulte son wallet : 340 pts = 17 000 FC potentiels"),
      space(),

      h3("Parcours 3 : Restaurateur"),
      bullet("1. S'inscrit → crée son restaurant (nom, adresse, cuisine, photos)"),
      bullet("2. Ajoute son menu (catégories + plats + prix en FC)"),
      bullet("3. Choisit son tier d'abonnement (Maman $3 / Essentiel $10 / Croissance $25)"),
      bullet("4. Commence à recevoir des réservations"),
      bullet("5. Publie une offre last-minute pour un mardi creux"),
      space(),

      h2("1.5 Système de Points — Règles RDC"),
      makeTable(
        ["Règle", "Valeur", "Explication"],
        [
          ["Gain", "1 pt / 1 000 FC dépensés", "Repas 10 000 FC = 10 points"],
          ["Valeur", "20 pts = 1 000 FC de réduction", "5% de cashback effectif"],
          ["Bonus inscription", "+100 pts", "Valeur : 5 000 FC (~$1.79)"],
          ["Bonus parrainage", "+200 pts", "Valeur : 10 000 FC (~$3.57)"],
          ["Expiration", "24 mois d'inactivité", "Adapté au marché RDC"],
          ["Réseau", "Cross-restaurants Croissance+", "Cumulable partout dans le réseau"],
        ]
      ),
      pageBreak(),

      // ══════════════════════════════════════════════ 2. ARCHITECTURE
      h1("2. Architecture"),
      h2("2.1 Vue Globale du Système"),
      body("MalewaOS utilise une architecture client-serveur découplée :"),
      bullet("Frontend : React.js (Web responsive → futur React Native)"),
      bullet("Backend : NestJS (API REST)"),
      bullet("Base de données : PostgreSQL via Prisma ORM"),
      bullet("Cache & Sessions : Redis"),
      bullet("Infrastructure locale : Docker Compose (dev) → VPS/Railway (prod)"),
      space(),

      h2("2.2 Flux Général"),
      makeTable(
        ["Étape", "Action", "Technologie"],
        [
          ["1", "Utilisateur ouvre l'app (web ou mobile)", "React / Expo"],
          ["2", "App vérifie le token en mémoire (Zustand)", "Zustand store"],
          ["3", "Si absent → lit le SecureStore / localStorage", "SecureStore / localStorage"],
          ["4", "Appelle POST /auth/refresh si refreshToken présent", "NestJS + JWT"],
          ["5", "Toutes les requêtes portent le Bearer token", "fetch() avec Authorization header"],
          ["6", "API valide le token → exécute la logique métier", "NestJS Guards"],
          ["7", "Prisma interroge PostgreSQL", "Prisma ORM"],
          ["8", "Réponse JSON renvoyée au client", "JSON REST"],
        ]
      ),
      space(),

      h2("2.3 Les 3 Applications MalewaOS"),
      makeTable(
        ["App", "Dossier", "Utilisateurs", "Description"],
        [
          ["App Client",      "apps/app",       "Clients",          "Découvrir, réserver, wallet, QR menu"],
          ["App Restaurant",  "apps/dashboard", "Restaurateurs",    "Gérer menu, réservations, promos, QR"],
          ["Super Admin",     "apps/admin",     "Équipe MalewaOS",  "Gérer tous les restaurants, pub, stats"],
        ]
      ),
      space(),
      h2("2.4 Structure du Projet (Monorepo)"),
      body("Organisation pnpm workspaces :"),
      makeTable(
        ["Dossier", "Contenu", "Technologie"],
        [
          ["apps/app",       "App Client — React.js responsive",     "React 18, Vite, TailwindCSS"],
          ["apps/dashboard", "App Restaurant — Dashboard restaurateur", "React 18, Vite, TailwindCSS"],
          ["apps/admin",     "Super Admin — Gestion plateforme",      "React 18, Vite, TailwindCSS"],
          ["apps/api",       "API REST backend partagée",             "NestJS 10, TypeScript"],
          ["apps/mobile (futur)", "React Native (iOS + Android APK)", "Expo SDK 51, NativeWind"],
          ["packages/database", "Prisma schema + migrations + seed",  "Prisma 5, PostgreSQL"],
          ["packages/shared",   "Types TS + Schemas Zod + Constantes", "TypeScript, Zod"],
        ]
      ),
      space(),

      h2("2.4 Stratégie d'Authentification"),
      makeTable(
        ["Token", "Stockage Web", "Stockage Mobile", "Durée"],
        [
          ["Access Token", "Zustand (mémoire)", "Zustand (mémoire)", "15 minutes"],
          ["Refresh Token", "localStorage chiffré", "Expo SecureStore", "7 jours"],
        ]
      ),
      space(),
      note("Sur web, le localStorage est utilisé avec précaution (pas de données sensibles brutes). Sur mobile, Expo SecureStore offre un chiffrement hardware (iOS Keychain / Android Keystore)."),
      space(),

      h2("2.5 Stack Technique Complète"),
      makeTable(
        ["Couche", "Technologie", "Version", "Rôle"],
        [
          ["Frontend Web", "React.js", "18", "Interface responsive Web + Mobile"],
          ["Routing Web", "React Router", "v6", "Navigation SPA"],
          ["Styles", "TailwindCSS", "v3", "Design system flat (zéro gradient)"],
          ["État global", "Zustand", "4.5", "Auth store, UI state"],
          ["Requêtes", "TanStack Query", "v5", "Cache, pagination, mutations"],
          ["Formulaires", "React Hook Form + Zod", "7 / 3.22", "Validation"],
          ["Backend", "NestJS", "10", "API REST modulaire"],
          ["ORM", "Prisma", "5.10", "Schema-first, type-safe"],
          ["Base de données", "PostgreSQL", "16", "Données relationnelles"],
          ["Cache", "Redis", "7", "Rate-limit, sessions"],
          ["Auth", "JWT HS256", "—", "Access + Refresh tokens"],
          ["Build tool", "Vite", "5", "Dev server + bundling ultra-rapide"],
          ["Mobile (futur)", "React Native + Expo", "SDK 51", "APK + iOS depuis code React"],
        ]
      ),
      pageBreak(),

      // ══════════════════════════════════════════════ 3. BASE DE DONNÉES
      h1("3. Base de Données"),
      h2("3.1 Tables Principales"),
      makeTable(
        ["Table", "Description", "Champs clés"],
        [
          ["users", "Comptes utilisateurs (clients + owners)", "id, email, passwordHash, pointsBalance, refreshToken"],
          ["restaurants", "Restaurants enregistrés", "id, slug, name, city, subscriptionTier, heroImage, rating"],
          ["menu_categories", "Catégories du menu", "id, restaurantId, name, sortOrder"],
          ["dishes", "Plats du menu", "id, categoryId, name, priceCents, allergens[], isAvailable"],
          ["opening_hours", "Horaires par jour", "id, restaurantId, dayOfWeek, opensAt, closesAt"],
          ["reservations", "Réservations clients", "id, userId?, restaurantId, reservedFor, partySize, status"],
          ["orders", "Commandes en ligne", "id, userId, restaurantId, totalCents, status"],
          ["order_items", "Lignes de commande", "id, orderId, dishName, priceCents, quantity"],
          ["points_transactions", "Ledger points (INSERT-ONLY)", "id, userId, type, amount, description, createdAt"],
          ["last_minute_offers", "Offres promotionnelles", "id, restaurantId, discount, seatsLeft, endsAt"],
        ]
      ),
      space(),

      h2("3.2 Relations Clés"),
      bullet("User → Reservations : 1 utilisateur peut avoir plusieurs réservations"),
      bullet("User → PointsTransactions : historique complet du ledger"),
      bullet("Restaurant → MenuCategories → Dishes : arbre hiérarchique du menu"),
      bullet("Restaurant → LastMinuteOffers : offres actives du restaurant"),
      bullet("Reservation → PointsTransactions : points crédités après repas complété"),
      space(),

      h2("3.3 Devise & Prix"),
      body("Tous les prix sont stockés en centimes USD (Integer) pour éviter les problèmes de virgule flottante et résister à l'inflation du CDF."),
      makeTable(
        ["Champ", "Type DB", "Exemple", "Affichage"],
        [
          ["priceCents", "Int (centimes USD)", "800", "$8.00 / 22 400 FC"],
          ["totalCents", "Int (centimes USD)", "1500", "$15.00 / 42 000 FC"],
          ["pointsBalance", "Int (points)", "350", "350 pts = 17 500 FC"],
        ]
      ),
      space(),

      h2("3.4 Ledger Points — Architecture Immuable"),
      body("Le solde de points n'est JAMAIS modifié directement. Chaque opération crée une nouvelle ligne INSERT."),
      makeTable(
        ["Type", "Amount", "Déclencheur"],
        [
          ["bonus", "+100", "Inscription"],
          ["earn", "+N", "Réservation complétée (1pt/1000FC)"],
          ["redeem", "-N", "Utilisation d'une réduction"],
          ["expire", "-N", "24 mois d'inactivité (tâche cron)"],
          ["bonus", "+200", "Parrainage validé"],
        ]
      ),
      pageBreak(),

      // ══════════════════════════════════════════════ 4. BACKEND
      h1("4. Backend — API & Authentification"),
      h2("4.1 Architecture NestJS"),
      body("Le backend est organisé en modules indépendants :"),
      makeTable(
        ["Module", "Endpoints", "Description"],
        [
          ["AuthModule", "/auth/*", "register, login, refresh, logout, me"],
          ["RestaurantsModule", "/restaurants/*", "liste, détail, slots, menu, QR"],
          ["ReservationsModule", "/reservations/*", "créer, lister, détail, annuler"],
          ["WalletModule", "/wallet/*", "solde, historique transactions"],
          ["UsersModule", "/users/*", "profil, update, password"],
          ["OffersModule", "/offers/*", "offres last-minute, réserver"],
          ["OrdersModule", "/orders/*", "commande via QR menu (Croissance+)"],
          ["PromotionsModule", "/promotions/*", "promos plats, pub restaurant"],
          ["QrModule", "/qr/:slug", "page menu publique via QR code"],
          ["PaymentsModule", "/payments/*", "abonnements CinetPay + webhook"],
          ["AdminModule", "/admin/*", "Super Admin — gestion globale"],
          ["PrismaModule", "—", "Service DB global (@Global)"],
        ]
      ),
      space(),

      h2("4.2 Endpoints Auth (détail)"),
      makeTable(
        ["Méthode", "URL", "Corps", "Réponse", "Protégé"],
        [
          ["POST", "/auth/register", "email, password, firstName, phone", "{ accessToken, refreshToken }", "Non"],
          ["POST", "/auth/login", "email, password", "{ accessToken, refreshToken }", "Non"],
          ["POST", "/auth/refresh", "{ refreshToken }", "{ accessToken, refreshToken }", "Non"],
          ["POST", "/auth/logout", "{ refreshToken }", "204", "Oui"],
          ["GET", "/auth/me", "—", "UserProfile", "Oui"],
        ]
      ),
      space(),

      h2("4.3 Sécurité"),
      bullet("Passwords : bcrypt rounds=10 (~100ms de hash)"),
      bullet("JWT : HS256, secret 256-bit minimum, access 15min, refresh 7j"),
      bullet("Refresh token rotation : chaque refresh invalide l'ancien (hash en DB)"),
      bullet("Rate limiting : 100 req/min global, 5/min sur /auth/login"),
      bullet("Validation : class-validator (pipes NestJS) + Zod (package shared)"),
      bullet("CORS : origines autorisées listées explicitement"),
      space(),

      h2("4.4 Abonnements Restaurateurs (Prix RDC)"),
      makeTable(
        ["Fonctionnalité", "Maman $3", "Essentiel $10", "Croissance $25", "Domination $45"],
        [
          ["Réservations en ligne",        "✅", "✅", "✅", "✅"],
          ["Menu digital QR (lecture)",    "✅", "✅", "✅", "✅"],
          ["Commande via QR menu",         "❌", "❌", "✅", "✅"],
          ["Offres last-minute",           "❌", "❌", "✅", "✅"],
          ["Réseau Rewards (points)",      "❌", "❌", "✅", "✅"],
          ["Promos plats incluses",        "❌", "1",  "3",  "Illimitées"],
          ["Promos supplémentaires",       "❌", "❌", "$5/promo", "—"],
          ["Pub externe (via SuperAdmin)", "❌", "❌", "✅", "✅"],
          ["Design personnalisé",         "❌", "❌", "Add-on $50+$8/mois", "✅ Inclus"],
          ["Analytics",                   "Basiques", "Basiques", "Avancés", "Avancés"],
          ["Multi-établissements",        "❌", "❌", "❌", "✅"],
          ["API access",                  "❌", "❌", "❌", "✅"],
          ["Support",                     "Email", "Email", "Prioritaire", "Dédié"],
        ]
      ),
      space(),
      h3("Design Personnalisé — Ce que ça inclut"),
      bullet("Couleurs de marque personnalisées sur la fiche restaurant"),
      bullet("Logo du restaurant affiché en grand sur la page"),
      bullet("Bannière personnalisée en haut de la fiche"),
      bullet("Option future : sous-domaine personnalisé (ex: cheztintin.malewaos.com)"),
      note("En RDC, un restaurant avec son identité visuelle propre dans l'app est perçu comme une marque sérieuse et professionnelle. C'est un argument de vente fort pour justifier le tier Domination, et une source de revenu additionnel pour les restaurants Croissance qui souhaitent se démarquer."),
      space(),
      pageBreak(),

      // ══════════════════════════════════════════════ 5. FRONT-END
      h1("5. Front-End — Interface React"),
      h2("5.1 Philosophie Design"),
      bullet("Design plat (ZÉRO gradient) — inspiré de Linear, Stripe, Notion"),
      bullet("Responsive mobile-first : s'adapte parfaitement sur smartphone Android"),
      bullet("Couleur accent : #E85D26 (orange) — utilisée avec parcimonie"),
      bullet("Typographie : système natif (pas de Google Fonts pour la performance)"),
      bullet("Temps de chargement cible : < 2s sur connexion 3G (réseau RDC)"),
      space(),

      h2("5.2 Palette de Couleurs"),
      makeTable(
        ["Token", "Hex", "Usage"],
        [
          ["bg", "#FFFFFF", "Fond principal"],
          ["surface", "#FAFAFA", "Cartes, modals"],
          ["surface-2", "#F4F4F5", "Inputs désactivés, tags"],
          ["border", "#E4E4E7", "Bordures légères"],
          ["text", "#0A0A0A", "Titre principal"],
          ["text-2", "#52525B", "Corps de texte"],
          ["text-3", "#A1A1AA", "Placeholder, légende"],
          ["accent", "#E85D26", "CTA, badges, prix promos"],
          ["accent-soft", "#FEF3EB", "Fond badge orange"],
          ["success", "#16A34A", "Confirmé, succès"],
          ["danger", "#DC2626", "Erreur, annulation"],
        ]
      ),
      space(),

      h2("5.3 Pages de l'Application"),
      makeTable(
        ["Page", "Route", "Accès", "Description"],
        [
          ["Accueil", "/", "Public", "Offres last-minute + restaurants populaires"],
          ["Recherche", "/search", "Public", "Filtres cuisine, ville, prix, note"],
          ["Fiche Restaurant", "/r/:slug", "Public", "Détail + menu + horaires + bouton réserver"],
          ["Réservation", "/r/:slug/reserve", "Connecté", "Formulaire date/heure/personnes/notes"],
          ["Wallet", "/wallet", "Connecté", "Solde points + historique en FC/USD"],
          ["Profil", "/profile", "Connecté", "Infos personnelles + mes réservations"],
          ["Connexion", "/login", "Public", "Email + mot de passe"],
          ["Inscription", "/register", "Public", "Formulaire complet + bonus 100 pts"],
          ["Dashboard Resto", "/dashboard", "Restaurateur", "Gestion réservations + menu + stats"],
        ]
      ),
      space(),

      h2("5.4 Composants UI Principaux"),
      makeTable(
        ["Composant", "Description"],
        [
          ["PrimaryButton", "Bouton #0A0A0A, texte blanc, radius 12px, hauteur 48px"],
          ["Input", "Champ texte blanc, bordure #E4E4E7, focus = bordure noire"],
          ["Card", "Surface #FAFAFA, bordure 1px, radius 16px"],
          ["RestaurantCard", "Image + nom + cuisine + note + prix FC + badge disponible"],
          ["OfferCard", "Countdown + discount % + places restantes + bouton réserver"],
          ["PointsBadge", "Solde points avec valeur FC (ex: 340 pts = 17 000 FC)"],
          ["Badge", "Pastille colorée (statut réservation, cuisine, tier)"],
          ["Skeleton", "Placeholder de chargement animé (important sur 3G)"],
          ["BottomSheet", "Modal glissant (mobile) pour filtres et confirmations"],
        ]
      ),
      pageBreak(),

      // ══════════════════════════════════════════════ 6. CONNEXION FRONT/BACK
      h1("6. Connexion Front / Backend"),
      h2("6.1 Client API (fetch wrapper)"),
      body("Un wrapper fetch centralisé gère automatiquement :"),
      bullet("Ajout du Bearer token depuis le store Zustand"),
      bullet("Retry automatique sur 401 (rafraîchissement du token)"),
      bullet("Gestion des erreurs réseau (timeout, offline)"),
      bullet("Transformation des prix cents → FC pour l'affichage"),
      space(),

      h2("6.2 Gestion des Erreurs"),
      makeTable(
        ["Code HTTP", "Cause", "Comportement Frontend"],
        [
          ["400", "Données invalides", "Afficher les erreurs de champ (React Hook Form)"],
          ["401", "Token expiré", "Refresh automatique → retry → sinon logout"],
          ["403", "Accès interdit", "Redirection vers /login avec message"],
          ["404", "Ressource introuvable", "Page 404 avec suggestion"],
          ["429", "Rate limit dépassé", "Message 'Trop de tentatives, réessayez dans 1min'"],
          ["500", "Erreur serveur", "Toast d'erreur générique + log Sentry"],
        ]
      ),
      space(),

      h2("6.3 États de Chargement"),
      bullet("Skeleton loaders sur toutes les listes (restaurants, menu, wallet)"),
      bullet("Spinner sur les boutons de soumission (éviter double-clic)"),
      bullet("Optimistic updates sur les likes/favoris"),
      bullet("Cache TanStack Query : stale 5min, revalidation en arrière-plan"),
      space(),

      h2("6.4 Validation des Données"),
      bullet("Client : React Hook Form + Zod schemas (package shared)"),
      bullet("Serveur : class-validator pipes NestJS + même Zod schemas"),
      bullet("Double validation = sécurité maximale même si le client est contourné"),
      pageBreak(),

      // ══════════════════════════════════════════════ 7. TESTS
      h1("7. Tests"),
      makeTable(
        ["Type", "Outil", "Ce qu'on teste"],
        [
          ["Tests unitaires", "Jest", "Services NestJS (logique points, calcul prix FC)"],
          ["Tests d'intégration", "Jest + Supertest", "Endpoints API (auth, réservations, wallet)"],
          ["Tests frontend", "Vitest + Testing Library", "Composants React (formulaires, affichage FC)"],
          ["Tests E2E", "Playwright", "Parcours complets (inscription → réservation → points)"],
          ["Tests de charge", "k6", "Résistance API (100 req/s sur /restaurants)"],
        ]
      ),
      space(),

      h2("7.1 Scénarios de Test Prioritaires"),
      bullet("Inscription → +100 points crédités automatiquement"),
      bullet("Réservation complétée → points calculés et ajoutés au ledger"),
      bullet("Refresh token rotation → ancien token invalide après refresh"),
      bullet("Rate limit /auth/login → blocage après 5 tentatives"),
      bullet("Conversion FC/USD → cohérence sur tous les écrans"),
      bullet("Affichage offline → message clair sur connexion 3G lente"),
      pageBreak(),

      // ══════════════════════════════════════════════ 8. ROADMAP
      h1("8. Roadmap & Priorités"),
      h2("8.1 Plan de Développement"),
      makeTable(
        ["Phase", "Étape", "Durée", "Livrable"],
        [
          ["1", "Design Fonctionnel (en cours)", "S1", "Ce document + parcours validés"],
          ["2", "Architecture + Setup projet", "S1", "Monorepo, Docker, Prisma schema"],
          ["3", "Base de données + Seed", "S2", "Tables, migrations, données démo RDC"],
          ["4", "Backend Auth + API Core", "S2–S3", "Login, register, restaurants, réservations"],
          ["5", "Frontend — Pages publiques", "S3–S4", "Home, Recherche, Fiche restaurant"],
          ["6", "Frontend — Pages connectées", "S4–S5", "Réservation, Wallet, Profil"],
          ["7", "Dashboard Restaurateur", "S5–S6", "Menu CRUD, gestion réservations"],
          ["8", "Connexion + Intégration", "S6", "Tests API, gestion erreurs, WhatsApp"],
          ["9", "Tests & QA", "S7", "Jest, Playwright, tests sur Android"],
          ["10", "Déploiement", "S8", "VPS (Railway/Render) + domaine .cd"],
        ]
      ),
      space(),

      h2("8.2 Checklist Phase 1 — Design Fonctionnel"),
      bullet("✅ Contexte marché RDC défini"),
      bullet("✅ Cible : classe moyenne Kinshasa / Lubumbashi"),
      bullet("✅ Fonctionnalités listées et priorisées"),
      bullet("✅ Parcours utilisateurs définis (3 personas)"),
      bullet("✅ Système de points adapté (5% cashback, FC)"),
      bullet("✅ Prix abonnements adaptés (Maman $3 → Domination $45)"),
      bullet("⬜ Validation du parcours avec un restaurateur réel"),
      bullet("⬜ Maquettes wireframe des écrans principaux"),
      space(),

      h2("8.3 Décisions Techniques à Prendre"),
      makeTable(
        ["Décision", "Options", "Recommandation"],
        [
          ["Hébergement API", "Railway / Render / VPS OVH", "Railway (simple, $5/mois)"],
          ["Hébergement Web", "Vercel / Netlify / Railway", "Vercel (CDN global, gratuit départ)"],
          ["Domaine", ".cd / .com", ".com + sous-domaine .cd pour le marché local"],
          ["WhatsApp notifs", "WhatsApp Business API / Twilio", "Twilio (plus simple à intégrer)"],
          ["Mobile Money", "CinetPay / Flutterwave / Direct API", "CinetPay (agrège Orange + Airtel + MTN en une API)"],
          ["Taux de change", "Manuel / BCC API", "Manuel au départ, API BCC plus tard"],
        ]
      ),
      space(),

      h2("8.4 Mobile Money — Intégration Paiements RDC"),
      body("En RDC, la majorité de la classe moyenne n'a pas de carte bancaire. Le Mobile Money est le principal moyen de paiement digital. Son intégration est indispensable dès le lancement."),
      space(),
      h3("Contexte marché"),
      makeTable(
        ["Opérateur", "Part de marché RDC", "Zones fortes"],
        [
          ["Orange Money", "~55%", "Kinshasa, Bas-Congo, Kasaï"],
          ["Airtel Money",  "~30%", "Lubumbashi, Katanga, provinces"],
          ["M-Pesa (Vodacom)", "~15%", "Zones rurales, Kivu"],
        ]
      ),
      space(),
      h3("Stratégie d'intégration : CinetPay (agrégateur)"),
      body("On ne connecte pas directement les APIs Orange/Airtel (nécessite des agréments complexes). On passe par CinetPay, agrégateur leader en Afrique francophone, qui unifie tous les opérateurs en une seule API REST."),
      makeTable(
        ["Agrégateur", "Opérateurs couverts", "Avantage", "Recommandation"],
        [
          ["CinetPay",    "Orange Money, Airtel, MTN, Wave", "Leader Afrique francophone, API simple", "✅ Recommandé"],
          ["Flutterwave", "30+ pays Afrique",                "API excellente, docs complètes",          "Alternative"],
          ["PayDunya",    "Orange Money, MTN, Moov",         "Fort en Afrique de l'Ouest",              "Secondaire"],
        ]
      ),
      space(),
      h3("Deux phases d'intégration"),
      makeTable(
        ["Phase", "Usage", "Qui paie", "Priorité"],
        [
          ["Phase 1 — Lancement",  "Paiement abonnement restaurateur (mensuel)",    "Restaurateur", "🔴 Must"],
          ["Phase 2 — Évolution",  "Paiement addition en ligne via l'app",          "Client",       "🟡 Plus tard"],
        ]
      ),
      space(),
      h3("Module Backend : PaymentsModule (NestJS)"),
      bullet("Endpoint POST /payments/subscribe → initie paiement CinetPay"),
      bullet("Webhook POST /payments/webhook → CinetPay notifie confirmation paiement"),
      bullet("Mise à jour automatique du tier restaurant après paiement confirmé"),
      bullet("Historique des paiements en base de données"),
      bullet("Relance automatique 3 jours avant expiration abonnement"),
      space(),
      note("Le taux de change USD/CDF est appliqué au moment du paiement. Référence : taux BCC (Banque Centrale du Congo). Au lancement, taux manuel mis à jour hebdomadairement. Migration vers API BCC en Phase 2."),
      space(),

      h2("8.5 QR Code Menu & Commande en ligne"),
      body("Le QR Code est une fonctionnalité centrale de MalewaOS. Chaque restaurant génère un QR Code unique. Le client scanne sans télécharger d'app."),
      makeTable(
        ["Fonctionnalité", "Disponibilité", "Description"],
        [
          ["Menu QR lecture seule",    "Tous les tiers",      "Page web responsive, sans compte requis. Prix en FC."],
          ["Commande via QR",          "Croissance + Domination", "Le client commande depuis sa table, la cuisine reçoit directement."],
          ["Paiement via QR",          "Phase 2",             "Paiement Mobile Money depuis la table."],
          ["QR personnalisé (logo)",   "Design Add-on",       "QR avec logo et couleurs du restaurant."],
        ]
      ),
      space(),
      note("Le QR Menu est la fonctionnalité la plus visible pour convaincre les restaurants de s'inscrire. Même le tier Maman ($3) l'obtient — c'est l'argument d'entrée numéro 1."),
      space(),

      h2("8.6 Publicité & Mise en Avant"),
      h3("Format A — Promotion Restaurant (revenus indirects)"),
      body("Le restaurateur met en avant ses propres plats ou prix exceptionnels dans l'app."),
      makeTable(
        ["Tier", "Promos incluses", "Promos sup.", "Visibilité"],
        [
          ["Maman",      "❌",          "❌",          "—"],
          ["Essentiel",  "1 active",    "❌",          "Sur fiche restaurant"],
          ["Croissance", "3 actives",   "$5 / promo",  "Fiche + résultats recherche"],
          ["Domination", "Illimitées",  "—",           "Fiche + Home + recherche"],
        ]
      ),
      space(),
      h3("Format B — Publicité Externe (revenus directs MalewaOS)"),
      body("Activée uniquement par le Super Administrator. Partenaires cibles : Brasseries du Congo (Primus/Skol), Coca-Cola, banques (Rawbank, Equity), opérateurs telecom (Orange, Airtel)."),
      makeTable(
        ["Format", "Emplacement", "Prix estimé", "Activé par"],
        [
          ["Bannière partenaire",       "Home + Search",         "$50–$200/semaine",   "Super Admin"],
          ["Restaurant sponsorisé",     "Résultats de recherche", "$30–$100/mois",     "Super Admin"],
          ["Offre Points Partenaire",   "Home — fil actualité",  "$200–$500/campagne", "Super Admin"],
        ]
      ),
      space(),
      note("Les emplacements publicitaires sont réservés dans le code dès le lancement mais restent vides jusqu'à activation par le Super Admin. Objectif : $500–$1 500/mois de revenus pub dès le mois 4–6."),
      space(),

      note("Prochaine étape : démarrage du développement React — Design System + Pages statiques."),
      space(2),

      new Paragraph({
        children: [new TextRun({ text: "— Fin du document —", size: 18, color: C_TEXT2, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUT, buffer);
  const size = Math.round(fs.statSync(OUT).size / 1024);
  console.log(`✅ Document généré : ${OUT}`);
  console.log(`   Taille : ${size} KB`);
}).catch(err => {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
});
