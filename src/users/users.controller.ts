import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('staff')
  async create(@Body() body: { name: string; email: string; password: string }) {
    return await this.svc.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('internship')
  async createInternship(@Body() body: { email: string }) {
    return await this.svc.createInternshipUser(body.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list() {
    return await this.svc.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async get(@Param('id') id: string) {
    return await this.svc.findOne(Number(id));
  }
}
