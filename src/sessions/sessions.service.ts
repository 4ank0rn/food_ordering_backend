import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async createFromQr(qrCodeToken: string, meta?: any) {
    const table = await this.prisma.table.findUnique({
      where: { qrCodeToken },
    });
    if (!table) throw new NotFoundException('Table not found');
    const session = await this.prisma.session.create({
      data: { tableId: table.id, metaJson: meta ?? {} },
    });
    return session;
  }

  getOrders(sessionId: string) {
    return this.prisma.order.findMany({
      where: { sessionId },
      include: { orderItems: { include: { menuItem: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
