import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  create(data: { tableNumber: number; capacity?: number }) {
    return this.prisma.table.create({
      data: {
        tableNumber: data.tableNumber,
        capacity: data.capacity ?? 2,
        qrCodeToken: randomUUID(),
      },
    });
  }

  findAll() {
    return this.prisma.table.findMany();
  }

  findOne(id: number) {
    return this.prisma.table.findUnique({ where: { id } });
  }

  updateStatus(id: number, status: string) {
    return this.prisma.table.update({ where: { id }, data: { status } });
  }

  findByQr(qrCodeToken: string) {
    return this.prisma.table.findUnique({ where: { qrCodeToken } });
  }
}
