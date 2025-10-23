import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: [`${process.env.FRONTEND_URL}`, `${process.env.ADMIN_URL}`, `${process.env.BACKEND_URL}`],
    credentials: true
  },
  transports: ['websocket', 'polling']
})
@Injectable()
export class SocketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketsGateway.name);
  private connectedClients = new Map<string, { clientType: 'staff' | 'customer', tableId?: number }>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection_established', { clientId: client.id });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('join_table')
  handleJoinTable(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tableId: number, sessionId?: string },
  ) {
    const room = `table_${payload.tableId}`;
    client.join(room);

    // Store client info
    this.connectedClients.set(client.id, {
      clientType: 'customer',
      tableId: payload.tableId
    });

    client.emit('joined_table', {
      room,
      tableId: payload.tableId,
      sessionId: payload.sessionId
    });

    this.logger.log(`Customer joined table ${payload.tableId}: ${client.id}`);

    // Notify staff that customer joined table
    this.emitToStaff('customer_joined_table', {
      tableId: payload.tableId,
      sessionId: payload.sessionId,
      clientId: client.id
    });
  }

  @SubscribeMessage('leave_table')
  handleLeaveTable(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tableId: number },
  ) {
    const room = `table_${payload.tableId}`;
    client.leave(room);

    const clientInfo = this.connectedClients.get(client.id);
    this.connectedClients.delete(client.id);

    client.emit('left_table', { room, tableId: payload.tableId });

    this.logger.log(`Customer left table ${payload.tableId}: ${client.id}`);

    // Notify staff that customer left table
    this.emitToStaff('customer_left_table', {
      tableId: payload.tableId,
      clientId: client.id
    });
  }

  @SubscribeMessage('join_staff')
  handleJoinStaff(@ConnectedSocket() client: Socket) {
    client.join('staff');

    // Store client info
    this.connectedClients.set(client.id, { clientType: 'staff' });

    client.emit('joined_staff', { room: 'staff' });

    this.logger.log(`Staff member joined: ${client.id}`);

    // Send current connected tables info
    const connectedTables = Array.from(this.connectedClients.values())
      .filter(info => info.clientType === 'customer' && info.tableId)
      .map(info => info.tableId);

    client.emit('connected_tables', { tables: [...new Set(connectedTables)] });
  }

  @SubscribeMessage('leave_staff')
  handleLeaveStaff(@ConnectedSocket() client: Socket) {
    client.leave('staff');
    this.connectedClients.delete(client.id);
    client.emit('left_staff', { room: 'staff' });
    this.logger.log(`Staff member left: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }

  // Staff -> Customer communication
  @SubscribeMessage('staff_message_to_table')
  handleStaffMessageToTable(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tableId: number, message: string, type: string },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo?.clientType !== 'staff') {
      client.emit('error', { message: 'Unauthorized: Only staff can send messages to tables' });
      return;
    }

    this.emitToTable(payload.tableId, 'staff_message', {
      message: payload.message,
      type: payload.type,
      timestamp: Date.now(),
      fromStaff: true
    });

    this.logger.log(`Staff message sent to table ${payload.tableId}: ${payload.message}`);
  }

  // Customer -> Staff communication
  @SubscribeMessage('customer_message_to_staff')
  handleCustomerMessageToStaff(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tableId: number, message: string, type: string },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo?.clientType !== 'customer') {
      client.emit('error', { message: 'Unauthorized: Only customers can send messages to staff' });
      return;
    }

    this.emitToStaff('customer_message', {
      tableId: payload.tableId,
      message: payload.message,
      type: payload.type,
      timestamp: Date.now(),
      fromCustomer: true,
      clientId: client.id
    });

    this.logger.log(`Customer message from table ${payload.tableId}: ${payload.message}`);
  }

  // Enhanced emission methods
  emitToStaff(event: string, payload: any) {
    if (this.server) {
      this.server.to('staff').emit(event, {
        ...payload,
        timestamp: Date.now()
      });
      this.logger.debug(`Emitted to staff: ${event}`, payload);
    }
  }

  emitToTable(tableId: number, event: string, payload: any) {
    if (this.server) {
      this.server.to(`table_${tableId}`).emit(event, {
        ...payload,
        timestamp: Date.now()
      });
      this.logger.debug(`Emitted to table ${tableId}: ${event}`, payload);
    }
  }

  emitToAllTables(event: string, payload: any) {
    if (this.server) {
      // Get all connected customer tables
      const connectedTables = Array.from(this.connectedClients.values())
        .filter(info => info.clientType === 'customer' && info.tableId)
        .map(info => info.tableId);

      const uniqueTables = [...new Set(connectedTables)].filter((tableId): tableId is number => tableId !== undefined);

      uniqueTables.forEach(tableId => {
        this.emitToTable(tableId, event, payload);
      });

      this.logger.debug(`Emitted to all tables (${uniqueTables.length}): ${event}`, payload);
    }
  }

  // System-wide notifications
  broadcastSystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    if (this.server) {
      this.server.emit('system_message', {
        message,
        type,
        timestamp: Date.now()
      });
      this.logger.log(`System broadcast: ${message}`);
    }
  }

  // Connection status methods
  getConnectedClientsCount(): { staff: number, customers: number, tables: Set<number> } {
    const staff = Array.from(this.connectedClients.values()).filter(info => info.clientType === 'staff').length;
    const customers = Array.from(this.connectedClients.values()).filter(info => info.clientType === 'customer').length;
    const tables = new Set(Array.from(this.connectedClients.values())
      .filter(info => info.clientType === 'customer' && info.tableId)
      .map(info => info.tableId)
      .filter((tableId): tableId is number => tableId !== undefined));

    return { staff, customers, tables };
  }

  // Table status management events
  emitTableStatusChanged(tableId: number, status: 'AVAILABLE' | 'OCCUPIED', reason?: string) {
    if (this.server) {
      const payload = {
        tableId,
        status,
        reason,
        timestamp: Date.now()
      };

      // Notify staff about table status change
      this.emitToStaff('table_status_changed', payload);

      // Notify customers at the table
      this.emitToTable(tableId, 'table_status_changed', payload);

      this.logger.log(`Table ${tableId} status changed to ${status}${reason ? ` (${reason})` : ''}`);
    }
  }

  emitSessionStarted(session: any) {
    if (this.server) {
      const payload = {
        sessionId: session.id,
        tableId: session.tableId,
        timestamp: Date.now()
      };

      this.emitToStaff('session_started', payload);
      this.emitToTable(session.tableId, 'session_started', payload);

      this.logger.log(`Session started for table ${session.tableId}: ${session.id}`);
    }
  }

  emitSessionEnded(session: any, reason?: string) {
    if (this.server) {
      const payload = {
        sessionId: session.id,
        tableId: session.tableId,
        reason,
        timestamp: Date.now()
      };

      this.emitToStaff('session_ended', payload);
      this.emitToTable(session.tableId, 'session_ended', payload);

      this.logger.log(`Session ended for table ${session.tableId}: ${session.id}${reason ? ` (${reason})` : ''}`);
    }
  }

  // Specific business logic events
  emitOrderCreated(order: any) {
    this.emitToStaff('order_created', order);
    this.emitToTable(order.tableId, 'order_created', {
      orderId: order.id,
      status: order.status,
      message: 'Your order has been received!'
    });
  }

  emitOrderStatusUpdated(order: any) {
    this.emitToStaff('order_status_updated', order);
    this.emitToTable(order.tableId, 'order_status_updated', {
      orderId: order.id,
      status: order.status,
      message: this.getOrderStatusMessage(order.status)
    });
  }

  emitBillCreated(bill: any) {
    this.emitToStaff('bill_created', bill);
    this.emitToTable(bill.tableId, 'bill_created', {
      billId: bill.id,
      totalAmount: bill.totalAmount,
      message: 'Your bill is ready!'
    });
  }

  emitBillPaid(bill: any) {
    this.emitToStaff('bill_paid', bill);
    this.emitToTable(bill.tableId, 'bill_paid', {
      billId: bill.id,
      message: 'Thank you for your payment! Have a great day!'
    });
  }

  private getOrderStatusMessage(status: string): string {
    switch (status) {
      case 'PENDING': return 'Your order is being reviewed...';
      case 'IN_PROGRESS': return 'Your order is being prepared!';
      case 'DONE': return 'Your order is ready!';
      case 'CANCELLED': return 'Your order has been cancelled.';
      default: return 'Order status updated.';
    }
  }
}
