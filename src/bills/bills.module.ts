import { Module, forwardRef } from '@nestjs/common';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { SocketsModule } from '../sockets/sockets.module';
import { TablesModule } from '../tables/tables.module';

@Module({
  imports: [
    SocketsModule,
    forwardRef(() => TablesModule),
  ],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}