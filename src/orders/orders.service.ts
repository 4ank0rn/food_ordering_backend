import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketsGateway } from '../sockets/sockets.gateway';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private sockets: SocketsGateway,
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

    // notify staff
    try {
      this.sockets.emitToStaff('order:created', order);
    } catch (e) {}

    return order;
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
      this.sockets.emitToStaff('order:status_updated', updated);
      this.sockets.emitToTable(
        updated.tableId,
        'order:status_updated',
        updated,
      );
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
