import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppController } from './app.controller'
import { ConfigModule } from '@core/config/config.module'
import { DatabaseModule } from '@core/database/database.module'
import { RedisModule } from '@core/redis/redis.module'
import { JwtAuthModule } from '@core/auth/jwt-auth.module'
import { AIModule } from '@modules/ai/ai.module'
import { AuthModule } from '@modules/auth/auth.module'

@Module({
  imports: [ConfigModule, DatabaseModule, RedisModule, JwtAuthModule, AuthModule, AIModule],
  controllers: [AppController],
  providers: [ConfigService],
})
export class AppModule {}
