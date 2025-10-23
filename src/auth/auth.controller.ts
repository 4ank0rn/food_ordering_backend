import { Body, Controller, Post, Get, UseGuards, Req, Res, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/create-auth.dto';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsersService } from '../users/users.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private svc: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.svc.validateUser(loginDto.email, loginDto.password);
    const result = await this.svc.login(user);

    // Set HTTP-only cookie for security
    response.cookie('admin_token', result.access_token, {
      httpOnly: true, // Prevents XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return user info without token (token is in cookie)
    return { user: result.user };
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    try {
      const user = await this.svc.googleLogin(req.user);

      // Set HTTP-only cookie for security
      res.cookie('admin_token', user.access_token, {
        httpOnly: true, // Prevents XSS attacks
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax', // CSRF protection
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Redirect to admin frontend (port 5174) without token in URL
      const adminFrontendUrl = `${process.env.ADMIN_URL}`;
      res.redirect(`${adminFrontendUrl}/`);
    } catch (error) {
      // If login fails (e.g., user not in staff list), redirect to login with error
      const adminFrontendUrl = `${process.env.ADMIN_URL}`;
      const errorMessage = encodeURIComponent('Access denied. You are not authorized as staff. Please contact admin.');
      res.redirect(`${adminFrontendUrl}/login?error=${errorMessage}`);
    }
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    // Clear the authentication cookie
    response.clearCookie('admin_token');
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: any) {
    const userId = req.user.id;
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      picture: user.picture,
    };
  }
}
