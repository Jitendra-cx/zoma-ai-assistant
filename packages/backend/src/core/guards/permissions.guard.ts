import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { RequestUser } from '@core/decorators/current-user.decorator'
import { PERMISSIONS_KEY } from '@core/decorators/permissions.decorator'
import { PermissionService } from '@core/services/permission.service'

/**
 * Guard to check if the user has the required permissions to access the resource
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name)

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from route metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as RequestUser

    // Check if user is authenticated
    if (!user || !user.role) {
      this.logger.warn('User or role not found in request')
      throw new ForbiddenException('User role not found')
    }

    try {
      // Get role permissions (from cache or DB)
      const rolePermissions = await this.permissionService.getRolePermissions(user.role)

      // Check if role has all_permission flag
      if (rolePermissions.allPermission) {
        return true
      }

      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every((permission) =>
        rolePermissions.permissions.includes(permission),
      )

      if (!hasAllPermissions) {
        // const missingPermissions = requiredPermissions.filter(
        //   (permission) => !rolePermissions.permissions.includes(permission),
        // )
        // this.logger.warn(
        //   `User ${user.uuid} (role: ${user.role}) lacks permissions: ${missingPermissions.join(', ')}`,
        // )
        throw new ForbiddenException(
          'Insufficient permissions',
          'You do not have the necessary permissions to access this resource.',
        )
      }

      return true
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error
      }

      this.logger.error('Error checking permissions', error)
      throw new ForbiddenException('Error checking permissions')
    }
  }
}
