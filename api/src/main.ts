import * as http from 'http';

// Démarre un serveur HTTP minimal IMMÉDIATEMENT sur PORT
// pour passer le healthcheck Railway pendant que NestJS s'initialise
const PORT = process.env.PORT ?? 3000;
let nestApp: any = null;
const warmupServer = http.createServer((req, res) => {
  if (nestApp) {
    // NestJS prêt : déléguer
    nestApp.getHttpServer().emit('request', req, res);
  } else {
    // Encore en cours d'initialisation : répondre 200 pour le healthcheck
    if (req.url === '/api/v1/health' || req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'starting' }));
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'starting', message: 'API initializing...' }));
    }
  }
});
warmupServer.listen(PORT, '0.0.0.0', () => {
  process.stderr.write(`[WARMUP] Listening on port ${PORT}\n`);
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

  // NestJS prend le relais : stopper le warmup server et écouter sur le même port
  nestApp = app;
  warmupServer.close();
  await app.listen(PORT, '0.0.0.0');
  process.stderr.write(`[BOOT] NestJS ready on port ${PORT}\n`);
  console.log(`🚀 Elengi API running on http://localhost:${PORT}/api/v1`);
}

bootstrap().catch(err => {
  process.stderr.write(`[FATAL BOOTSTRAP] ${err?.stack ?? err}\n`);
  setTimeout(() => process.exit(1), 500);
});
