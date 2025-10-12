import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MenuService } from './menu.service';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'];

@Controller('menu')
export class MenuController {
  constructor(private svc: MenuService) {}

  @Get()
  async list(
    @Query('onlyAvailable') onlyAvailable?: string,
    @Query('includeDeleted') includeDeleted?: string
  ) {
    return await this.svc.list(
      onlyAvailable === 'true',
      includeDeleted === 'true'
    );
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return await this.svc.get(Number(id));
  }

  @Post()
  async create(@Body() body: any) {
    return await this.svc.create(body);
  }

  @Post('with-image')
  @UseInterceptors(FileInterceptor('image'))
  async createWithImage(
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (file && !ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported image type');
    }
    return await this.svc.createWithImage(body, file);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return await this.svc.update(Number(id), body);
  }

  @Patch(':id/with-image')
  @UseInterceptors(FileInterceptor('image'))
  async updateWithImage(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (file && !ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported image type');
    }
    return await this.svc.updateWithImage(Number(id), body, file);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.svc.remove(Number(id));
  }

  @Delete(':id/hard')
  async hardDelete(@Param('id') id: string) {
    return await this.svc.hardDelete(Number(id));
  }

  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    return await this.svc.restore(Number(id));
  }

  @Get('deleted/list')
  async getDeleted() {
    return await this.svc.getDeleted();
  }
}
