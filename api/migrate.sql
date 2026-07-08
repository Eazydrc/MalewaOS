-- Migration production Elengi
-- Idempotente : safe à relancer

-- Enum values
DO $$ BEGIN ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STAFF'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'LIVREUR'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "SubscriptionTier" ADD VALUE IF NOT EXISTS 'DECOUVERTE'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PACKAGING'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Nouveaux types enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CuisineType') THEN
    CREATE TYPE "CuisineType" AS ENUM ('LOCALE','AFRICAINE','OCCIDENTALE','LIBANAISE','MEXICAINE','CHINOISE','JAPONAISE','INDIENNE','FASTFOOD','PIZZERIA','AUTRE');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RestaurantType') THEN
    CREATE TYPE "RestaurantType" AS ENUM ('SUR_PLACE','LIVRAISON','LES_DEUX');
  END IF;
END $$;

-- User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAvailableForDelivery" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currentLat" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currentLng" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "availabilityUpdatedAt" TIMESTAMP(3);

-- Restaurant
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "openingHours" JSONB;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "accentColor" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "textColor" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "bgColor" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "customLogoUrl" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "heroImageUrl" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "tagline" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "story" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "font" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "gallery" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "subdomain" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "bannerText" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "bannerImageUrl" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "bannerCtaText" TEXT;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "dailySpecialDaysUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "dailySpecialResetAt" TIMESTAMP(3);
ALTER TABLE "Restaurant" ADD COLUMN IF NOT EXISTS "affiliationCode" TEXT;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Restaurant' AND column_name='cuisine') THEN
    ALTER TABLE "Restaurant" ADD COLUMN "cuisine" "CuisineType" NOT NULL DEFAULT 'AUTRE';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Restaurant' AND column_name='restaurantType') THEN
    ALTER TABLE "Restaurant" ADD COLUMN "restaurantType" "RestaurantType" NOT NULL DEFAULT 'SUR_PLACE';
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "Restaurant_subdomain_key" ON "Restaurant"("subdomain");
CREATE UNIQUE INDEX IF NOT EXISTS "Restaurant_affiliationCode_key" ON "Restaurant"("affiliationCode");

-- MenuItem
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "promoPrice" INTEGER;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "isHot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "isLastUnits" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "isDailySpecial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "dailySpecialEndsAt" TIMESTAMP(3);

-- Review
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "ownerReply" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP(3);

-- Reservation
ALTER TABLE "Reservation" ADD COLUMN IF NOT EXISTS "tableId" TEXT;

-- Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "tableId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refusalReason" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "searchingDriver" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryFeeUsdCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "escrowReleased" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "escrowReleasedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryLat" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryLng" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "verificationCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "problemReport" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "problemReportedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "assignedDriverId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "claimedByDriverId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "driverEarningsCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "driverLat" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "driverLng" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "driverLastSeen" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "Order_verificationCode_key" ON "Order"("verificationCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Order_deliveryCode_key" ON "Order"("deliveryCode");

-- Tables
CREATE TABLE IF NOT EXISTS "RestaurantTable" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "label" TEXT,
  "seats" INTEGER NOT NULL DEFAULT 2,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RestaurantTable_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RestaurantTable_restaurantId_number_key" ON "RestaurantTable"("restaurantId","number");
CREATE INDEX IF NOT EXISTS "RestaurantTable_restaurantId_idx" ON "RestaurantTable"("restaurantId");

CREATE TABLE IF NOT EXISTS "StaffMember" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'SERVEUR',
  "phone" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT,
  CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "StaffMember_userId_key" ON "StaffMember"("userId");
CREATE INDEX IF NOT EXISTS "StaffMember_restaurantId_idx" ON "StaffMember"("restaurantId");

CREATE TABLE IF NOT EXISTS "ReservationItem" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "menuItemId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "priceUsdCents" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "ReservationItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ReservationItem_reservationId_idx" ON "ReservationItem"("reservationId");

CREATE TABLE IF NOT EXISTS "PushSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");

CREATE TABLE IF NOT EXISTS "PaymentTransaction" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
  "amountUsd" INTEGER NOT NULL,
  "transactionId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "cinetpayRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_transactionId_key" ON "PaymentTransaction"("transactionId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_restaurantId_idx" ON "PaymentTransaction"("restaurantId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_userId_idx" ON "PaymentTransaction"("userId");

CREATE TABLE IF NOT EXISTS "DriverAffiliation" (
  "id" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DriverAffiliation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DriverAffiliation_driverId_restaurantId_key" ON "DriverAffiliation"("driverId","restaurantId");
CREATE INDEX IF NOT EXISTS "DriverAffiliation_restaurantId_idx" ON "DriverAffiliation"("restaurantId");
CREATE INDEX IF NOT EXISTS "DriverAffiliation_driverId_idx" ON "DriverAffiliation"("driverId");

CREATE TABLE IF NOT EXISTS "OrderPaymentTransaction" (
  "id" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "amountUsd" INTEGER NOT NULL,
  "transactionId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderPaymentTransaction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OrderPaymentTransaction_transactionId_key" ON "OrderPaymentTransaction"("transactionId");
CREATE INDEX IF NOT EXISTS "OrderPaymentTransaction_restaurantId_idx" ON "OrderPaymentTransaction"("restaurantId");
CREATE INDEX IF NOT EXISTS "OrderPaymentTransaction_userId_idx" ON "OrderPaymentTransaction"("userId");

-- Foreign keys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='RestaurantTable_restaurantId_fkey') THEN
    ALTER TABLE "RestaurantTable" ADD CONSTRAINT "RestaurantTable_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='StaffMember_restaurantId_fkey') THEN
    ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='StaffMember_userId_fkey') THEN
    ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ReservationItem_reservationId_fkey') THEN
    ALTER TABLE "ReservationItem" ADD CONSTRAINT "ReservationItem_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='PushSubscription_userId_fkey') THEN
    ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='PaymentTransaction_restaurantId_fkey') THEN
    ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='PaymentTransaction_userId_fkey') THEN
    ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='DriverAffiliation_driverId_fkey') THEN
    ALTER TABLE "DriverAffiliation" ADD CONSTRAINT "DriverAffiliation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='DriverAffiliation_restaurantId_fkey') THEN
    ALTER TABLE "DriverAffiliation" ADD CONSTRAINT "DriverAffiliation_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='OrderPaymentTransaction_restaurantId_fkey') THEN
    ALTER TABLE "OrderPaymentTransaction" ADD CONSTRAINT "OrderPaymentTransaction_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='OrderPaymentTransaction_userId_fkey') THEN
    ALTER TABLE "OrderPaymentTransaction" ADD CONSTRAINT "OrderPaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Order_tableId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Order_assignedDriverId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='Reservation_tableId_fkey') THEN
    ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
