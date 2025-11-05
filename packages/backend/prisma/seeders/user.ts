import { PrismaClient } from '@prisma/client'
import { ROLES } from '../../src/shared/constants/roles'
import { PasswordUtils } from '../../src/core/utils/password'

const passwordUtils = new PasswordUtils()

const DefaultUsers = [
  {
    name: 'Admin User',
    email: 'admin@zoma.com',
    password: 'password',
    role_name: ROLES.ADMIN,
  },
  {
    name: 'General User',
    email: 'user@zoma.com',
    password: 'password',
    role_name: ROLES.GENERAL_USER,
  }
]

export const userSeeder = async (prisma: PrismaClient) => {
  return await Promise.allSettled(        
    DefaultUsers.map((user) => prisma.user.upsert({
      where: { email: user.email },
      update: { 
        name: user.name,
        email: user.email,
        password: passwordUtils.hashPassword(user.password),
        role: {
          connect: {
            name: user.role_name,
          },
        },
      },
      create: {
        name: user.name,
        email: user.email,
        password: passwordUtils.hashPassword(user.password),
        role: {
          connect: {
            name: user.role_name,
          },
        },
      },
    })),    
  ).catch((error) => {
    console.error('❌ User seed failed:', error)
    return Promise.reject(new Error('❌ User seed failed'))
  }).then((results) => {
    console.log('✅ User seeded successfully')
    return Promise.resolve('User seeded successfully')
  })
}