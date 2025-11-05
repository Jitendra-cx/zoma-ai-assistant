import { Injectable } from '@nestjs/common'
import { hashSync, genSaltSync, compareSync } from 'bcryptjs'

@Injectable()
export class PasswordUtils {
  hashPassword = (password: string): string => {
    if (!password || password.length === 0) {
      throw new Error('Password cannot be empty')
    }
    return hashSync(password, genSaltSync(10))
  }

  verifyPassword = (password: string, hash: string): boolean => {
    if (!password || !hash) return false
    return compareSync(password, hash)
  }
}
