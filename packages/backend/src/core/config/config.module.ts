import { Module, Global } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import appConfig from './app.config'
import databaseConfig from './database.config'
import llmConfig from './llm.config'
import redisConfig from './redis.config'
import rateLimitConfig from './rate-limit.config'

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, llmConfig, redisConfig, rateLimitConfig],
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
