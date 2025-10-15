import { Module, forwardRef } from '@nestjs/common';
import { TablesService } from './tables.service';
import { TablesController } from './tables.controller';
import { SocketsModule } from '../sockets/sockets.module';
import { SessionsModule } from '../sessions/sessions.module';
import { BillsModule } from '../bills/bills.module';

@Module({
  imports: [
    SocketsModule,
    forwardRef(() => SessionsModule),
    forwardRef(() => BillsModule),
  ],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}