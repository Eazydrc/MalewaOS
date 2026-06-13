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
// DTO pour initier un paiement
// ─────────────────────────────────────────────

export class InitiatePaymentDto {
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;

  @IsString()
  phone: string; // numéro Mobile Money ex: "0999999999"
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
