import { IsString, IsOptional, IsEnum, IsBoolean, MaxLength, IsEmail, MinLength } from 'class-validator';

export enum StaffRole {
  SERVEUR   = 'SERVEUR',
  CUISINIER = 'CUISINIER',
  MANAGER   = 'MANAGER',
  CAISSIER  = 'CAISSIER',
  AUTRE     = 'AUTRE',
}

export class CreateStaffDto {
  @IsString() @MaxLength(50)
  firstName: string;

  @IsString() @MaxLength(50)
  lastName: string;

  @IsEnum(StaffRole)
  role: StaffRole;

  @IsOptional() @IsString() @MaxLength(30)
  phone?: string;
}

export class UpdateStaffDto {
  @IsOptional() @IsString() @MaxLength(50)
  firstName?: string;

  @IsOptional() @IsString() @MaxLength(50)
  lastName?: string;

  @IsOptional() @IsEnum(StaffRole)
  role?: StaffRole;

  @IsOptional() @IsString() @MaxLength(30)
  phone?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class CreateStaffLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
