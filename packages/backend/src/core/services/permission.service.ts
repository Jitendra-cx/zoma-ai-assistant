import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { RedisService } from '@core/redis/redis.service'
import { PrismaService } from '@core/database/prisma.service'

export interface RolePermissions {
  roleName: string
  allPermission: boolean
  permissions: string[]
}

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name)
  private readonly cacheTTL: number

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Cache TTL: 1 hour (3600 seconds)
    this.cacheTTL = this.configService.get<number>('redis.ttlRolePermissions') || 3600
  }

  /**
   * Get role permissions from cache or database
   * @param roleName - Name of the role
   * @returns Role permissions including all_permission flag and permission names
   */
  async getRolePermissions(roleName: string): Promise<RolePermissions> {
    const cacheKey = `role:permissions:${roleName}`

    try {
      // Try to get from cache first
      if (this.redisService.connected) {
        const cached = await this.redisService.getJson<RolePermissions>(cacheKey)
        if (cached) {
          // this.logger.debug(`Role permissions for ${roleName} found in cache`)
          return cached
        }
      }

      // Cache miss - fetch from database
      // this.logger.debug(`Fetching role permissions for ${roleName} from database`)
      const rolePermissions = await this.fetchRolePermissionsFromDB(roleName)

      // Store in cache
      if (this.redisService.connected) {
        await this.redisService.setJson(cacheKey, rolePermissions, this.cacheTTL)
        // this.logger.debug(`Cached role permissions for ${roleName}`)
      }

      return rolePermissions
    } catch (error) {
      this.logger.error(`Error getting role permissions for ${roleName}`, error)
      throw error
    }
  }

  /**
   * Fetch role permissions from database
   */
  private async fetchRolePermissionsFromDB(roleName: string): Promise<RolePermissions> {
    const role = await this.prisma.role.findFirst({
      where: {
        name: roleName,
        is_active: true,
        deleted_at: null,
      },
      include: {
        permissions: {
          where: {
            deleted_at: null,
          },
          include: {
            permission: {
              where: {
                is_active: true,
                deleted_at: null,
              },
            },
          },
        },
      },
    })

    if (!role) {
      // this.logger.warn(`Role ${roleName} not found`)
      return {
        roleName,
        allPermission: false,
        permissions: [],
      }
    }

    // Extract permission names
    const permissions = role.permissions
      .map((rp) => rp.permission?.name)
      .filter((name): name is string => !!name)

    return {
      roleName: role.name || roleName,
      allPermission: role.all_permission || false,
      permissions,
    }
  }

  /**
   * Invalidate role permissions cache
   * Call this when role permissions are updated
   */
  async invalidateRoleCache(roleName: string): Promise<void> {
    if (!this.redisService.connected) {
      return
    }

    const cacheKey = `role:permissions:${roleName}`
    try {
      await this.redisService.del(cacheKey)
      // this.logger.debug(`Invalidated cache for role ${roleName}`)
    } catch (error) {
      this.logger.error(`Error invalidating cache for role ${roleName}`, error)
    }
  }

  /**
   * Check if a role has a specific permission
   * @param roleName - Name of the role
   * @param permissionName - Name of the permission to check
   * @returns true if role has permission or all_permission flag is true
   */
  async hasPermission(roleName: string, permissionName: string): Promise<boolean> {
    const rolePermissions = await this.getRolePermissions(roleName)

    if (rolePermissions.allPermission) {
      return true
    }

    return rolePermissions.permissions.includes(permissionName)
  }
}
