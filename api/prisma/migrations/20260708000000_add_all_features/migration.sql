-- ================================================================
-- Migration : tous les ajouts depuis add_email_verified
-- ================================================================

-- ── Nouveaux enums ───────────────────────────────────────────────
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STAFF';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'LIVREUR';
ALTER TYPE "SubscriptionTier" ADD VALUE IF NOT EXISTS 'DECOUVERTE';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PACKAGING';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY';

-- Enums CuisineType + RestaurantType (créés seulement s'ils n'existent pas)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CuisineType') THEN
    CREATE TYPE "CuisineType" AS ENUM (
      'LOCALE','AFRICAINE','OCCIDENTALE','LIBANAISE','MEXICAINE',
      'CHINOISE','JAPONAISE','INDIENNE','FASTFOOD','PIZZERIA','AUTRE'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RestaurantType') THEN
    CREATE TYPE "RestaurantType" AS ENUM ('SUR_PLACE','LIVRAISON','LES_DEUX');
  END IF;
END $$;

-- ── User — nouvelles colonnes livreur ────────────────────────────
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "isAvailableForDelivery" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "currentLat"             DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "currentLng"             DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "availabilityUpdatedAt"  TIMESTAMP(3);

-- ── Restaurant — nombreuses nouvelles colonnes ───────────────────
ALTER TABLE "Restaurant"
  ADD COLUMN IF NOT EXISTS "openingHours"          JSONB,
  ADD COLUMN IF NOT EXISTS "cuisine"               "CuisineType" NOT NULL DEFAULT 'AUTRE',
  ADD COLUMN IF NOT EXISTS "restaurantType"        "RestaurantType" NOT NULL DEFAULT 'SUR_PLACE',
  ADD COLUMN IF NOT EXISTS "lat"                   DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lng"                   DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "primaryColor"          TEXT,
  ADD COLUMN IF NOT EXISTS "accentColor"           TEXT,
  ADD COLUMN IF NOT EXISTS "secondaryColor"        TEXT,
  ADD COLUMN IF NOT EXISTS "textColor"             TEXT,
  ADD COLUMN IF NOT EXISTS "bgColor"               TEXT,
  ADD COLUMN IF NOT EXISTS "customLogoUrl"         TEXT,
  ADD COLUMN IF NOT EXISTS "heroImageUrl"          TEXT,
  ADD COLUMN IF NOT EXISTS "tagline"               TEXT,
  ADD COLUMN IF NOT EXISTS "story"                 TEXT,
  ADD COLUMN IF NOT EXISTS "font"                  TEXT,
  ADD COLUMN IF NOT EXISTS "gallery"               TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "subdomain"             TEXT,
  ADD COLUMN IF NOT EXISTS "bannerText"            TEXT,
  ADD COLUMN IF NOT EXISTS "bannerImageUrl"        TEXT,
  ADD COLUMN IF NOT EXISTS "bannerCtaText"         TEXT,
  ADD COLUMN IF NOT EXISTS "dailySpecialDaysUsed"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "dailySpecialResetAt"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "affiliationCode"       TEXT;

-- Unique constraints (IF NOT EXISTS via DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Restaurant_subdomain_key') THEN
    CREATE UNIQUE INDEX "Restaurant_subdomain_key" ON "Restaurant"("subdomain");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Restaurant_affiliationCode_key') THEN
    CREATE UNIQUE INDEX "Restaurant_affiliationCode_key" ON "Restaurant"("affiliationCode");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Restaurant_cuisine_idx') THEN
    CREATE INDEX "Restaurant_cuisine_idx" ON "Restaurant"("cuisine");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Restaurant_restaurantType_idx') THEN
    CREATE INDEX "Restaurant_restaurantType_idx" ON "Restaurant"("restaurantType");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Restaurant_lat_lng_idx') THEN
    CREATE INDEX "Restaurant_lat_lng_idx" ON "Restaurant"("lat", "lng");
  END IF;
END $$;

-- ── MenuItem — badges + promo ────────────────────────────────────
ALTER TABLE "MenuItem"
  ADD COLUMN IF NOT EXISTS "promoPrice"         INTEGER,
  ADD COLUMN IF NOT EXISTS "isHot"              BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isLastUnits"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isDailySpecial"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "dailySpecialEndsAt" TIMESTAMP(3);

-- ── Review — réponse owner ───────────────────────────────────────
ALTER TABLE "Review"
  ADD COLUMN IF NOT EXISTS "ownerReply" TEXT,
  ADD COLUMN IF NOT EXISTS "repliedAt"  TIMESTAMP(3);

-- ── Order — livraison + paiement + séquestre ─────────────────────
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "tableId"              TEXT,
  ADD COLUMN IF NOT EXISTS "isPaid"               BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "paidAt"               TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "refusalReason"        TEXT,
  ADD COLUMN IF NOT EXISTS "searchingDriver"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deliveryFeeUsdCents"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "escrowReleased"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "escrowReleasedAt"     TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deliveryAddress"      TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryLat"          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "deliveryLng"          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "verificationCode"     TEXT,
  ADD COLUMN IF NOT EXISTS "deliveryCode"         TEXT,
  ADD COLUMN IF NOT EXISTS "problemReport"        TEXT,
  ADD COLUMN IF NOT EXISTS "problemReportedAt"    TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "assignedDriverId"     TEXT,
  ADD COLUMN IF NOT EXISTS "claimedByDriverId"    TEXT,
  ADD COLUMN IF NOT EXISTS "claimedAt"            TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "driverEarningsCents"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "driverLat"            DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "driverLng"            DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "driverLastSeen"       TIMESTAMP(3);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Order_verificationCode_key') THEN
    CREATE UNIQUE INDEX "Order_verificationCode_key" ON "Order"("verificationCode");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Order_deliveryCode_key') THEN
    CREATE UNIQUE INDEX "Order_deliveryCode_key" ON "Order"("deliveryCode");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Order_assignedDriverId_idx') THEN
    CREATE INDEX "Order_assignedDriverId_idx" ON "Order"("assignedDriverId");
  END IF;
END $$;

-- ── Reservation — tableId ────────────────────────────────────────
ALTER TABLE "Reservation"
  ADD COLUMN IF NOT EXISTS "tableId" TEXT;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Reservation_tableId_idx') THEN
    CREATE INDEX "Reservation_tableId_idx" ON "Reservation"("tableId");
  END IF;
END $$;

-- ── Nouvelles tables ─────────────────────────────────────────────

-- RestaurantTable
CREATE TABLE IF NOT EXISTS "RestaurantTable" (
    "id"           TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "number"       INTEGER NOT NULL,
    "label"        TEXT,
    "seats"        INTEGER NOT NULL DEFAULT 2,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RestaurantTable_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'RestaurantTable_restaurantId_number_key') THEN
    CREATE UNIQUE INDEX "RestaurantTable_restaurantId_number_key" ON "RestaurantTable"("restaurantId", "number");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'RestaurantTable_restaurantId_idx') THEN
    CREATE INDEX "RestaurantTable_restaurantId_idx" ON "RestaurantTable"("restaurantId");
  END IF;
END $$;

-- StaffMember
CREATE TABLE IF NOT EXISTS "StaffMember" (
    "id"           TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "firstName"    TEXT NOT NULL,
    "lastName"     TEXT NOT NULL,
    "role"         TEXT NOT NULL DEFAULT 'SERVEUR',
    "phone"        TEXT,
    "isActive"     BOOLEAN NOT NULL DEFAULT true,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId"       TEXT,
    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'StaffMember_userId_key') THEN
    CREATE UNIQUE INDEX "StaffMember_userId_key" ON "StaffMember"("userId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'StaffMember_restaurantId_idx') THEN
    CREATE INDEX "StaffMember_restaurantId_idx" ON "StaffMember"("restaurantId");
  END IF;
END $$;

-- ReservationItem
CREATE TABLE IF NOT EXISTS "ReservationItem" (
    "id"            TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "menuItemId"    TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "priceUsdCents" INTEGER NOT NULL,
    "quantity"      INTEGER NOT NULL,
    CONSTRAINT "ReservationItem_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'ReservationItem_reservationId_idx') THEN
    CREATE INDEX "ReservationItem_reservationId_idx" ON "ReservationItem"("reservationId");
  END IF;
END $$;

-- PushSubscription
CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "endpoint"  TEXT NOT NULL,
    "p256dh"    TEXT NOT NULL,
    "auth"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PushSubscription_endpoint_key') THEN
    CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PushSubscription_userId_idx') THEN
    CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
  END IF;
END $$;

-- PaymentTransaction
CREATE TABLE IF NOT EXISTS "PaymentTransaction" (
    "id"            TEXT NOT NULL,
    "restaurantId"  TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "tier"          TEXT NOT NULL,
    "amountUsd"     INTEGER NOT NULL,
    "transactionId" TEXT NOT NULL,
    "status"        TEXT NOT NULL DEFAULT 'PENDING',
    "cinetpayRef"   TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentTransaction_transactionId_key') THEN
    CREATE UNIQUE INDEX "PaymentTransaction_transactionId_key" ON "PaymentTransaction"("transactionId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentTransaction_restaurantId_idx') THEN
    CREATE INDEX "PaymentTransaction_restaurantId_idx" ON "PaymentTransaction"("restaurantId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'PaymentTransaction_userId_idx') THEN
    CREATE INDEX "PaymentTransaction_userId_idx" ON "PaymentTransaction"("userId");
  END IF;
END $$;

-- DriverAffiliation
CREATE TABLE IF NOT EXISTS "DriverAffiliation" (
    "id"           TEXT NOT NULL,
    "driverId"     TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DriverAffiliation_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'DriverAffiliation_driverId_restaurantId_key') THEN
    CREATE UNIQUE INDEX "DriverAffiliation_driverId_restaurantId_key" ON "DriverAffiliation"("driverId", "restaurantId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'DriverAffiliation_restaurantId_idx') THEN
    CREATE INDEX "DriverAffiliation_restaurantId_idx" ON "DriverAffiliation"("restaurantId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'DriverAffiliation_driverId_idx') THEN
    CREATE INDEX "DriverAffiliation_driverId_idx" ON "DriverAffiliation"("driverId");
  END IF;
END $$;

-- OrderPaymentTransaction
CREATE TABLE IF NOT EXISTS "OrderPaymentTransaction" (
    "id"            TEXT NOT NULL,
    "restaurantId"  TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "orderIds"      TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "amountUsd"     INTEGER NOT NULL,
    "transactionId" TEXT NOT NULL,
    "status"        TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderPaymentTransaction_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'OrderPaymentTransaction_transactionId_key') THEN
    CREATE UNIQUE INDEX "OrderPaymentTransaction_transactionId_key" ON "OrderPaymentTransaction"("transactionId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'OrderPaymentTransaction_restaurantId_idx') THEN
    CREATE INDEX "OrderPaymentTransaction_restaurantId_idx" ON "OrderPaymentTransaction"("restaurantId");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'OrderPaymentTransaction_userId_idx') THEN
    CREATE INDEX "OrderPaymentTransaction_userId_idx" ON "OrderPaymentTransaction"("userId");
  END IF;
END $$;

-- ── Foreign keys (IF NOT EXISTS via DO blocks) ───────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RestaurantTable_restaurantId_fkey') THEN
    ALTER TABLE "RestaurantTable" ADD CONSTRAINT "RestaurantTable_restaurantId_fkey"
      FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffMember_restaurantId_fkey') THEN
    ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_restaurantId_fkey"
      FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StaffMember_userId_fkey') THEN
    ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReservationItem_reservationId_fkey') THEN
    ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_reservationId_fkey"
      FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PushSubscription_userId_fkey') THEN
    ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentTransaction_restaurantId_fkey') THEN
    ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_restaurantId_fkey"
      FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentTransaction_userId_fkey') THEN
    ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DriverAffiliation_driverId_fkey') THEN
    ALTER TABLE "DriverAffiliation" ADD CONSTRAINT "DriverAffiliation_driverId_fkey"
      FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DriverAffiliation_restaurantId_fkey') THEN
    ALTER TABLE "DriverAffiliation" ADD CONSTRAINT "DriverAffiliation_restaurantId_fkey"
      FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderPaymentTransaction_restaurantId_fkey') THEN
    ALTER TABLE "OrderPaymentTransaction" ADD CONSTRAINT "OrderPaymentTransaction_restaurantId_fkey"
      FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrderPaymentTransaction_userId_fkey') THEN
    ALTER TABLE "OrderPaymentTransaction" ADD CONSTRAINT "OrderPaymentTransaction_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_tableId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_tableId_fkey"
      FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_assignedDriverId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedDriverId_fkey"
      FOREIGN KEY ("assignedDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Reservation_tableId_fkey') THEN
    ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey"
      FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
