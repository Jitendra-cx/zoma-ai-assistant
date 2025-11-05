import { PrismaClient } from '@prisma/client'
import { ROLE_PERMISSIONS } from '../../src/shared/constants/role-permissions'

export const rolePermissionSeeder = async (prisma: PrismaClient) => {
  console.log('🌱 Seeding role-permission relationships...')

  const results: any[] = []

  for (const rolePermission of ROLE_PERMISSIONS) {
    // Find role by name
    const role = await prisma.role.findFirst({
      where: { name: rolePermission.role },
    })

    if (!role) {
      console.warn(`⚠️  Role "${rolePermission.role}" not found, skipping...`)
      continue
    }

    const { id: roleId } = role

    // Find all permissions by names
    const permissions = await prisma.permission.findMany({
      where: {
        name: {
          in: rolePermission.permissions,
        },
      },
    })

    if (permissions.length === 0) {
      console.warn(`⚠️  No permissions found for role "${rolePermission.role}", skipping...`)
      continue
    }

    // Upsert role-permission relationships
    const rolePermissions = await Promise.all(
      permissions.map(async (permission) => {
        // Check if relationship already exists
        const existing = await prisma.rolePermission.findFirst({
          where: {
            role_id: roleId,
            permission_id: permission.id,
            deleted_at: null,
          },
        })

        if (existing) {
          return existing
        }

        // Create new relationship
        return prisma.rolePermission.create({
          data: {
            role_id: roleId,
            permission_id: permission.id,
          },
        })
      }),
    )

    results.push(...rolePermissions)
    console.log(`  ✅ "${rolePermission.role}": ${rolePermissions.length} permissions assigned`)
  }

  console.log(`✅ Seeded ${results.length} role-permission relationships`)
  return Promise.resolve(`Seeded ${results.length} role-permission relationships`)
}