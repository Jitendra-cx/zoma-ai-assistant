import { createLogger, format, transports } from 'winston'

/**
 * Creates a Winston logger instance
 * @param isProd - Whether the application is in production
 * @returns Winston logger instance
 */
export const createWinstonLogger = (isProd: boolean = false) => {
  const loggerTransports: any[] = [
    // errors only - always log errors to file (even in production for debugging)
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: format.combine(
        format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`
        }),
      ),
    }),
  ]

  // Only add console transport in non-production environments
  if (!isProd) {
    loggerTransports.push(
      new transports.Console({
        level: 'info',
        format: format.combine(
          format.colorize({ all: true }),
          format.simple(),
          format.printf(({ timestamp, level, message, context, ...meta }) => {
            return `${timestamp} [${level}]: ${meta[Symbol.for('level')] === 'error' ? JSON.stringify(meta, null, 2) : '[' + context + ']'} ${message}`
          }),
        ),
      }),
    )
  }

  return createLogger({
    level: isProd ? 'error' : 'info', // In production, only log errors
    silent: false, // Keep false to allow error file logging
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ timestamp, level, message, context }) => {
        return `[${timestamp}] [${level}]${context ? ' [' + context + ']' : ''}: ${message}`
      }),
    ),
    transports: loggerTransports,
  })
}
