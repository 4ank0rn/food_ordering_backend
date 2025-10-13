import { Body, Controller, Get, Param, Patch, Post, Delete } from '@nestjs/common';
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
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'AVAILABLE' | 'OCCUPIED' },
  ) {
    return await this.svc.updateStatus(Number(id), body.status);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { tableNumber?: number; capacity?: number },
  ) {
    return await this.svc.update(Number(id), body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.svc.remove(Number(id));
  }

  @Get(':id/qr')
  async getQRCode(@Param('id') id: string) {
    return await this.svc.getQRCode(Number(id));
  }
}
