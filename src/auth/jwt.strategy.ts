import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extract JWT from both cookies and Authorization header
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First try to get from cookie (for admin dashboard)
        ExtractJwt.fromExtractors([
          (request: Request) => {
            return request?.cookies?.admin_token;
          },
        ]),
        // Fallback to Authorization header (for API clients)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: process.env.JWT_SECRET || 'fallback_secret',
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, name: payload.name };
  }
}
