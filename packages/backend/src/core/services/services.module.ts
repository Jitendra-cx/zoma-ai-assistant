import { Module, Global } from '@nestjs/common'
import { RateLimitService } from './rate-limit/rate-limit.service'
import { PermissionService } from './permission.service'
import { DatabaseModule } from '@core/database/database.module'
import { RedisModule } from '@core/redis/redis.module'

@Global()
@Module({
  imports: [DatabaseModule, RedisModule],
  providers: [RateLimitService, PermissionService],
  exports: [RateLimitService, PermissionService],
})
export class ServicesModule {}
