import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TablesService } from './tables.service';

@Controller('tables')
export class TablesController {
  constructor(private svc: TablesService) {}

  @Post()
  create(@Body() body: { tableNumber: number; capacity?: number }) {
    return this.svc.create(body);
  }

  @Get()
  list() {
    return this.svc.findAll();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.findOne(Number(id));
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.svc.updateStatus(Number(id), body.status);
  }
}
