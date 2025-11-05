import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { RateLimitService } from '@core/services/rate-limit/rate-limit.service'
import { RequestUser } from '@core/decorators/current-user.decorator'

/**
 * Guard to check if the request is within the rate limit for the user
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name)

  constructor(private readonly rateLimitService: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user as RequestUser

    // If no user (auth not required), use IP address for rate limiting
    const identifier = user?.uuid || request.ip || 'anonymous'

    try {
      const result = await this.rateLimitService.checkRateLimit({
        identifier,
        type: 'requests',
      })

      // Add rate limit headers
      const response = context.switchToHttp().getResponse()
      response.setHeader('X-RateLimit-Limit', result.info.limit)
      response.setHeader('X-RateLimit-Remaining', result.info.remaining)
      response.setHeader('X-RateLimit-Reset', result.info.resetAtISO)

      if (!result.allowed) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Rate limit exceeded',
            error: 'Too Many Requests',
            retryAfter: result.retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }

      return true
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      // On error, allow request (fail open)
      this.logger.error('Rate limit check error', error)
      return true
    }
  }
}
