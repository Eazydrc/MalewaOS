import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private config: ConfigService) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const apiKey = this.config.get<string>('CALLMEBOT_API_KEY');

    if (!apiKey) {
      this.logger.warn('WhatsApp non configuré (CALLMEBOT_API_KEY manquant)');
      return;
    }

    const message = encodeURIComponent(`Delipose - Code de vérification : *${code}*\n\nValable 5 minutes. Ne le partagez pas.`);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${message}&apikey=${apiKey}`;

    try {
      const res = await fetch(url);
      const text = await res.text();
      if (res.ok && !text.includes('ERROR')) {
        this.logger.log(`OTP WhatsApp envoyé à ${phone}`);
      } else {
        this.logger.error(`CallMeBot error: ${text}`);
      }
    } catch (err) {
      this.logger.error(`CallMeBot fetch failed: ${err?.message}`);
    }
  }
}
