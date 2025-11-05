import { existsSync, mkdirSync } from 'fs'
import { Injectable, LoggerService, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createWinstonLogger } from '@core/utils/logger'

@Injectable()
export class CustomLoggerService implements LoggerService {
  private readonly logger: ReturnType<typeof createWinstonLogger>

  constructor(@Optional() private readonly configService?: ConfigService) {
    const logDir = 'logs'
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true })
    }

    this.logger = createWinstonLogger(this.configService?.get('app.isProd') || false)
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context })
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context })
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context })
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context })
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context })
  }
}
