import { registerAs } from '@nestjs/config'

export default registerAs('app', () => ({
  appName: 'Zoma AI Assistant',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  isProd: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '7700'),
  host: process.env.HOST || 'localhost',
  protocol: process.env.PROTOCOL || 'http',
  apiUrl: process.env.API_URL || 'http://localhost:7700/api',
  webAppUrl: process.env.WEB_APP_URL || 'http://localhost:7701',
  apiKey: process.env.API_KEY || '', // Optional: set for API key authentication
  apiVersion: process.env.API_VERSION || '1.0.0',
  cors: {
    origin: ['*'],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  },
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'access-key',
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'refresh-key',
    accessTokenExpiry: '15m', // 10 minutes
    refreshTokenExpiry: '7d', // 7 days
    refreshTokenExpiryInMinutes: 7 * 24 * 60, // 7 days in minutes
  },
}))
