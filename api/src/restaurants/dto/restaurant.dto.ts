import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max, IsArray, IsObject, IsHexColor, IsUrl, IsEnum, IsLatitude, IsLongitude } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum CuisineType {
  LOCALE = 'LOCALE', AFRICAINE = 'AFRICAINE', OCCIDENTALE = 'OCCIDENTALE',
  LIBANAISE = 'LIBANAISE', MEXICAINE = 'MEXICAINE', CHINOISE = 'CHINOISE',
  JAPONAISE = 'JAPONAISE', INDIENNE = 'INDIENNE', FASTFOOD = 'FASTFOOD',
  PIZZERIA = 'PIZZERIA', AUTRE = 'AUTRE',
}

export enum RestaurantType {
  SUR_PLACE = 'SUR_PLACE', LIVRAISON = 'LIVRAISON', LES_DEUX = 'LES_DEUX',
}

export class CreateRestaurantDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priceRange?: number;
}

export class UpdateRestaurantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priceRange?: number;

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsObject()
  openingHours?: Record<string, { open: string; close: string; closed: boolean }>;

  @IsOptional()
  @IsEnum(CuisineType)
  cuisine?: CuisineType;

  @IsOptional()
  @IsEnum(RestaurantType)
  restaurantType?: RestaurantType;

  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  lng?: number;

  // Branding DOMINATION
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @IsOptional()
  @IsHexColor()
  accentColor?: string;

  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @IsOptional()
  @IsHexColor()
  textColor?: string;

  @IsOptional()
  @IsHexColor()
  bgColor?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  customLogoUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  heroImageUrl?: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsString()
  story?: string;

  @IsOptional()
  @IsString()
  font?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @IsOptional()
  @IsString()
  subdomain?: string;

  @IsOptional()
  @IsString()
  bannerText?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  bannerImageUrl?: string;

  @IsOptional()
  @IsString()
  bannerCtaText?: string;
}

export class QueryRestaurantDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 12;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isOpen?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  maxPriceRange?: number;

  @IsOptional()
  @IsEnum(CuisineType)
  cuisine?: CuisineType;

  @IsOptional()
  @IsEnum(RestaurantType)
  restaurantType?: RestaurantType;
}
