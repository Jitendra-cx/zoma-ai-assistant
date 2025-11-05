import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis, { RedisOptions } from 'ioredis'

/**
 * Redis service to interact with the Redis database
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client: Redis
  private isConnected = false

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url')

    const options: RedisOptions = {
      db: this.configService.get<number>('redis.db') || 0,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    }

    try {
      this.client = new Redis(redisUrl, options)
      this.setupEventHandlers()
    } catch (error) {
      this.logger.error('Failed to create Redis client', error)
      throw error
    }
  }

  async onModuleInit() {
    try {
      await this.client.ping()
      this.isConnected = true
      this.logger.log('✅ Successfully connected to Redis')
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error)
      this.isConnected = false
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit()
      this.logger.log('Redis connection closed')
    }
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      this.logger.log('Redis connecting...')
    })

    this.client.on('ready', () => {
      this.isConnected = true
      this.logger.log('Redis ready')
    })

    this.client.on('error', (error) => {
      this.logger.error('Redis error:', error)
      this.isConnected = false
    })

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed')
      this.isConnected = false
    })

    this.client.on('reconnecting', () => {
      this.logger.log('Redis reconnecting...')
    })
  }

  // Check if Redis is connected
  get connected(): boolean {
    return this.isConnected
  }

  getClient(): Redis {
    if (!this.isConnected) {
      throw new Error('Redis is not connected')
    }
    return this.client
  }

  // ==================== Core Operations ====================

  /**
   * Set a key-value pair
   * @param key - Redis key
   * @param value - Value to store
   * @param ttlSeconds - Optional time to live in seconds
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (ttlSeconds) {
      return (await this.client.setex(key, ttlSeconds, value)) === 'OK'
    }
    return (await this.client.set(key, value)) === 'OK'
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key)
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key)
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key)
    return result === 1
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    return (await this.client.expire(key, seconds)) === 1
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key)
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const jsonString = JSON.stringify(value)
    if (ttlSeconds) {
      return (await this.client.setex(key, ttlSeconds, jsonString)) === 'OK'
    }
    return (await this.client.set(key, jsonString)) === 'OK'
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key)
    if (!value) return null
    return JSON.parse(value) as T
  }

  async deleteByPattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern)
    if (keys.length === 0) return 0
    return await this.client.del(...keys)
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const value = await this.client.incr(key)
    if (ttlSeconds && value === 1) {
      await this.client.expire(key, ttlSeconds)
    }
    return value
  }

  async decrement(key: string): Promise<number> {
    return await this.client.decr(key)
  }
}
