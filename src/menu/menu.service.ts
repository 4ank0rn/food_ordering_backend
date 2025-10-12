import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { FoodType } from '@prisma/client';

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService
  ) {}

  list(onlyAvailable = false, includeDeleted = false) {
    const where: any = {};

    if (onlyAvailable) {
      where.isAvailable = true;
    }

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    return this.prisma.menuItem.findMany({ where, orderBy: { name: 'asc' } });
  }

  get(id: number, includeDeleted = false) {
    const where: any = { id };

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    return this.prisma.menuItem.findFirst({ where });
  }

  create(data: {
    name: string;
    price: number;
    description?: string;
    foodtype: FoodType;
    photoUrl?: string;
    photoId?: string;
  }) {
    return this.prisma.menuItem.create({ data });
  }

  async createWithImage(
    data: {
      name: string;
      price: string | number;
      description?: string;
      foodtype: FoodType | string;
      isAvailable?: string | boolean;
    },
    file?: Express.Multer.File
  ) {
    let photoData: { photoUrl?: string; photoId?: string } = {};

    if (file) {
      const uploadResult = await this.uploadService.uploadImageBuffer(file, 'menu-items');
      photoData.photoUrl = uploadResult.secure_url;
      photoData.photoId = uploadResult.public_id;
    }

    return this.prisma.menuItem.create({
      data: {
        name: data.name,
        price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
        description: data.description,
        foodtype: data.foodtype as FoodType,
        isAvailable: typeof data.isAvailable === 'string' ? data.isAvailable === 'true' : (data.isAvailable ?? true),
        ...photoData
      }
    });
  }

  update(
    id: number,
    data: Partial<{
      name: string;
      price: number;
      description?: string;
      foodtype: FoodType;
      isAvailable?: boolean;
      photoUrl?: string;
      photoId?: string;
    }>,
  ) {
    return this.prisma.menuItem.update({ where: { id }, data });
  }

  async updateWithImage(
    id: number,
    data: Partial<{
      name: string;
      price: number;
      description?: string;
      foodtype: FoodType;
      isAvailable?: boolean;
    }>,
    file?: Express.Multer.File
  ) {
    const existingItem = await this.get(id);
    if (!existingItem) {
      throw new Error('Menu item not found');
    }

    let photoData: { photoUrl?: string; photoId?: string } = {};

    if (file) {
      const uploadResult = await this.uploadService.updateImage(
        existingItem.photoId || '',
        file,
        'menu-items'
      );
      photoData.photoUrl = uploadResult.secure_url;
      photoData.photoId = uploadResult.public_id;
    }

    return this.prisma.menuItem.update({
      where: { id },
      data: { ...data, ...photoData }
    });
  }

  // Soft delete
  async remove(id: number) {
    return this.prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Hard delete (permanent)
  async hardDelete(id: number) {
    const item = await this.get(id, true);
    if (item?.photoId) {
      await this.uploadService.deleteImage(item.photoId);
    }
    return this.prisma.menuItem.delete({ where: { id } });
  }

  // Restore soft deleted item
  restore(id: number) {
    return this.prisma.menuItem.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  // Get only deleted items
  getDeleted() {
    return this.prisma.menuItem.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
  }
}
