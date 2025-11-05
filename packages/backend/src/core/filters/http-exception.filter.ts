import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common'

/**
 * Filter to handle HTTP exceptions and return a consistent response
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    let message: string | object = 'Internal server error'
    let error: any = undefined

    if (exception instanceof UnprocessableEntityException) {
      message = (exception.getResponse() as any).error || 'Unprocessable Entity'
      error = (exception.getResponse() as any)?.message || exception.getResponse
    } else if (exception instanceof HttpException) {
      message = exception.getResponse()
      error = (exception.getResponse() as any).error
    } else if (exception instanceof Error) {
      message = exception.message
      error = exception.stack
    }

    const errorResponse = {
      success: false,
      message:
        typeof message === 'string' ? message : (message as any).message || 'An error occurred',
      error: {
        code: status,
        details: error,
      },
    }

    // Log error
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    )

    response.status(status).json(errorResponse)
  }
}
