import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '@core/database/prisma.service'
import { PasswordUtils } from '@core/utils/password'
import { JwtUtils } from '@core/utils/jwt'
import { RedisService } from '@core/redis/redis.service'
import { ConfigService } from '@nestjs/config'
import { Logger } from '@nestjs/common'
import { LoginDto } from './dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordUtils: PasswordUtils,
    private readonly jwtUtils: JwtUtils,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  async login(body: LoginDto): Promise<{
    user: object
    accessToken: string
    refreshToken: string
  }> {
    const { email, password } = body
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        is_active: true,
        deleted_at: null,
      },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        password: true,
        token_version: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!user || !this.passwordUtils.verifyPassword(password, user.password)) {
      throw new UnauthorizedException('Invalid email or password')
    }

    // Generate access token with token ID
    const { token: accessToken, jti } = this.jwtUtils.generateAccessToken({
      userId: user.uuid,
      email: user.email,
      role: user.role.name,
    })

    // Generate refresh token
    const refreshToken = this.jwtUtils.generateRefreshToken({
      userId: user.uuid,
      email: user.email,
      role: user.role.name,
      tokenVersion: user.token_version,
    })

    // Store access token in Redis
    if (this.redisService.connected) {
      const accessTokenTTL = this.configService.get<number>('redis.ttlAccessToken')
      const tokenKey = `access_token:${user.uuid}:${jti}`
      this.redisService
        .set(tokenKey, `${user.id}:${accessToken}`, accessTokenTTL)
        .catch((e) => this.logger.error('Failed to store access token in Redis', e))
    }

    // Update user login timestamp
    this.prisma.user
      .update({
        where: { id: user.id },
        data: { login_at: new Date() },
      })
      .catch((e) => this.logger.error('Error updating user login at', e))

    return {
      user: {
        uuid: user.uuid,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
      accessToken,
      refreshToken,
    }
  }

  async me(userId: number): Promise<{
    user: object
    message: string
  }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    })
    return { user, message: 'User data' }
  }

  /**
   * Refresh the access token by using the refresh token from the cookie
   * @param refreshToken - The refresh token
   * @returns The new access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
  }> {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided')
    }

    const decoded = this.jwtUtils.verifyRefreshToken(refreshToken)
    if (!decoded) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    const user = await this.prisma.user.findFirst({
      where: { uuid: decoded.userId },
      select: {
        id: true,
        uuid: true,
        name: true,
        email: true,
        role: {
          select: {
            name: true,
          },
        },
        token_version: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not exists')
    }

    if (decoded.tokenVersion !== user.token_version) {
      throw new UnauthorizedException('Token has been expired, please login again')
    }

    // Generate new access token with token ID
    const { token: accessToken, jti } = this.jwtUtils.generateAccessToken({
      userId: user.uuid,
      email: user.email,
      role: user.role.name,
    })

    // Store new access token in Redis
    if (this.redisService.connected) {
      const accessTokenTTL = this.configService.get<number>('redis.ttlAccessToken')
      const tokenKey = `access_token:${user.uuid}:${jti}`
      this.redisService
        .set(tokenKey, `${user.id}:${accessToken}`, accessTokenTTL)
        .catch((e) => this.logger.error('Failed to store access token in Redis', e))
    }

    return {
      accessToken,
    }
  }

  /**
   * Logout the user by removing the access token from Redis
   * @param userId - The user ID
   * @param tokenId - The token ID
   * @returns void
   */
  async logout(userId: string, tokenId?: string): Promise<void> {
    if (!this.redisService.connected) return

    try {
      if (tokenId) {
        const tokenKey = `access_token:${userId}:${tokenId}`
        await this.redisService.del(tokenKey)
      }
    } catch (e) {
      this.logger.error(`Failed to remove access tokens for user ${userId}`, e)
    }

    return
  }
}
