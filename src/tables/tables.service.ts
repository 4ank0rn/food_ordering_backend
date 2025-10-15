import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketsGateway } from '../sockets/sockets.gateway';
import { randomUUID } from 'crypto';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private sockets: SocketsGateway
  ) {}

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

  update(id: number, data: { tableNumber?: number; capacity?: number }) {
    return this.prisma.table.update({
      where: { id },
      data: {
        ...(data.tableNumber !== undefined && { tableNumber: data.tableNumber }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
      }
    });
  }

  async remove(id: number) {
    await this.prisma.table.delete({ where: { id } });
    return { message: 'Table deleted successfully' };
  }

  async updateStatus(id: number, status: 'AVAILABLE' | 'OCCUPIED', reason?: string) {
    const updatedTable = await this.prisma.table.update({
      where: { id },
      data: { status }
    });

    // Emit socket event for real-time updates
    try {
      this.sockets.emitTableStatusChanged(id, status, reason);
    } catch (e) {
      // Socket emission failed, but table status was updated
    }

    return updatedTable;
  }

  // Manual status toggle with session cleanup for staff
  async toggleStatusManually(id: number, newStatus: 'AVAILABLE' | 'OCCUPIED') {
    return this.prisma.$transaction(async (tx) => {
      // If changing to AVAILABLE, close all active sessions for this table
      if (newStatus === 'AVAILABLE') {
        const activeSessions = await tx.session.findMany({
          where: {
            tableId: id,
            deletedAt: null // Only active sessions
          }
        });

        if (activeSessions.length > 0) {
          // Close all active sessions
          await tx.session.updateMany({
            where: {
              tableId: id,
              deletedAt: null
            },
            data: { deletedAt: new Date() }
          });

          // Emit session ended events for all closed sessions
          for (const session of activeSessions) {
            try {
              this.sockets.emitSessionEnded(session, 'Manual table status change');
            } catch (e) {}
          }
        }
      }

      // Update table status
      const updatedTable = await tx.table.update({
        where: { id },
        data: { status: newStatus }
      });

      // Emit table status change event
      try {
        this.sockets.emitTableStatusChanged(id, newStatus, 'Manual status change by staff');
      } catch (e) {}

      return updatedTable;
    });
  }

  // Automatically set table to OCCUPIED when session is created
  async setOccupiedOnSessionStart(tableId: number) {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });
    if (!table) throw new NotFoundException('Table not found');

    // Only update if table is currently AVAILABLE
    if (table.status === 'AVAILABLE') {
      return this.updateStatus(tableId, 'OCCUPIED', 'Session started');
    }

    return table;
  }

  // Automatically set table to AVAILABLE when bill is paid (sessions closed)
  async setAvailableOnBillPaid(tableId: number) {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });
    if (!table) throw new NotFoundException('Table not found');

    // Check if there are any remaining active sessions
    const activeSessions = await this.prisma.session.findMany({
      where: {
        tableId,
        deletedAt: null
      }
    });

    // Only set to AVAILABLE if no active sessions remain
    if (activeSessions.length === 0 && table.status === 'OCCUPIED') {
      return this.updateStatus(tableId, 'AVAILABLE', 'Bill paid and sessions closed');
    }

    return table;
  }

  findByQr(qrCodeToken: string) {
    return this.prisma.table.findUnique({ where: { qrCodeToken } });
  }

  async getQRCode(id: number) {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table) throw new NotFoundException('Table not found');

    // Create QR code data that includes the frontend URL and table token
    const qrData = {
      tableId: table.id,
      tableNumber: table.tableNumber,
      qrCodeToken: table.qrCodeToken,
      url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/scan/${table.qrCodeToken}`,
      capacity: table.capacity,
    };

    return qrData;
  }

  // Get table status with active session info
  async getTableWithStatus(id: number) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        sessions: {
          where: { deletedAt: null }, // Only active sessions
          orderBy: { createdAt: 'desc' }
        },
        orders: {
          where: {
            session: { deletedAt: null } // Only orders from active sessions
          },
          include: {
            orderItems: {
              include: { menuItem: true }
            }
          }
        }
      }
    });

    if (!table) throw new NotFoundException('Table not found');

    return {
      ...table,
      hasActiveSessions: table.sessions.length > 0,
      activeSessionsCount: table.sessions.length,
      latestSessionId: table.sessions[0]?.id || null
    };
  }

  // Manual cleanup for debugging
  async cleanupSessionsForTable(tableId: number) {
    const activeSessions = await this.prisma.session.findMany({
      where: {
        tableId,
        deletedAt: null
      }
    });

    if (activeSessions.length === 0) {
      return { message: 'No active sessions to clean up', tableId, cleanedSessions: 0 };
    }

    // Close all active sessions
    await this.prisma.session.updateMany({
      where: {
        tableId,
        deletedAt: null
      },
      data: { deletedAt: new Date() }
    });

    // Emit session ended events
    for (const session of activeSessions) {
      try {
        this.sockets.emitSessionEnded(session, 'Manual cleanup');
      } catch (e) {}
    }

    // Update table status to AVAILABLE
    const updatedTable = await this.updateStatus(tableId, 'AVAILABLE', 'Sessions cleaned up manually');

    return {
      message: `Cleaned up ${activeSessions.length} active sessions`,
      tableId,
      cleanedSessions: activeSessions.length,
      updatedTable
    };
  }
}
