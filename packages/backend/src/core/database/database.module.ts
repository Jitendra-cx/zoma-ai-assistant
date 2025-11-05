import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from './prisma.service'

/**
 * Database Module
 * Provides Prisma service globally
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
