import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private svc: OrdersService) {}

  @Post()
  create(@Body() body: any) {
    return this.svc.create(body);
  }

  @Get('queue')
  getQueue() {
    return this.svc.getQueue();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.getOne(Number(id));
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' },
  ) {
    return this.svc.updateStatus(Number(id), body.status);
  }
}
