/* eslint-disable prettier/prettier */
// src/upload/upload.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

const ALLOW = ['image/jpeg','image/png','image/webp','image/avif','image/heic','image/heif'];

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOW.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported image type');
    }
    const result = await this.uploadService.uploadImageBuffer(file, 'uploads');

    // ส่งค่าที่ frontend ต้องใช้จริงกลับไป
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format: result.format,
    };
  }
}
