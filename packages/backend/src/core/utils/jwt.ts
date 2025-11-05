import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { v4 as uuidv4 } from 'uuid'

export interface TokenPayload {
  userId: string
  email: string
  role: string
  jti?: string // JWT ID for token tracking
}

export interface RefreshTokenPayload extends TokenPayload {
  tokenVersion: number
}

/**
 * JWT utilities to generate and verify tokens
 */
@Injectable()
export class JwtUtils {
  private readonly config: Record<string, any>

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.config = this.configService.get('app.jwt')
  }

  generateAccessToken(payload: TokenPayload): { token: string; jti: string } {
    const secret = this.config.accessTokenSecret
    const jti = payload.jti || uuidv4()

    const token = this.jwtService.sign(
      { ...payload, jti },
      {
        secret: secret,
        expiresIn: this.config.accessTokenExpiry,
      },
    )

    return { token, jti }
  }

  verifyAccessToken(token: string): TokenPayload {
    const secret = this.config.accessTokenSecret
    return this.jwtService.verify(token, {
      secret: secret,
    }) as TokenPayload
  }

  generateRefreshToken(payload: RefreshTokenPayload): string {
    const secret = this.config.refreshTokenSecret
    return this.jwtService.sign(payload, {
      secret: secret,
      expiresIn: this.config.refreshTokenExpiry,
    })
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return this.jwtService.verify(token, {
      secret: this.config.refreshTokenSecret,
    }) as RefreshTokenPayload
  }

  decodeToken(token: string): TokenPayload | RefreshTokenPayload | null {
    try {
      return this.jwtService.decode(token) as TokenPayload | RefreshTokenPayload
    } catch {
      return null
    }
  }
}
