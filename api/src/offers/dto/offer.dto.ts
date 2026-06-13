import {
  IsString, IsOptional, IsInt, IsBoolean, IsEnum,
  Min, Max, MaxLength, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OfferType { PROMO = 'PROMO', POINTS = 'POINTS', FLASH = 'FLASH' }

export class CreateOfferDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(500)
  description: string;

  @IsEnum(OfferType)
  type: OfferType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1) @Max(100)
  discountPct?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pointsCost?: number;

  @IsDateString()
  expiresAt: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses?: number;
}

export class UpdateOfferDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1) @Max(100)
  discountPct?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pointsCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
