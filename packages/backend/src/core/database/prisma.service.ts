import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor(private readonly configService: ConfigService) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'pretty',
    })

    // Setup logging
    this.setupLogging()
  }

  /**
   * Initialize connection on module init
   */
  async onModuleInit() {
    try {
      await this.$connect()
      this.logger.log('Successfully connected to database')
    } catch (error) {
      this.logger.error('Failed to connect to database', error)
      throw error
    }
  }

  /**
   * Disconnect on module destroy
   */
  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('Disconnected from database')
  }

  /**
   * Setup Prisma logging
   */
  private setupLogging() {
    this.$on('query' as never, (event: any) => {
      if (this.configService.get('NODE_ENV') === 'development') {
        this.logger.debug(`Query: ${event.query}`)
        this.logger.debug(`Params: ${event.params}`)
        this.logger.debug(`Duration: ${event.duration}ms`)
      }
    })

    this.$on('error' as never, (event: any) => {
      this.logger.error(`Error: ${event.message}`)
    })

    this.$on('info' as never, (event: any) => {
      this.logger.log(`Info: ${event.message}`)
    })

    this.$on('warn' as never, (event: any) => {
      this.logger.warn(`Warning: ${event.message}`)
    })
  }

  /** ⚠️ WARNING: This is a dangerous operation and should only be used in development environment ⚠️⚠️⚠️
   * Truncate all tables in the database
   * Only works in development environment
   * Uses CASCADE to handle foreign key constraints
   */
  async truncateDatabase() {
    const disabled = true
    const nodeEnv = this.configService.get('NODE_ENV')

    if (disabled) return true

    if (nodeEnv !== 'development') return true

    try {
      this.logger.warn('⚠️  Truncating all tables in database...')

      // Get all table names from the database
      const tables = await this.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `

      if (tables.length === 0) {
        this.logger.log('No tables found to truncate')
        return
      }

      // Disable foreign key checks temporarily
      await this.$executeRawUnsafe('SET session_replication_role = replica')

      // Truncate all tables with CASCADE to handle foreign keys
      const tableNames = tables.map((t) => `"${t.tablename}"`).join(', ')
      await this.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`)

      // Re-enable foreign key checks
      await this.$executeRawUnsafe('SET session_replication_role = DEFAULT')

      this.logger.log(`✅ Successfully truncated ${tables.length} tables`)
    } catch (error) {
      this.logger.error('❌ Error truncating database:', error)
      // Re-enable foreign key checks in case of error
      await this.$executeRawUnsafe('SET session_replication_role = DEFAULT').catch(() => {})
      throw error
    }
  }
}
