import { IsEnum, IsOptional, IsString, IsInt, Min, Max, IsEmail, MinLength, MaxLength, IsArray, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export enum AdminRole {
  CLIENT     = 'CLIENT',
  RESTAURANT = 'RESTAURANT',
  ADMIN      = 'ADMIN',
  SUPER_ADMIN= 'SUPER_ADMIN',
}

export enum AdminSubTier {
  DECOUVERTE = 'DECOUVERTE',
  MAMAN      = 'MAMAN',
  ESSENTIEL  = 'ESSENTIEL',
  CROISSANCE = 'CROISSANCE',
  DOMINATION = 'DOMINATION',
}

export enum AdminOrderStatus {
  PENDING          = 'PENDING',
  ACCEPTED         = 'ACCEPTED',
  PREPARING        = 'PREPARING',
  PACKAGING        = 'PACKAGING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  READY            = 'READY',
  DELIVERED        = 'DELIVERED',
  CANCELLED        = 'CANCELLED',
}

export class ChangeRoleDto {
  @IsEnum(AdminRole)
  role: AdminRole;
}

export class ChangeSubscriptionDto {
  @IsEnum(AdminSubTier)
  subscription: AdminSubTier;
}

export class UserFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CreateRestaurantAccountDto {
  // ─── Compte propriétaire ──────────────────────────────────────────────────
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  password: string;

  // ─── Restaurant ───────────────────────────────────────────────────────────
  @IsString()
  restaurantName: string;

  @IsOptional()
  @IsString()
  restaurantPhone?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Maximum 10 catégories autorisées' })
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  categories?: string[];

  @IsOptional()
  @IsEnum(AdminSubTier)
  subscription?: AdminSubTier;

  @IsOptional()
  @IsEnum(['SUR_PLACE', 'LIVRAISON', 'LES_DEUX'])
  restaurantType?: string;

  // ─── Adresse structurée ───────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  ville?: string;      // défaut : "Kinshasa"

  @IsString()
  commune: string;

  @IsString()
  quartier: string;

  @IsOptional()
  @IsString()
  numero?: string;     // numéro de parcelle / rue

  @IsOptional()
  @IsString()
  reference?: string;  // repère : "en face de la pharmacie Mama Ngoli"
}

export class OrderFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AdminOrderStatus)
  status?: AdminOrderStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class RestaurantFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AdminSubTier)
  subscription?: AdminSubTier;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
