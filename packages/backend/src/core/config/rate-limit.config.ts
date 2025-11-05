import { registerAs } from '@nestjs/config'

export default registerAs('rateLimit', () => ({
  userRequests: parseInt(process.env.AI_RATE_LIMIT_USER_REQUESTS || '50'), // 50 requests
  userTokens: parseInt(process.env.AI_RATE_LIMIT_USER_TOKENS || '1000'), // 1,000 tokens
  orgCost: parseFloat(process.env.AI_RATE_LIMIT_ORG_COST || '1.00'), // $1.00
  windowHours: parseInt(process.env.AI_RATE_LIMIT_WINDOW_HOURS || '1'), // 1 hour
}))
