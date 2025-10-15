import { Module, forwardRef } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { TablesModule } from '../tables/tables.module';
import { SocketsModule } from '../sockets/sockets.module';

@Module({
  imports: [
    forwardRef(() => TablesModule),
    SocketsModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}