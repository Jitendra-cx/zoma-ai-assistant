import { Module, Global } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtAuthGuard } from '@core/guards/jwt-auth.guard'
import { PermissionsGuard } from '@core/guards/permissions.guard'
import { JwtUtils } from '@core/utils/jwt'
import { ServicesModule } from '@core/services/services.module'

/**
 * JWT Auth Module
 * Provides JWT authentication and authorization globally
 */
@Global()
@Module({
  imports: [
    ServicesModule, // Import to ensure PermissionService is available
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return configService.get('app.jwt')
      },
      inject: [ConfigService],
    }),
  ],
  providers: [JwtUtils, JwtAuthGuard, PermissionsGuard],
  exports: [JwtModule, JwtUtils, JwtAuthGuard, PermissionsGuard],
})
export class JwtAuthModule {}
