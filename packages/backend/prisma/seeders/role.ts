import { PrismaClient } from "@prisma/client"
import { ROLES } from '../../src/shared/constants/roles'

export const roleSeeder = async (prisma: PrismaClient) => {
  return await Promise.allSettled([
    ...Object.values(ROLES).map((name) =>
      prisma.role.upsert({
        where: { name },
        update: { },
        create: { name },
      }),
    ),
    
    prisma.role.upsert({
      where: { name: ROLES.ADMIN },
      update: {
        all_permission: true,
      },
      create: {
        name: ROLES.ADMIN,
        all_permission: true,
      },
    }),    
  ]).catch((error) => {
    console.error('❌ Role seed failed:', error)
    return Promise.reject(new Error('❌ Role seed failed'))
  }).then((results) => {
    console.log('✅ Role seeded successfully')
    return Promise.resolve('Role seeded successfully')
  })

}