import { IsInt, IsOptional, Min, Max, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class WalletHistoryQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

export class RedeemPointsDto {
  @IsInt()
  @Min(20)
  @Type(() => Number)
  points: number;
}

export class AwardPointsDto {
  @IsInt()
  @Min(1)
  @Max(50000) // Plafond métier : jamais plus de 50 000 pts en une attribution manuelle
  @Type(() => Number)
  points: number;

  @IsString()
  @MaxLength(200)
  reason: string;
}
