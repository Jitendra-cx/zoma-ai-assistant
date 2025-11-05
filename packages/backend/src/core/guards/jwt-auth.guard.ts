import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { JwtUtils } from '@core/utils/jwt'
import { RedisService } from '@core/redis/redis.service'

/**
 * Guard to check if the request has a valid JWT token
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name)

  constructor(
    private readonly jwtUtils: JwtUtils,
    private readonly redisService: RedisService,
  ) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // Extract token from Authorization header
    const authHeader = request.headers.authorization
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header provided')
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid authorization header format')
    }

    const token = parts[1]
    if (!token) {
      throw new UnauthorizedException('No token provided')
    }

    try {
      // Verify and decode the access token
      const payload = this.jwtUtils.verifyAccessToken(token)
      let userPKId: number

      // Optionally check if token exists in Redis (to handle token revocation)
      if (this.redisService.connected && payload.jti) {
        const tokenKey = `access_token:${payload.userId}:${payload.jti}`
        const [cachedUserId, cachedToken] = (await this.redisService.get(tokenKey)).split(':')

        if (!cachedToken) {
          throw new UnauthorizedException('Token has been revoked or expired')
        }

        // Verify the token matches what's stored (optional additional security)
        if (cachedToken !== token) {
          throw new UnauthorizedException('Invalid token')
        }

        userPKId = parseInt(cachedUserId)
      }

      // Attach user info to request for use in controllers
      request.user = {
        id: userPKId,
        uuid: payload.userId,
        email: payload.email,
        role: payload.role,
      }

      return true
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      throw new UnauthorizedException('Invalid or expired token')
    }
  }
}
