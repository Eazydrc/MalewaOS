import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtUser } from './decorators/current-user.decorator';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
  UpdateProfileDto,
  ChangePasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
  MfaVerifyDto,
} from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';

const ACCESS_MAX_AGE  = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  private readonly isProd: boolean;

  constructor(
    private auth:   AuthService,
    private config: ConfigService,
  ) {
    this.isProd = config.get<string>('NODE_ENV') === 'production';
  }

  // ── Cookies ───────────────────────────────────────────────────────────────

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    const base = { httpOnly: true, secure: this.isProd, sameSite: 'strict' as const };
    res.cookie('access_token',  accessToken,  { ...base, maxAge: ACCESS_MAX_AGE,  path: '/' });
    res.cookie('refresh_token', refreshToken, { ...base, maxAge: REFRESH_MAX_AGE, path: '/api/v1/auth' });
  }

  private clearCookies(res: Response) {
    const base = { httpOnly: true, secure: this.isProd, sameSite: 'strict' as const };
    res.clearCookie('access_token',  { ...base, path: '/' });
    res.clearCookie('refresh_token', { ...base, path: '/api/v1/auth' });
  }

  // ── Inscription — renvoie email pour redirection vers vérification ─────────
  @Post('register')
  @Throttle({ default: { ttl: 900_000, limit: process.env.NODE_ENV === 'production' ? 5 : 100 } })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('register-driver')
  @Throttle({ default: { ttl: 900_000, limit: process.env.NODE_ENV === 'production' ? 5 : 100 } })
  registerDriver(@Body() dto: RegisterDto) {
    return this.auth.registerDriver(dto);
  }

  // ── Vérification email ────────────────────────────────────────────────────
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900_000, limit: 10 } })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.auth.verifyEmail(dto);
    this.setCookies(res, tokens.accessToken, tokens.refreshToken);
    return { message: 'Email vérifié. Bienvenue !' };
  }

  // ── Renvoyer le code de vérification ─────────────────────────────────────
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900_000, limit: 3 } })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.auth.resendVerification(dto.email);
  }

  // ── Connexion ─────────────────────────────────────────────────────────────
  // CLIENT/RESTAURANT → cookies immédiats
  // ADMIN/SUPER_ADMIN → { mfaRequired: true, mfaToken } (MFA requis)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900_000, limit: 10 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto);
    if ('mfaRequired' in result) return result; // retourne { mfaRequired, mfaToken }
    this.setCookies(res, result.accessToken, result.refreshToken);
    return { message: 'Connexion réussie' };
  }

  // ── MFA — vérification du second facteur ──────────────────────────────────
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  async mfaVerify(
    @Body() dto: MfaVerifyDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.auth.mfaVerify(dto);
    this.setCookies(res, tokens.accessToken, tokens.refreshToken);
    return { message: 'Connexion réussie' };
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const code = await this.auth.googleLoginWithCode(req.user as any);
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:4001';
    res.redirect(`${frontendUrl}/auth/callback?code=${code}`);
  }

  @Post('google/exchange')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900_000, limit: 10 } })
  async exchangeGoogleCode(
    @Body('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.auth.exchangeGoogleCode(code);
    this.setCookies(res, tokens.accessToken, tokens.refreshToken);
    return { message: 'Connexion Google réussie' };
  }

  // ── Mot de passe oublié ───────────────────────────────────────────────────
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900_000, limit: 3 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  // ── Refresh / Logout ──────────────────────────────────────────────────────
  @SkipThrottle()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('Refresh token manquant');
    const tokens = await this.auth.refreshFromToken(refreshToken);
    this.setCookies(res, tokens.accessToken, tokens.refreshToken);
    return { message: 'Token renouvelé' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (refreshToken) {
      try { await this.auth.logout(refreshToken); } catch { /* silencieux */ }
    }
    this.clearCookies(res);
    return { message: 'Déconnecté' };
  }

  // ── Profil ────────────────────────────────────────────────────────────────
  @SkipThrottle()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtUser) { return user; }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: JwtUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  changePassword(@CurrentUser() user: JwtUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  @SkipThrottle()
  @Post('admin-activate')
  @HttpCode(HttpStatus.OK)
  adminActivate(@Body() dto: { email: string; adminKey: string }) {
    return this.auth.adminActivateUser(dto.email, dto.adminKey);
  }
}
