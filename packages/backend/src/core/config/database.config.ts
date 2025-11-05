import { registerAs } from '@nestjs/config'

export default registerAs('database', () => {
  const dbConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'zoma_dev',
  }

  // Generate DATABASE_URL for Prisma if not explicitly set
  const databaseUrl =
    process.env.DATABASE_URL ||
    `postgresql://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}?schema=public`

  return {
    ...dbConfig,
    url: databaseUrl,
  }
})
