import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !user.password)
      throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, name: user.name };
    return { access_token: this.jwt.sign(payload) };
  }

  async googleLogin(googleUser: any) {
    const { email, firstName, lastName, picture } = googleUser;

    // First check if user exists by email (must be pre-approved)
    const existingUser = await this.users.findByEmail(email);
    if (!existingUser) {
      throw new UnauthorizedException('Access denied. Please contact admin to add your email to the system.');
    }

    // Update existing user with Google data if they exist
    const user = await this.users.findOrCreateGoogleUser({
      googleId: googleUser.id || email, // Use Google ID or email as fallback
      email: email,
      name: `${firstName} ${lastName}`,
      picture: picture,
    });

    // Generate JWT token
    const payload = { sub: user.id, email: user.email, name: user.name };
    return {
      access_token: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        userType: user.userType,
      }
    };
  }
}
