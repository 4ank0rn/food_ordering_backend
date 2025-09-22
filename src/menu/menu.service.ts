import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  list(onlyAvailable = false) {
    const where = onlyAvailable ? { isAvailable: true } : undefined;
    return this.prisma.menuItem.findMany({ where, orderBy: { name: 'asc' } });
  }

  get(id: number) {
    return this.prisma.menuItem.findUnique({ where: { id } });
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

  remove(id: number) {
    return this.prisma.menuItem.delete({ where: { id } });
  }
}
