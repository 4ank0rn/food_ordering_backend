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
      where: {
        sessionId,
        session: { deletedAt: null } // Only get orders from active sessions
      },
      include: {
        orderItems: {
          include: {
            menuItem: true
          },
          where: {
            menuItem: { deletedAt: null } // Only include active menu items
          }
        }
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Soft delete session
  async softDelete(sessionId: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { deletedAt: new Date() }
    });
  }

  // Hard delete session (permanent)
  async hardDelete(sessionId: string) {
    return this.prisma.session.delete({
      where: { id: sessionId }
    });
  }

  // Restore soft deleted session
  async restore(sessionId: string) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: { deletedAt: null }
    });
  }

  // Get all sessions (with optional filters)
  async findAll(includeDeleted = false) {
    const where: any = {};

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    return this.prisma.session.findMany({
      where,
      include: { table: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get deleted sessions
  async getDeleted() {
    return this.prisma.session.findMany({
      where: { deletedAt: { not: null } },
      include: { table: true },
      orderBy: { deletedAt: 'desc' }
    });
  }

  // Get session by ID with soft delete check
  async findOne(sessionId: string, includeDeleted = false) {
    const where: any = { id: sessionId };

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    return this.prisma.session.findFirst({
      where,
      include: { table: true }
    });
  }
}
