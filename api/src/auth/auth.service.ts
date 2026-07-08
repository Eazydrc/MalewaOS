import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../mail/mail.service';
import {
  RegisterDto,
  LoginDto,
  VerifyOtpDto,
  ResetPasswordDto,
  VerifyEmailDto,
  MfaVerifyDto,
} from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const BCRYPT_ROUNDS  = 12;
const OTP_TTL        = 600; // 10 min
const OTP_MAX_TRIES  = 3;
const MFA_TTL        = 300; // 5 min

// Rôles qui nécessitent un second facteur à la connexion
const MFA_ROLES = new Set<string>(['ADMIN', 'SUPER_ADMIN']);

@Injectable()
export class AuthService {
  constructor(
    private prisma:  PrismaService,
    private jwt:     JwtService,
    private config:  ConfigService,
    private redis:   RedisService,
    private mail:    MailService,
  ) {}

  // ── Inscription ───────────────────────────────────────────────────────────
  // Crée un compte inactif et envoie un OTP de vérification par email.
  // Le compte n'est activé qu'après vérification.

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        firstName:     dto.firstName,
        lastName:      dto.lastName,
        email:         dto.email,
        phone:         dto.phone,
        password:      hash,
        role:          'CLIENT',
        points:        100,
        emailVerified: false,
        isActive:      false, // inactif jusqu'à vérification email
      },
      select: { id: true, email: true, firstName: true },
    });

    const code = this.generateOtp();
    await this.storeOtp(dto.email, code, 'verify_email');
    try {
      await this.mail.sendOtp(dto.email, user.firstName, code);
    } catch (mailErr) {
      process.stderr.write(`[MAIL] sendOtp failed: ${mailErr?.message}\n`);
    }

    return {
      message: 'Compte créé ! Vérifiez votre email pour activer votre compte.',
      email:   dto.email,
    };
  }

  // ── Inscription livreur ───────────────────────────────────────────────────

  async registerDriver(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email déjà utilisé');

    const hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        firstName:     dto.firstName,
        lastName:      dto.lastName,
        email:         dto.email,
        phone:         dto.phone,
        password:      hash,
        role:          'LIVREUR',
        points:        0,
        emailVerified: false,
        isActive:      false,
      },
      select: { id: true, email: true, firstName: true },
    });

    const code = this.generateOtp();
    await this.storeOtp(dto.email, code, 'verify_email');
    try {
      await this.mail.sendOtp(dto.email, user.firstName, code);
    } catch (mailErr) {
      process.stderr.write(`[MAIL] sendOtp failed: ${mailErr?.message}\n`);
    }

    return {
      message: 'Compte livreur créé ! Vérifiez votre email pour activer votre compte.',
      email:   dto.email,
    };
  }

  // ── Vérification email ────────────────────────────────────────────────────
  // Valide le code OTP et active le compte.
  // Retourne les tokens (pose des cookies via le controller).

  async verifyEmail(dto: VerifyEmailDto) {
    const result = await this.validateOtp(dto.email, dto.code, 'verify_email');
    if (!result.valid) throw new BadRequestException(result.reason);

    const user = await this.prisma.user.findUnique({
      where:  { email: dto.email },
      select: { id: true, email: true, role: true, emailVerified: true },
    });
    if (!user)              throw new NotFoundException('Utilisateur introuvable');
    if (user.emailVerified) throw new BadRequestException('Email déjà vérifié');

    await this.prisma.user.update({
      where: { email: dto.email },
      data:  { emailVerified: true, isActive: true },
    });
    await this.redis.del(this.otpKey(dto.email, 'verify_email'));

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ── Renvoyer le code de vérification ─────────────────────────────────────

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where:  { email },
      select: { firstName: true, emailVerified: true },
    });
    // Silencieux — réponse identique qu'il y ait un compte ou non (anti-énumération)
    if (!user || user.emailVerified) {
      return { message: 'Si ce compte existe et n\'est pas encore vérifié, un nouveau code a été envoyé.' };
    }

    const code = this.generateOtp();
    await this.storeOtp(email, code, 'verify_email');
    try {
      await this.mail.sendOtp(email, user.firstName, code);
    } catch (mailErr) {
      process.stderr.write(`[MAIL] sendOtp failed: ${mailErr?.message}\n`);
    }
    return { message: 'Nouveau code envoyé.' };
  }

  // ── Connexion ─────────────────────────────────────────────────────────────
  // CLIENT / RESTAURANT → cookies JWT immédiats
  // ADMIN / SUPER_ADMIN  → MFA obligatoire (token éphémère + OTP email)

  async login(dto: LoginDto): Promise<
    { accessToken: string; refreshToken: string } |
    { mfaRequired: true; mfaToken: string }
  > {
    const user = await this.prisma.user.findUnique({
      where:  { email: dto.email },
      select: {
        id: true, email: true, role: true, firstName: true,
        password: true, isActive: true, emailVerified: true,
      },
    });
    if (!user || !user.password) throw new UnauthorizedException('Identifiants incorrects');

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Veuillez vérifier votre adresse email avant de vous connecter',
      );
    }
    if (!user.isActive) throw new UnauthorizedException('Compte désactivé');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Identifiants incorrects');

    // MFA pour Admin et SuperAdmin — TEMPORAIREMENT DÉSACTIVÉ (tests mobile)
    // if (MFA_ROLES.has(user.role)) {
    //   const mfaToken = randomBytes(32).toString('hex');
    //   await this.redis.set(
    //     `mfa:${mfaToken}`,
    //     JSON.stringify({ userId: user.id, email: user.email, role: user.role }),
    //     MFA_TTL,
    //   );
    //   const code = this.generateOtp();
    //   await this.storeOtp(user.email, code, 'mfa');
    //   await this.mail.sendOtp(user.email, user.firstName, code);
    //   return { mfaRequired: true, mfaToken };
    // }

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ── Vérification MFA (Admin / SuperAdmin) ─────────────────────────────────

  async mfaVerify(dto: MfaVerifyDto) {
    const raw = await this.redis.get(`mfa:${dto.mfaToken}`);
    if (!raw) throw new UnauthorizedException('Session MFA expirée, reconnectez-vous');

    const { userId, email, role } = JSON.parse(raw) as {
      userId: string; email: string; role: string;
    };

    const result = await this.validateOtp(email, dto.code, 'mfa');
    if (!result.valid) throw new BadRequestException(result.reason);

    // Nettoyage — usage unique
    await this.redis.del(`mfa:${dto.mfaToken}`);
    await this.redis.del(this.otpKey(email, 'mfa'));

    return this.issueTokens(userId, email, role);
  }

  // ── Google OAuth — code éphémère ──────────────────────────────────────────

  async googleLoginWithCode(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }): Promise<string> {
    const tokens = await this.googleLogin(googleUser);
    const code = randomBytes(32).toString('hex');
    await this.redis.set(`oauth_code:${code}`, JSON.stringify(tokens), 60);
    return code;
  }

  async exchangeGoogleCode(code: string) {
    if (!code || code.length !== 64) throw new UnauthorizedException('Code OAuth invalide');
    const key = `oauth_code:${code}`;
    const raw = await this.redis.get(key);
    if (!raw) throw new UnauthorizedException('Code OAuth expiré ou déjà utilisé');
    await this.redis.del(key);
    return JSON.parse(raw) as { accessToken: string; refreshToken: string };
  }

  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }) {
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: googleUser.googleId }, { email: googleUser.email }] },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          googleId:      googleUser.googleId,
          email:         googleUser.email,
          firstName:     googleUser.firstName,
          lastName:      googleUser.lastName,
          avatarUrl:     googleUser.avatarUrl,
          points:        100,
          emailVerified: true,  // Google a déjà vérifié l'email
          isActive:      true,
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data:  {
          googleId:      googleUser.googleId,
          avatarUrl:     googleUser.avatarUrl,
          emailVerified: true,
        },
      });
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ── Mot de passe oublié ───────────────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'Si ce compte existe, un code a été envoyé.' };
    const code = this.generateOtp();
    await this.storeOtp(email, code, 'reset');
    try {
      await this.mail.sendOtp(email, user.firstName, code);
    } catch (mailErr) {
      process.stderr.write(`[MAIL] sendOtp failed: ${mailErr?.message}\n`);
    }
    return { message: 'Si ce compte existe, un code a été envoyé.' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const result = await this.validateOtp(dto.email, dto.code, dto.purpose);
    if (!result.valid) throw new BadRequestException(result.reason);
    return { verified: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const result = await this.validateOtp(dto.email, dto.code, 'reset');
    if (!result.valid) throw new BadRequestException(result.reason);
    const hash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { email: dto.email }, data: { password: hash } });
    await this.redis.del(this.otpKey(dto.email, 'reset'));
    return { message: 'Mot de passe réinitialisé.' };
  }

  // ── Refresh / Logout ──────────────────────────────────────────────────────

  async refreshFromToken(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }
    const stored = await this.prisma.refreshToken.findFirst({
      where: { token: refreshToken, userId: payload.sub, revoked: false },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token révoqué');
    }
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    return this.issueTokens(payload.sub, payload.email, payload.role);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data:  { revoked: true },
    });
    return { message: 'Déconnecté.' };
  }

  // ── Profil ────────────────────────────────────────────────────────────────

  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string; phone?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName  && { lastName:  dto.lastName  }),
        ...(dto.phone     && { phone:     dto.phone     }),
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, points: true, avatarUrl: true, isActive: true,
      },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      throw new UnauthorizedException('Ce compte utilise une connexion sociale (Google)');
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Mot de passe actuel incorrect');
    const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Mot de passe modifié avec succès' };
  }

  // ── Helpers privés ────────────────────────────────────────────────────────

  private async issueTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };
    const accessToken = this.jwt.sign(payload, {
      secret:    this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret:    this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({ data: { token: refreshToken, userId, expiresAt } });
    return { accessToken, refreshToken };
  }

  // Cryptographiquement sûr — utilise crypto.randomInt au lieu de Math.random()
  private generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  private otpKey(email: string, purpose: string) {
    return `otp:${purpose}:${email}`;
  }

  private async storeOtp(email: string, code: string, purpose: string) {
    const key  = this.otpKey(email, purpose);
    const data = JSON.stringify({ code, attempts: 0, createdAt: Date.now() });
    try {
      await this.redis.set(key, data, OTP_TTL);
    } catch (err) {
      process.stderr.write(`[REDIS] storeOtp failed (non-fatal): ${err?.message}\n`);
    }
  }

  async adminActivateUser(email: string, adminKey: string) {
    const expectedKey = this.config.get<string>('ADMIN_SETUP_KEY');
    if (!expectedKey || adminKey !== expectedKey) {
      throw new UnauthorizedException('Clé invalide');
    }
    const user = await this.prisma.user.update({
      where: { email },
      data: { isActive: true, emailVerified: true },
      select: { id: true, email: true, firstName: true, role: true },
    });
    return { message: 'Compte activé', user };
  }

  private async validateOtp(
    email: string,
    code: string,
    purpose: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    const key  = this.otpKey(email, purpose);
    const raw  = await this.redis.get(key);
    if (!raw) return { valid: false, reason: 'Code expiré ou inexistant' };

    const data = JSON.parse(raw) as { code: string; attempts: number; createdAt: number };

    if (data.attempts >= OTP_MAX_TRIES) {
      await this.redis.del(key);
      return { valid: false, reason: 'Trop de tentatives. Redemandez un code.' };
    }

    // Comparaison en temps constant pour prévenir les attaques temporelles
    const storedBuf = Buffer.from(data.code);
    const inputBuf  = Buffer.from(code);
    const codeMatch = storedBuf.length === inputBuf.length &&
                      timingSafeEqual(storedBuf, inputBuf);

    if (!codeMatch) {
      data.attempts++;
      const ttl = await this.redis.ttl(key);
      await this.redis.set(key, JSON.stringify(data), ttl > 0 ? ttl : OTP_TTL);
      return { valid: false, reason: `Code incorrect (${OTP_MAX_TRIES - data.attempts} essai(s) restant(s))` };
    }

    return { valid: true };
  }
}
