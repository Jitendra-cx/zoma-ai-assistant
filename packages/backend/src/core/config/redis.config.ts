import { registerAs } from '@nestjs/config'

export default registerAs('redis', () => ({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  db: parseInt(process.env.REDIS_DB || '0'),
  ttlSessions: parseInt(process.env.REDIS_TTL_SESSIONS || '3600'), // 1 hour
  ttlCache: parseInt(process.env.REDIS_TTL_CACHE || '86400'), // 24 hours
  ttlAccessToken: parseInt(process.env.REDIS_TTL_ACCESS_TOKEN || '900'), // 15 minutes
}))
