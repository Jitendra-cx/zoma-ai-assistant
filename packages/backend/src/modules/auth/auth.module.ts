import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { RedisService } from '@core/redis/redis.service'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { PasswordUtils } from '@core/utils/password'
import { JwtUtils } from '@core/utils/jwt'
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard'
import { Logger } from '@nestjs/common'

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return configService.get('app.jwt')
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordUtils, JwtUtils, JwtAuthGuard, Logger, RedisService],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
