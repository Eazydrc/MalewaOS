import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host:       this.config.get<string>('MAIL_HOST'),
      port:       this.config.get<number>('MAIL_PORT', 587),
      secure:     false,    // false = STARTTLS sur port 587
      requireTLS: true,     // Refuse la connexion si STARTTLS non disponible
      tls: {
        rejectUnauthorized: this.config.get<string>('NODE_ENV') === 'production',
      },
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendOtp(email: string, firstName: string, code: string) {
    // En dev, log le code directement — pas besoin de vrai SMTP
    if (this.config.get<string>('NODE_ENV') !== 'production') {
      this.logger.log(`\n──────────────────────────────\n📧 OTP pour ${email}: ${code}\n──────────────────────────────`);
      return;
    }

    const from = `"Elengi" <${this.config.get('MAIL_USER')}>`;
    try {
      await this.transporter.sendMail({
        from,
        to: email,
        subject: 'Votre code de vérification Elengi',
        html: this.buildOtpTemplate(firstName, code),
      });
    } catch (err) {
      this.logger.error(`Échec envoi OTP à ${email}`, err);
    }
  }

  private buildOtpTemplate(firstName: string, code: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:32px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:28px;font-weight:900;color:#E85D26;">Elen</span>
      <span style="font-size:28px;font-weight:900;color:#09090B;">gi</span>
    </div>
    <h2 style="color:#09090B;margin:0 0 8px;">Bonjour ${firstName},</h2>
    <p style="color:#71717A;margin:0 0 24px;">
      Utilisez ce code pour vérifier votre identité. Il expire dans <strong>10 minutes</strong>.
    </p>
    <div style="text-align:center;padding:24px;background:#F9F9FB;border-radius:12px;margin-bottom:24px;">
      <span style="font-size:40px;font-weight:900;letter-spacing:16px;color:#09090B;">${code}</span>
    </div>
    <p style="color:#A1A1AA;font-size:13px;text-align:center;">
      Si vous n'avez pas demandé ce code, ignorez cet email.
    </p>
  </div>
</body>
</html>`;
  }
}
