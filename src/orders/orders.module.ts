import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { SocketsModule } from '../sockets/sockets.module';
import { BillsModule } from '../bills/bills.module';

@Module({
  imports: [SocketsModule, BillsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
