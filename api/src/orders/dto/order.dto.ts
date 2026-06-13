import {
  IsString, IsInt, IsEnum, IsOptional, IsArray,
  ValidateNested, Min, MaxLength, IsNumber, IsLatitude, IsLongitude,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  menuItemId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;
}

export class CreateOrderDto {
  @IsString()
  restaurantId: string;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  // Livraison
  @IsOptional()
  @IsString()
  @MaxLength(300)
  deliveryAddress?: string;

  @IsOptional()
  @IsNumber()
  deliveryLat?: number;

  @IsOptional()
  @IsNumber()
  deliveryLng?: number;
}

export class UpdateOrderStatusDto {
  @IsEnum(
    ['ACCEPTED', 'PREPARING', 'PACKAGING', 'OUT_FOR_DELIVERY', 'READY', 'DELIVERED', 'CANCELLED'],
    { message: 'Statut invalide' },
  )
  status: 'ACCEPTED' | 'PREPARING' | 'PACKAGING' | 'OUT_FOR_DELIVERY' | 'READY' | 'DELIVERED' | 'CANCELLED';
}

export class AssignDriverDto {
  @IsString()
  driverId: string;
}

export class UpdateDriverLocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}
