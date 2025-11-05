import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

/**
 * Transform interceptor to format all responses consistently
 * Formats response as: { success: true, message: string, data: any }
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // Skip formatting for SSE responses or if response already sent
        const response = context.switchToHttp().getResponse()
        if (response.headersSent || response.getHeader('content-type') === 'text/event-stream') {
          return data
        }

        const message = data?.message || ''
        if (data?.message) delete data.message

        return {
          success: true,
          message,
          data: data?.data !== undefined ? data.data : data,
        }
      }),
    )
  }
}
