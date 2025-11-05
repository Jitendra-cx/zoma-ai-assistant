import { Module } from '@nestjs/common'
import { SessionManagerService } from './session-manager.service'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule],
  providers: [SessionManagerService],
  exports: [SessionManagerService],
})
export class SessionModule {}
