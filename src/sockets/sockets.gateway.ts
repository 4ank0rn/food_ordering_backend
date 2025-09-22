import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({ cors: true })
@Injectable()
export class SocketsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join_table')
  handleJoinTable(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tableId: number },
  ) {
    const room = `table_${payload.tableId}`;
    client.join(room);
    client.emit('joined', { room });
  }

  @SubscribeMessage('join_staff')
  handleJoinStaff(@ConnectedSocket() client: Socket) {
    client.join('staff');
    client.emit('joined', { room: 'staff' });
  }

  emitToStaff(event: string, payload: any) {
    if (this.server) this.server.to('staff').emit(event, payload);
  }

  emitToTable(tableId: number, event: string, payload: any) {
    if (this.server) this.server.to(`table_${tableId}`).emit(event, payload);
  }
}
