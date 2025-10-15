import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketsGateway } from '../sockets/sockets.gateway';
import { BillsService } from '../bills/bills.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private sockets: SocketsGateway,
    private billsService: BillsService,
  ) {}

  async create(dto: {
    sessionId?: string;
    tableId?: number;
    items: { menuItemId: number; quantity: number; note?: string }[];
  }) {
    let tableId = dto.tableId;
    if (!tableId) {
      if (!dto.sessionId)
        throw new BadRequestException('tableId or sessionId required');
      const session = await this.prisma.session.findUnique({
        where: { id: dto.sessionId },
      });
      if (!session) throw new NotFoundException('Session not found');
      tableId = session.tableId;
    }

    if (!dto.items || dto.items.length === 0)
      throw new BadRequestException('items required');

    const order = await this.prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          tableId,
          sessionId: dto.sessionId,
          status: 'PENDING',
          orderItems: {
            create: dto.items.map((i) => ({
              menuItemId: i.menuItemId,
              quantity: i.quantity,
              note: i.note,
            })),
          },
        },
        include: { orderItems: { include: { menuItem: true } } },
      });
      return o;
    });

    // Automatically create or update bill for this order
    try {
      await this.billsService.createOrUpdateForOrder(order.id);
    } catch (error) {
      console.error('Failed to create/update bill for order:', error);
      // Don't fail the order creation if bill creation fails
    }

    // notify staff and customer
    try {
      this.sockets.emitOrderCreated(order);
    } catch (e) {}

    return order;
  }

  async getAll() {
    return this.prisma.order.findMany({
      include: {
        orderItems: { include: { menuItem: true } },
        session: true,
        table: {
          select: {
            tableNumber: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async getQueue() {
    return this.prisma.order.findMany({
      where: { status: 'PENDING' },
      include: {
        orderItems: { include: { menuItem: true } },
        session: true,
        table: true,
      },
      orderBy: [{ createdAt: 'asc' }],
    });
  }

  async updateStatus(
    orderId: number,
    status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED',
  ) {
    const current = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!current) throw new NotFoundException('Order not found');
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    try {
      this.sockets.emitOrderStatusUpdated(updated);
    } catch (e) {}

    return updated;
  }

  getOne(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { orderItems: { include: { menuItem: true } } },
    });
  }
}
