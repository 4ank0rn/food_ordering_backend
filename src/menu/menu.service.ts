import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

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
    foodtype?: string;
  }) {
    return this.prisma.menuItem.create({ data });
  }

  update(
    id: number,
    data: Partial<{
      name: string;
      price: number;
      description?: string;
      isAvailable?: boolean;
    }>,
  ) {
    return this.prisma.menuItem.update({ where: { id }, data });
  }

  // Soft delete
  remove(id: number) {
    return this.prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  // Hard delete (permanent)
  hardDelete(id: number) {
    return this.prisma.menuItem.delete({ where: { id } });
  }

  // Restore soft deleted item
  restore(id: number) {
    return this.prisma.menuItem.update({
      where: { id },
      data: { deletedAt: null }
    });
  }

  // Get only deleted items
  getDeleted() {
    return this.prisma.menuItem.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' }
    });
  }
}
