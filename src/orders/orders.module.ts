import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { SocketsModule } from '../sockets/sockets.module';

@Module({
  imports: [SocketsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
