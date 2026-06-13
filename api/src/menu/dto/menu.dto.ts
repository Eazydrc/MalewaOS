import {
  IsString, IsOptional, IsNumber, IsBoolean,
  Min, Max, MaxLength, IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Section ───────────────────────────────────────────────────────────────────

export class CreateSectionDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;
}

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;
}

// ── Item ──────────────────────────────────────────────────────────────────────

export class CreateItemDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(99_999_99)
  priceUsdCents: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  promoPrice?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isHot?: boolean;

  @IsOptional()
  @IsBoolean()
  isLastUnits?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;
}

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceUsdCents?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  promoPrice?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isHot?: boolean;

  @IsOptional()
  @IsBoolean()
  isLastUnits?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  order?: number;
}

// ── Opening Hours ─────────────────────────────────────────────────────────────

export class UpdateOpeningHoursDto {
  @IsObject()
  openingHours: Record<string, { open: string; close: string; closed: boolean }>;
}
