import { IsInt, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';

export class CreateTableDto {
  @IsInt() @Min(1) @Max(999)
  number: number;

  @IsOptional() @IsString() @MaxLength(50)
  label?: string;

  @IsInt() @Min(1) @Max(50)
  seats: number;
}
