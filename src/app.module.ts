import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TablesModule } from './tables/tables.module';
import { SessionsModule } from './sessions/sessions.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { BillsModule } from './bills/bills.module';
import { SocketsModule } from './sockets/sockets.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    TablesModule,
    SessionsModule,
    MenuModule,
    OrdersModule,
    BillsModule,
    SocketsModule,
  ],
})
export class AppModule {}
