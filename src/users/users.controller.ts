import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('staff')
  create(@Body() body: { name: string; email: string; password: string }) {
    return this.svc.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list() {
    return this.svc.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.findOne(Number(id));
  }
}
