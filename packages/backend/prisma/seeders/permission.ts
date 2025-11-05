import { PrismaClient } from '@prisma/client'
import { PERMISSIONS, PERMISSION_DESCRIPTIONS } from '../../src/shared/constants/permissions'

export const permissionSeeder = async (prisma: PrismaClient) => {
  return await Promise.allSettled(
    Object.entries(PERMISSIONS).map(([key, name]) =>
      prisma.permission.upsert({
        where: { name },
        update: {
          description: PERMISSION_DESCRIPTIONS[name] || '',
        },
        create: {
          name,
          description: PERMISSION_DESCRIPTIONS[name] || '',
        },
      }),
    ),
  )
    .catch((error) => {
      console.error('❌ Permission seed failed:', error)
      return Promise.reject(new Error('❌ Permission seed failed'))
    })
    .then((results) => {
      console.log(`✅ Seeded ${results.length} permissions`)
      return Promise.resolve(`Seeded ${results.length} permissions`)
    })
}
