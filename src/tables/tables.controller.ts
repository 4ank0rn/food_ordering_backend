import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { TablesService } from './tables.service';

@Controller('tables')
export class TablesController {
  constructor(private svc: TablesService) {}

  @Post()
  async create(@Body() body: { tableNumber: number; capacity?: number }) {
    return await this.svc.create(body);
  }

  @Get()
  async list() {
    return await this.svc.findAll();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return await this.svc.findOne(Number(id));
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return await this.svc.updateStatus(Number(id), body.status);
  }

  @Get(':id/qr')
  async getQRCode(@Param('id') id: string) {
    return await this.svc.getQRCode(Number(id));
  }
}
