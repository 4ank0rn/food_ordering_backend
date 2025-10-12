import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private svc: OrdersService) {}

  @Post()
  async create(@Body() body: any) {
    return await this.svc.create(body);
  }

  @Get()
  async getAll() {
    return await this.svc.getAll();
  }

  @Get('queue')
  async getQueue() {
    return await this.svc.getQueue();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return await this.svc.getOne(Number(id));
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' },
  ) {
    return await this.svc.updateStatus(Number(id), body.status);
  }
}
