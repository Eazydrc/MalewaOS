import {
  IsEmail, IsString, IsEnum, MinLength, MaxLength,
  IsOptional, Matches,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MaxLength(50)
  lastName: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/, { message: 'Numéro de téléphone invalide' })
  phone?: string;

  @IsString()
  @MinLength(8,   { message: 'Le mot de passe doit faire minimum 8 caractères' })
  @MaxLength(256, { message: 'Le mot de passe ne peut pas dépasser 256 caractères' })
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/, {
    message: 'Le mot de passe doit contenir une majuscule, un chiffre et un symbole',
  })
  password: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MaxLength(256)
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(254)
  email: string;
}

export class VerifyOtpDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'Le code OTP doit être à 6 chiffres' })
  code: string;

  // Enum strict — empêche l'utilisation d'un OTP d'un contexte dans un autre
  @IsEnum(['reset', 'verify_email', 'mfa'], { message: 'Purpose invalide' })
  purpose: 'reset' | 'verify_email' | 'mfa';
}

export class ResetPasswordDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @Matches(/^[0-9]{6}$/)
  code: string;

  @IsString()
  @MinLength(8)
  @MaxLength(256)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/)
  newPassword: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/, { message: 'Numéro de téléphone invalide' })
  phone?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MaxLength(256)
  currentPassword: string;

  @IsString()
  @MinLength(8,   { message: 'Le mot de passe doit faire minimum 8 caractères' })
  @MaxLength(256, { message: 'Le mot de passe ne peut pas dépasser 256 caractères' })
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])/, {
    message: 'Le mot de passe doit contenir une majuscule, un chiffre et un symbole',
  })
  newPassword: string;
}

// ── Email Verification ────────────────────────────────────────────────────────
export class VerifyEmailDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'Code à 6 chiffres requis' })
  code: string;
}

export class ResendVerificationDto {
  @IsEmail()
  @MaxLength(254)
  email: string;
}

// ── MFA (Admin / SuperAdmin) ──────────────────────────────────────────────────
export class MfaVerifyDto {
  @IsString()
  @MaxLength(128)
  mfaToken: string;

  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'Code à 6 chiffres requis' })
  code: string;
}
