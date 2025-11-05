import { permissionSeeder } from './permission'
import { roleSeeder } from './role'
import { rolePermissionSeeder } from './role-permission'
import { userSeeder } from './user'

const seeders = [
  permissionSeeder, 
  roleSeeder, 
  rolePermissionSeeder,
  userSeeder,
]

export default seeders