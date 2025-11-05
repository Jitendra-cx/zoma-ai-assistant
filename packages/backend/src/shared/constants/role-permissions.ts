import { ROLES } from './roles'
import { PERMISSIONS } from './permissions'

/**
 * Role's permissions mapping for the application
 */
export const ROLE_PERMISSIONS: Array<{ role: string; permissions: string[] }> = [
  {
    role: ROLES.GENERAL_USER,
    permissions: [
      PERMISSIONS.AI_ENHANCE_CREATE,
      PERMISSIONS.AI_ENHANCE_VIEW,
      PERMISSIONS.AI_SESSION_VIEW,
      PERMISSIONS.AI_STREAM_ACCESS,
      PERMISSIONS.AI_ACTION_IMPROVE,
      PERMISSIONS.AI_ACTION_SUMMARIZE,
      PERMISSIONS.AI_ACTION_SHORTEN,
      PERMISSIONS.AI_ACTION_FIX_GRAMMAR,
      PERMISSIONS.AI_ACTION_CHANGE_TONE,
      PERMISSIONS.AI_ACTION_EXPAND,
      PERMISSIONS.AI_ACTION_FREE_PROMPT,
      PERMISSIONS.USER_VIEW,
    ],
  },
]
