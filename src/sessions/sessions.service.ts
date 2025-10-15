import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TablesService } from '../tables/tables.service';
import { SocketsGateway } from '../sockets/sockets.gateway';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => TablesService))
    private tablesService: TablesService,
    private sockets: SocketsGateway
  ) {}

  async getOrCreateFromQr(qrCodeToken: string, meta?: any) {
    const table = await this.prisma.table.findUnique({
      where: { qrCodeToken },
    });
    if (!table) throw new NotFoundException('Table not found');

    // Check if there's already an active session for this table
    const existingSession = await this.prisma.session.findFirst({
      where: {
        tableId: table.id,
        deletedAt: null // Only active sessions
      },
      orderBy: { createdAt: 'desc' } // Get the most recent session
    });

    // If there's an active session, check if it's still valid (within 6 hours)
    if (existingSession) {
      const now = new Date();
      const sessionAge = now.getTime() - existingSession.createdAt.getTime();
      const sixHoursInMs = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

      // If session is older than 6 hours, close it and create a new one
      if (sessionAge > sixHoursInMs) {
        await this.prisma.session.update({
          where: { id: existingSession.id },
          data: { deletedAt: now }
        });

        // Create a new session
        const newSession = await this.prisma.session.create({
          data: { tableId: table.id, metaJson: meta ?? {} },
        });

        // Set table status to OCCUPIED
        try {
          await this.tablesService.setOccupiedOnSessionStart(table.id);
          this.sockets.emitSessionStarted(newSession);
        } catch (e) {
          // Continue even if table status update fails
        }

        const expiresAt = new Date(newSession.createdAt.getTime() + sixHoursInMs);
        return {
          ...newSession,
          expiresAt: expiresAt.toISOString(),
          isNewSession: true,
          message: 'Previous session expired. New session created.'
        };
      }

      // Session is still valid, but ensure table status is OCCUPIED
      try {
        await this.tablesService.setOccupiedOnSessionStart(table.id);
      } catch (e) {
        // Continue even if table status update fails
      }

      const expiresAt = new Date(existingSession.createdAt.getTime() + sixHoursInMs);
      return {
        ...existingSession,
        expiresAt: expiresAt.toISOString(),
        isNewSession: false,
        message: 'Joined existing table session.'
      };
    }

    // If no active session exists, create a new one
    const session = await this.prisma.session.create({
      data: { tableId: table.id, metaJson: meta ?? {} },
    });

    // Set table status to OCCUPIED
    try {
      await this.tablesService.setOccupiedOnSessionStart(table.id);
      this.sockets.emitSessionStarted(session);
    } catch (e) {
      // Continue even if table status update fails
    }

    const sixHoursInMs = 6 * 60 * 60 * 1000;
    const expiresAt = new Date(session.createdAt.getTime() + sixHoursInMs);
    return {
      ...session,
      expiresAt: expiresAt.toISOString(),
      isNewSession: true,
      message: 'New session created.'
    };
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
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const updatedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: { deletedAt: new Date() }
    });

    // Emit session ended event
    try {
      this.sockets.emitSessionEnded(updatedSession, 'Session manually closed');
    } catch (e) {}

    // Check if table should be set to AVAILABLE
    try {
      await this.tablesService.setAvailableOnBillPaid(session.tableId);
    } catch (e) {
      // Continue even if table status update fails
    }

    return updatedSession;
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

  // Validate session - check if session exists and is not expired
  async validateSession(sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        deletedAt: null // Only active sessions
      }
    });

    if (!session) {
      return { isValid: false, message: 'Session not found or expired' };
    }

    // Check if session is older than 6 hours
    const now = new Date();
    const sessionAge = now.getTime() - session.createdAt.getTime();
    const sixHoursInMs = 6 * 60 * 60 * 1000;

    if (sessionAge > sixHoursInMs) {
      // Mark session as expired
      const expiredSession = await this.prisma.session.update({
        where: { id: sessionId },
        data: { deletedAt: now }
      });

      // Emit session ended event
      try {
        this.sockets.emitSessionEnded(expiredSession, 'Session expired');
        await this.tablesService.setAvailableOnBillPaid(session.tableId);
      } catch (e) {}

      return { isValid: false, message: 'Session expired' };
    }

    const expiresAt = new Date(session.createdAt.getTime() + sixHoursInMs);

    // Get table information with the session
    const table = await this.prisma.table.findUnique({
      where: { id: session.tableId }
    });

    return {
      isValid: true,
      session: {
        ...session,
        expiresAt: expiresAt.toISOString()
      },
      table: table,
      message: 'Session is valid'
    };
  }

  // Checkout session - soft delete and return total amount
  async checkout(sessionId: string) {
    // First, get all orders for this session to calculate total
    const orders = await this.prisma.order.findMany({
      where: {
        sessionId,
        session: { deletedAt: null } // Only active sessions
      },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        }
      }
    });

    // Calculate total amount
    const totalAmount = orders.reduce((total, order) => {
      return total + order.orderItems.reduce((orderTotal, item) => {
        return orderTotal + (item.menuItem.price * item.quantity);
      }, 0);
    }, 0);

    // Soft delete the session (checkout)
    const closedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: { deletedAt: new Date() }
    });

    // Emit session ended event
    try {
      this.sockets.emitSessionEnded(closedSession, 'Session checked out');
    } catch (e) {}

    return {
      session: closedSession,
      orders,
      totalAmount
    };
  }
}
