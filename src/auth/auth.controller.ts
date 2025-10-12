import { Body, Controller, Post, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/create-auth.dto';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private svc: AuthService) {}

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
    const user = await this.svc.googleLogin(req.user);

    // Set HTTP-only cookie for security
    res.cookie('admin_token', user.access_token, {
      httpOnly: true, // Prevents XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Redirect to admin frontend (port 5174) without token in URL
    const adminFrontendUrl = 'http://localhost:5174';
    res.redirect(`${adminFrontendUrl}/`);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    // Clear the authentication cookie
    response.clearCookie('admin_token');
    return { message: 'Logged out successfully' };
  }
}
