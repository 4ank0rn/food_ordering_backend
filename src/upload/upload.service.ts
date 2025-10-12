/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
// src/upload/upload.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  constructor(@Inject('Cloudinary') private readonly cloudinary: typeof Cloudinary) {}

  uploadImageBuffer(file: Express.Multer.File, folder = 'uploads'): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        { folder },
        (err, result) => (err ? reject(err) : resolve(result!)),
      );
      streamifier.createReadStream(file.buffer).pipe(stream);
    });
  }

  updateImage(publicId: string, file: Express.Multer.File, folder = 'uploads'): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      // Extract just the filename from the full public_id path
      const filename = publicId.includes('/') ? publicId.split('/').pop() : publicId;

      const stream = this.cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: filename, // Use just the filename, not the full path
          overwrite: true,
          invalidate: true,
          resource_type: 'image'
        },
        (err, result) => (err ? reject(err) : resolve(result!)),
      );
      streamifier.createReadStream(file.buffer).pipe(stream);
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    try {
      return await this.cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw error;
    }
  }
}