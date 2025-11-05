import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  /**
   * Intercepts the request and logs the request and response.
   * @param context - The execution context.
   * @param next - The call handler.
   * @returns The observable.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url } = request
    const now = Date.now()

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse()
          const { statusCode } = response
          const delay = Date.now() - now

          this.logger.log(`${method} ${url} ${statusCode} - ${delay}ms`)
        },
        error: (error) => {
          const delay = Date.now() - now
          this.logger.error(`${method} ${url} - ${delay}ms - ${error.message}`)
        },
      }),
    )
  }
}
