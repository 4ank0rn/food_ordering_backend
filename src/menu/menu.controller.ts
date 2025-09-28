import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private svc: MenuService) {}

  @Get()
  async list(@Query('onlyAvailable') onlyAvailable?: string) {
    return await this.svc.list(onlyAvailable === 'true');
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return await this.svc.get(Number(id));
  }

  @Post()
  async create(@Body() body: any) {
    return await this.svc.create(body);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return await this.svc.update(Number(id), body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.svc.remove(Number(id));
  }
}
