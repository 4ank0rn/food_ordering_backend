import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private svc: SessionsService) {}

  @Post()
  async create(@Body() body: { qrCodeToken: string; meta?: any }) {
    return await this.svc.createFromQr(body.qrCodeToken, body.meta);
  }

  @Get(':id/orders')
  async getOrders(@Param('id') id: string) {
    return await this.svc.getOrders(id);
  }
}
