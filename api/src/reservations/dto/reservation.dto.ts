import { IsString, IsDateString, IsInt, IsEnum, Min, Max, IsOptional, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReservationPreOrderItemDto {
  @IsString()
  menuItemId: string;

  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  quantity: number;
}

export class CreateReservationDto {
  @IsString()
  restaurantId: string;

  @IsDateString()
  date: string; // ISO 8601 e.g. "2025-12-25T20:00:00Z"

  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  partySize: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationPreOrderItemDto)
  items?: ReservationPreOrderItemDto[];
}

export class UpdateReservationDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  partySize?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStatusDto {
  @IsEnum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'], { message: 'Statut invalide' })
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
}

export class AssignTableDto {
  @IsOptional()
  @IsString()
  tableId?: string | null;
}
