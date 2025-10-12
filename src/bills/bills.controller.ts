import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { BillsService } from './bills.service';

@Controller('bills')
export class BillsController {
  constructor(private svc: BillsService) {}

  @Post()
  async create(@Body() body: { tableId: number }) {
    return await this.svc.createForTable(body.tableId);
  }

  @Get()
  async getAll() {
    return await this.svc.getAll();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return await this.svc.get(Number(id));
  }

  @Patch(':id/pay')
  async pay(@Param('id') id: string) {
    return await this.svc.pay(Number(id));
  }
}
