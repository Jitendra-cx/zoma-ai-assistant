import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '@core/redis/redis.service'

export interface RateLimitInfo {
  limit: number
  remaining: number
  resetAt: Date
  resetAtISO: string
}

export interface RateLimitResult {
  allowed: boolean
  info: RateLimitInfo
  retryAfter?: number // seconds until reset
}

export interface RateLimitOptions {
  identifier: string // user ID, IP, or other identifier
  limit?: number // Override default limit
  windowSeconds?: number // Override default window
  type?: 'requests' | 'tokens' | 'cost' // Rate limit type
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name)
  private inMemoryCache: Map<string, { count: number; resetAt: number }> = new Map()

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Check if a request is within rate limits
   */
  async checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
    const {
      identifier,
      limit = this.configService.get<number>('rateLimit.userRequests'),
      windowSeconds = this.configService.get<number>('rateLimit.windowHours') * 3600,
      type = 'requests',
    } = options

    const key = this.getKey(identifier, type)
    const now = Date.now()
    const resetAt = new Date(now + windowSeconds * 1000)

    try {
      let count: number

      if (this.redisService.connected) {
        count = await this.redisService.increment(key, windowSeconds)
      } else {
        count = await this.getInMemoryCount(key, windowSeconds)
      }

      const remaining = Math.max(0, limit - count)
      const allowed = count <= limit

      const info: RateLimitInfo = {
        limit,
        remaining,
        resetAt,
        resetAtISO: resetAt.toISOString(),
      }

      return {
        allowed,
        info,
        retryAfter: allowed ? undefined : windowSeconds,
      }
    } catch (error) {
      // this.logger.error('Rate limit check error', error)
      // Fail open - allow request if rate limit check fails
      return {
        allowed: true,
        info: {
          limit,
          remaining: limit,
          resetAt: new Date(now + windowSeconds * 1000),
          resetAtISO: resetAt.toISOString(),
        },
      }
    }
  }

  /**
   * Get current rate limit info without incrementing
   */
  async getRateLimitInfo(options: RateLimitOptions): Promise<RateLimitInfo> {
    const {
      identifier,
      limit = this.configService.get<number>('rateLimit.userRequests'),
      windowSeconds = this.configService.get<number>('rateLimit.windowHours') * 3600,
      type = 'requests',
    } = options

    const key = this.getKey(identifier, type)

    try {
      let count: number

      if (this.redisService.connected) {
        const value = await this.redisService.get(key)
        count = value ? parseInt(value, 10) : 0
      } else {
        const entry = this.inMemoryCache.get(key)
        const now = Date.now()
        if (!entry || entry.resetAt < now) {
          count = 0
        } else {
          count = entry.count
        }
      }

      const ttl = await this.getTTL(key, windowSeconds)
      const resetAt = new Date(Date.now() + (ttl > 0 ? ttl : windowSeconds) * 1000)

      return {
        limit,
        remaining: Math.max(0, limit - count),
        resetAt,
        resetAtISO: resetAt.toISOString(),
      }
    } catch (error) {
      this.logger.error('Get rate limit info error', error)
      const resetAt = new Date(Date.now() + windowSeconds * 1000)
      return {
        limit,
        remaining: limit,
        resetAt,
        resetAtISO: resetAt.toISOString(),
      }
    }
  }

  /**
   * Increment rate limit counter (for tokens, cost, etc.)
   */
  async increment(
    identifier: string,
    amount: number = 1,
    type: 'requests' | 'tokens' | 'cost' = 'requests',
    windowSeconds?: number,
  ): Promise<number> {
    const defaultWindowSeconds = this.configService.get<number>('rateLimit.windowHours') * 3600
    const finalWindowSeconds = windowSeconds || defaultWindowSeconds

    const key = this.getKey(identifier, type)

    try {
      if (this.redisService.connected) {
        // For Redis, handle incrementing by amount
        // Since increment() only increments by 1, use a different approach
        const currentValue = await this.redisService.get(key)
        const currentCount = currentValue ? parseInt(currentValue, 10) : 0
        const newCount = currentCount + amount

        await this.redisService.set(key, newCount.toString(), finalWindowSeconds)
        return newCount
      } else {
        // In-memory increment
        const entry = this.inMemoryCache.get(key)
        const now = Date.now()
        const windowMs = finalWindowSeconds * 1000

        if (!entry || entry.resetAt < now) {
          this.inMemoryCache.set(key, { count: amount, resetAt: now + windowMs })
          return amount
        }

        entry.count += amount
        return entry.count
      }
    } catch (error) {
      this.logger.error('Rate limit increment error', error)
      return 0
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(
    identifier: string,
    type: 'requests' | 'tokens' | 'cost' = 'requests',
  ): Promise<void> {
    const key = this.getKey(identifier, type)

    try {
      if (this.redisService.connected) {
        await this.redisService.del(key)
      } else {
        this.inMemoryCache.delete(key)
      }
    } catch (error) {
      this.logger.error('Rate limit reset error', error)
    }
  }

  /**
   * Get TTL for a rate limit key
   */
  private async getTTL(key: string, defaultWindowSeconds: number): Promise<number> {
    try {
      if (this.redisService.connected) {
        const ttl = await this.redisService.ttl(key)
        return ttl > 0 ? ttl : defaultWindowSeconds
      } else {
        const entry = this.inMemoryCache.get(key)
        if (!entry) return defaultWindowSeconds
        const now = Date.now()
        const remaining = Math.max(0, Math.floor((entry.resetAt - now) / 1000))
        return remaining > 0 ? remaining : defaultWindowSeconds
      }
    } catch (error) {
      this.logger.error('Get TTL error', error)
      return defaultWindowSeconds
    }
  }

  /**
   * Get rate limit key for Redis/in-memory storage
   */
  private getKey(identifier: string, type: 'requests' | 'tokens' | 'cost'): string {
    return `rate_limit:${type}:${identifier}`
  }

  /**
   * In-memory fallback for rate limiting
   */
  private async getInMemoryCount(key: string, windowSeconds: number): Promise<number> {
    const now = Date.now()
    const windowMs = windowSeconds * 1000

    const entry = this.inMemoryCache.get(key)
    if (!entry || entry.resetAt < now) {
      this.inMemoryCache.set(key, { count: 1, resetAt: now + windowMs })
      return 1
    }

    entry.count++
    return entry.count
  }

  /**
   * Clean up expired in-memory entries (should be called periodically)
   */
  cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.inMemoryCache.entries()) {
      if (entry.resetAt < now) {
        this.inMemoryCache.delete(key)
        cleaned++
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired rate limit entries`)
    }
  }
}
