import { Body, Controller, Get, Param, Post, Delete, Patch, Query } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private svc: SessionsService) {}

  @Post()
  async create(@Body() body: { qrCodeToken: string; meta?: any }) {
    return await this.svc.getOrCreateFromQr(body.qrCodeToken, body.meta);
  }

  @Get(':id/orders')
  async getOrders(@Param('id') id: string) {
    return await this.svc.getOrders(id);
  }

  @Delete(':id')
  async softDelete(@Param('id') id: string) {
    return await this.svc.softDelete(id);
  }

  @Post(':id/checkout')
  async checkout(@Param('id') id: string) {
    return await this.svc.checkout(id);
  }

  @Get()
  async findAll(@Query('includeDeleted') includeDeleted?: string) {
    const include = includeDeleted === 'true';
    return await this.svc.findAll(include);
  }

}
