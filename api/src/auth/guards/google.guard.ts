import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  authenticate(req: any, options?: any) {
    const state = req.query?.state as string | undefined;
    super.authenticate(req, { ...options, ...(state ? { state } : {}) });
  }
}
