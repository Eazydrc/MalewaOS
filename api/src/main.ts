process.on('uncaughtException', (err) => {
  process.stderr.write(`[UNCAUGHT EXCEPTION] ${err?.stack ?? err}\n`);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  process.stderr.write(`[UNHANDLED REJECTION] ${reason}\n`);
  process.exit(1);
});

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { corsOriginCallback } from './common/cors.util';

async function bootstrap() {
  process.stderr.write('[BOOT] bootstrap() started\n');
  process.stdout.write('[BOOT] bootstrap() started\n');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  process.stderr.write('[BOOT] AppModule created\n');
  process.stdout.write('[BOOT] AppModule created\n');

  // ── Fichiers statiques : uploads ───────────────────────────────────────────
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  // ── Sécurité : headers HTTP ────────────────────────────────────────────────
  app.use(helmet.default({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'"],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        imgSrc:      ["'self'", 'data:', 'https:'],
        connectSrc:  ["'self'"],
        frameSrc:    ["'none'"],
        objectSrc:   ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // ── Cookie parser (requis pour les HttpOnly cookies) ──────────────────────
  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  // ── Validation globale ─────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,
      forbidNonWhitelisted: true,
      transform:            true,
    }),
  );

  // ── CORS strict ────────────────────────────────────────────────────────────
  const frontendUrl = process.env.FRONTEND_URL;
  const nodeEnv     = process.env.NODE_ENV ?? 'development';

  if (nodeEnv === 'production') {
    if (!frontendUrl) throw new Error('[FATAL] FRONTEND_URL est requis en production');
    if (!frontendUrl.startsWith('https://')) throw new Error('[FATAL] FRONTEND_URL doit utiliser HTTPS en production');
  }

  app.enableCors({
    origin: corsOriginCallback,
    credentials:    true,                              // indispensable pour les cookies cross-origin
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Request-Id'],
    methods:        ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Elengi API running on http://localhost:${port}/api/v1`);
  console.log(`   NODE_ENV: ${nodeEnv} | CORS: ${frontendUrl ?? 'localhost (dev)'}`);
}
bootstrap().catch(err => {
  process.stderr.write(`[FATAL BOOTSTRAP] ${err?.stack ?? err}\n`);
  process.stdout.write(`[FATAL BOOTSTRAP] ${err?.message ?? err}\n`);
  process.exit(1);
});
