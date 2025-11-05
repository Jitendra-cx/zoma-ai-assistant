import { Module, Global } from '@nestjs/common'
import { RedisService } from './redis.service'

/**
 * Redis Module
 * Provides Redis service globally
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
