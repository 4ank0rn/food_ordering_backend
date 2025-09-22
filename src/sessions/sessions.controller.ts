import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Controller('sessions')
export class SessionsController {
  constructor(private svc: SessionsService) {}

  @Post()
  create(@Body() body: { qrCodeToken: string; meta?: any }) {
    return this.svc.createFromQr(body.qrCodeToken, body.meta);
  }

  @Get(':id/orders')
  getOrders(@Param('id') id: string) {
    return this.svc.getOrders(id);
  }
}
