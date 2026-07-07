import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { AppModule } from './app.module';
import { corsOriginCallback } from './common/cors.util';

async function bootstrap() {
  process.stderr.write('[BOOT] bootstrap() started\n');

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  process.stderr.write('[BOOT] AppModule created\n');

  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

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

  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,
      forbidNonWhitelisted: true,
      transform:            true,
    }),
  );

  const frontendUrl = process.env.FRONTEND_URL;
  const nodeEnv     = process.env.NODE_ENV ?? 'development';

  if (nodeEnv === 'production') {
    if (!frontendUrl) throw new Error('[FATAL] FRONTEND_URL est requis en production');
    if (!frontendUrl.startsWith('https://')) throw new Error('[FATAL] FRONTEND_URL doit utiliser HTTPS en production');
  }

  app.enableCors({
    origin: corsOriginCallback,
    credentials:    true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Request-Id'],
    methods:        ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Tuer le processus warmup.js qui tient le PORT
  try {
    const pid = parseInt(readFileSync('/tmp/warmup.pid', 'utf-8').trim(), 10);
    process.kill(pid, 'SIGTERM');
    process.stderr.write(`[BOOT] warmup killed (pid=${pid})\n`);
    await new Promise(r => setTimeout(r, 200));
  } catch {
    // warmup pas lancé (dev local) — OK
  }

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port, '0.0.0.0');
  process.stderr.write(`[BOOT] NestJS ready on port ${port}\n`);
  console.log(`🚀 Elengi API running on http://localhost:${port}/api/v1`);
}

bootstrap().catch(err => {
  process.stderr.write(`[FATAL BOOTSTRAP] ${err?.stack ?? err}\n`);
  setTimeout(() => process.exit(1), 500);
});
