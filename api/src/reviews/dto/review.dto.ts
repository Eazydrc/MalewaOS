import { IsString, IsOptional, IsInt, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsString()
  restaurantId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1) @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class ReplyReviewDto {
  @IsString()
  @MaxLength(1000)
  reply: string;
}
