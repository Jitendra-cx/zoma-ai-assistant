import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe, UnprocessableEntityException } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { CustomLoggerService } from '@core/services/logger.service'
import { HttpExceptionFilter } from '@core/filters/http-exception.filter'
import { LoggingInterceptor } from '@core/interceptors/logging.interceptor'
import { TransformInterceptor } from '@core/interceptors/transform.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLoggerService(),
  })
  const configService = app.get(ConfigService)

  // Cookie parser middleware
  app.use(cookieParser())

  // Global prefix
  app.setGlobalPrefix('api')

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (error) => {
        throw new UnprocessableEntityException(error)
      },
    }),
  )

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter())

  // Global interceptors
  app.useGlobalInterceptors(
    new TransformInterceptor(), // Format responses
    new LoggingInterceptor(), // Log requests/responses
  )

  // CORS
  app.enableCors({ ...configService.get('app.cors') })

  // Start the server
  const port = configService.get('app.port')
  await app.listen(port)

  let apiUrl = `${await app.getUrl()}/api`
  apiUrl = configService.get('app.isDev') ? apiUrl.replace(/\[::1]/, 'localhost') : apiUrl

  console.log(`🚀 Server is running on: ${apiUrl}`)
  // console.log(`📖 API Documentation: ${await app.getUrl()}/api`)
}

bootstrap().catch((error) => {
  console.error('Error starting the application:', error)
})
