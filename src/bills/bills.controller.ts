import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { BillsService } from './bills.service';

@Controller('bills')
export class BillsController {
  constructor(private svc: BillsService) {}

  @Post()
  create(@Body() body: { tableId: number }) {
    return this.svc.createForTable(body.tableId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(Number(id));
  }

  @Patch(':id/pay')
  pay(@Param('id') id: string) {
    return this.svc.pay(Number(id));
  }
}
