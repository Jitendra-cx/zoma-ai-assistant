import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { AISession } from '@shared/interfaces/session.interface'
import { v4 as uuidv4 } from 'uuid'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '@core/redis/redis.service'

/**
 * Service to manage the AI sessions
 */
@Injectable()
export class SessionManagerService {
  private readonly logger = new Logger(SessionManagerService.name)
  private inMemorySessions: Map<string, AISession> = new Map()

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    if (!this.redisService.connected) {
      this.logger.warn('Redis is not connected, using in-memory sessions')
    }
  }

  /**
   * Create a new AI session
   * @param sessionData - The session data
   * @returns The created session
   */
  async create(sessionData: Partial<AISession>): Promise<AISession> {
    const session: AISession = {
      sessionId: uuidv4(),
      userUId: sessionData.userUId,
      status: 'pending',
      originalText: sessionData.originalText,
      action: sessionData.action,
      provider: sessionData.provider,
      context: sessionData.context,
      createdAt: new Date(),
    }

    await this.save(session)
    return session
  }

  /**
   * Get an AI session by session ID
   * @param sessionId - The session ID
   * @returns The session or null if not found
   */
  async get(sessionId: string): Promise<AISession | null> {
    if (this.redisService.connected) {
      try {
        const session = await this.redisService.getJson<AISession>(`session:${sessionId}`)
        return session || null
      } catch (error) {
        this.logger.error('Redis get error', error)
        return this.inMemorySessions.get(sessionId) || null
      }
    }

    return this.inMemorySessions.get(sessionId) || null
  }

  /**
   * Update an AI session
   * @param sessionId - The session ID
   * @param updates - The updates to the session
   * @returns The updated session
   */
  async update(sessionId: string, updates: Partial<AISession>): Promise<AISession> {
    const session = await this.get(sessionId)
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`)
    }

    const updated: AISession = {
      ...session,
      ...updates,
      completedAt:
        updates.status === 'completed' || updates.status === 'error'
          ? new Date()
          : session.completedAt,
    }

    await this.save(updated)
    return updated
  }

  async cancel(sessionId: string): Promise<void> {
    await this.update(sessionId, { status: 'cancelled' })
  }

  private async save(session: AISession): Promise<void> {
    if (this.redisService.connected) {
      try {
        const ttl = this.configService.get<number>('redis.ttlSessions') || 3600
        await this.redisService.setJson(`session:${session.sessionId}`, session, ttl)
      } catch (error) {
        this.logger.error('Redis save error', error)
        // Fallback to in-memory
        this.inMemorySessions.set(session.sessionId, session)
      }
    } else {
      this.inMemorySessions.set(session.sessionId, session)
    }
  }

  async getAllByUser(userId: string): Promise<AISession[]> {
    // Simple implementation - in production, use Redis SCAN or database query
    const allSessions: AISession[] = []

    if (this.redisService.connected) {
      // For Redis, would need to maintain an index or scan keys
      // This is simplified - in production, use a proper indexing strategy
      this.logger.warn('getAllByUser with Redis not fully implemented')
    } else {
      for (const session of this.inMemorySessions.values()) {
        if (session.userUId === userId) {
          allSessions.push(session)
        }
      }
    }

    return allSessions
  }
}
