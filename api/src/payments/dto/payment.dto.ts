import { IsEnum, IsString, IsOptional } from 'class-validator';

// ─────────────────────────────────────────────
// Enum des tiers d'abonnement
// ─────────────────────────────────────────────

export enum SubscriptionTier {
  MAMAN      = 'MAMAN',
  ESSENTIEL  = 'ESSENTIEL',
  CROISSANCE = 'CROISSANCE',
  DOMINATION = 'DOMINATION',
}

// Prix en cents USD
export const TIER_PRICES: Record<SubscriptionTier, number> = {
  MAMAN:      300,   // $3
  ESSENTIEL:  1000,  // $10
  CROISSANCE: 2500,  // $25
  DOMINATION: 4500,  // $45
};

// ─────────────────────────────────────────────
// Méthode de paiement choisie par le client
// ─────────────────────────────────────────────

export enum PaymentMethod {
  CARD         = 'CARD',
  MOBILE_MONEY = 'MOBILE_MONEY',
}

// ─────────────────────────────────────────────
// DTO pour initier un paiement
// ─────────────────────────────────────────────

export class InitiatePaymentDto {
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  phone?: string; // requis si method = MOBILE_MONEY
}

// ─────────────────────────────────────────────
// DTO pour payer les commandes du jour dans un restaurant
// ─────────────────────────────────────────────

export class InitiateOrderPaymentDto {
  @IsString()
  restaurantId: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  phone?: string;

  /** Si fourni, ne paie que cette commande précise au lieu de toutes celles dues du jour */
  @IsOptional()
  @IsString()
  orderId?: string;
}

// ─────────────────────────────────────────────
// DTO du webhook CinetPay
// ─────────────────────────────────────────────

export class CinetPayWebhookDto {
  @IsString()
  cpm_trans_id: string;

  @IsString()
  cpm_site_id: string;

  @IsString()
  cpm_result: string; // '00' = succès

  @IsString()
  cpm_amount: string;

  @IsString()
  cpm_currency: string;

  @IsOptional()
  @IsString()
  cpm_custom?: string; // ex: "restaurantId:tier"

  @IsOptional()
  @IsString()
  transaction_id?: string; // alias alternatif CinetPay
}
