import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketsGateway } from '../sockets/sockets.gateway';
import { TablesService } from '../tables/tables.service';

@Injectable()
export class BillsService {
  constructor(
    private prisma: PrismaService,
    private sockets: SocketsGateway,
    @Inject(forwardRef(() => TablesService))
    private tablesService: TablesService,
  ) {}

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

  // Create or update bill when new order is added
  async createOrUpdateForOrder(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { menuItem: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Check if there's already an unpaid bill for this table
    let existingBill = await this.prisma.bill.findFirst({
      where: {
        tableId: order.tableId,
        isPaid: false,
      },
    });

    return this.prisma.$transaction(async (tx) => {
      // Calculate the order total
      const orderTotal = order.orderItems.reduce((total, item) => {
        return total + item.quantity * item.menuItem.price;
      }, 0);

      if (existingBill) {
        // Update existing unpaid bill
        const updatedBill = await tx.bill.update({
          where: { id: existingBill.id },
          data: {
            totalAmount: existingBill.totalAmount + orderTotal,
          },
        });

        // Link order to this bill
        await tx.order.update({
          where: { id: orderId },
          data: { billId: existingBill.id },
        });

        // Emit bill updated event
        try {
          this.sockets.emitToStaff('bill_updated', updatedBill);
          this.sockets.emitToTable(order.tableId, 'bill_updated', {
            billId: updatedBill.id,
            totalAmount: updatedBill.totalAmount,
            message: 'Your bill has been updated.',
          });
        } catch (e) {}

        return updatedBill;
      } else {
        // Create new bill
        const newBill = await tx.bill.create({
          data: {
            tableId: order.tableId,
            totalAmount: orderTotal,
          },
        });

        // Link order to new bill
        await tx.order.update({
          where: { id: orderId },
          data: { billId: newBill.id },
        });

        // Emit new bill created event
        try {
          this.sockets.emitBillCreated(newBill);
        } catch (e) {}

        return newBill;
      }
    });
  }

  async getAll() {
    return this.prisma.bill.findMany({
      include: {
        orders: {
          include: {
            orderItems: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        table: {
          // <-- include ตาราง table
          select: {
            tableNumber: true, // <-- เอาเฉพาะ tableNumber
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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
    const b = await this.prisma.bill.findUnique({
      where: { id },
      include: { orders: true },
    });
    if (!b) throw new NotFoundException('Bill not found');
    if (b.isPaid) throw new BadRequestException('Already paid');

    // Use transaction to ensure both bill payment and session closure happen together
    return this.prisma.$transaction(async (tx) => {
      // Mark bill as paid
      const paidBill = await tx.bill.update({
        where: { id },
        data: { isPaid: true, paidAt: new Date() },
      });

      // Find and close any active sessions for this table
      const activeSessions = await tx.session.findMany({
        where: {
          tableId: b.tableId,
          deletedAt: null, // Only active sessions
        },
      });

      // Close all active sessions for this table
      if (activeSessions.length > 0) {
        await tx.session.updateMany({
          where: {
            tableId: b.tableId,
            deletedAt: null,
          },
          data: { deletedAt: new Date() },
        });

        // Emit session ended events for each closed session
        for (const session of activeSessions) {
          try {
            this.sockets.emitSessionEnded(
              session,
              'Bill paid and session closed',
            );
          } catch (e) {}
        }
      }

      // After closing sessions within transaction, update table status to AVAILABLE
      // Since we're in a transaction and just closed all sessions, we can safely set to AVAILABLE
      const table = await tx.table.findUnique({ where: { id: b.tableId } });
      if (table && table.status === 'OCCUPIED') {
        await tx.table.update({
          where: { id: b.tableId },
          data: { status: 'AVAILABLE' },
        });

        // Emit table status change event
        try {
          this.sockets.emitTableStatusChanged(
            b.tableId,
            'AVAILABLE',
            'Bill paid and sessions closed',
          );
        } catch (e) {}
      }

      // Emit bill paid event
      try {
        this.sockets.emitBillPaid(paidBill);
      } catch (e) {}

      return paidBill;
    });
  }
}
