import {
  Controller, Post, UseInterceptors, UploadedFile,
  BadRequestException, UseGuards, Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

@Controller('upload')
export class UploadController {
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('RESTAURANT', 'ADMIN', 'SUPER_ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
          return cb(new BadRequestException('Type de fichier non autorisé. Utilisez JPG, PNG, WEBP ou GIF.'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: import('express').Request) {
    if (!file) throw new BadRequestException('Aucun fichier reçu.');

    // Build absolute URL using request host
    const firstHeader = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;
    const proto  = firstHeader(req.headers['x-forwarded-proto']) ?? req.protocol ?? 'http';
    const host   = firstHeader(req.headers['x-forwarded-host']) ?? req.get('host') ?? 'localhost:3001';
    const url    = `${proto}://${host}/uploads/${file.filename}`;

    return { url, filename: file.filename, size: file.size };
  }
}
