import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillsService {
  constructor(private prisma: PrismaService) {}

  async createForTable(tableId: number) {
    const orders = await this.prisma.order.findMany({
      where: { tableId, billId: null, status: { not: 'CANCELLED' } },
      include: { orderItems: { include: { menuItem: true } } },
    });
    if (!orders || orders.length === 0)
      throw new BadRequestException('No orders to bill');

    let total = 0;
    for (const o of orders) {
      for (const it of o.orderItems) {
        total += it.quantity * it.menuItem.price;
      }
    }

    const bill = await this.prisma.$transaction(async (tx) => {
      const b = await tx.bill.create({ data: { tableId, totalAmount: total } });
      await Promise.all(
        orders.map((o) =>
          tx.order.update({ where: { id: o.id }, data: { billId: b.id } }),
        ),
      );
      return b;
    });

    return bill;
  }

  get(id: number) {
    return this.prisma.bill.findUnique({
      where: { id },
      include: {
        orders: { include: { orderItems: { include: { menuItem: true } } } },
      },
    });
  }

  async pay(id: number) {
    const b = await this.prisma.bill.findUnique({ where: { id } });
    if (!b) throw new NotFoundException('Bill not found');
    if (b.isPaid) throw new BadRequestException('Already paid');
    return this.prisma.bill.update({
      where: { id },
      data: { isPaid: true, paidAt: new Date() },
    });
  }
}
