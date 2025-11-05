/**
 * Permissions list for the application
 */
export const PERMISSIONS = {
  // AI Operations
  AI_ENHANCE_CREATE: 'ai.enhance.create',
  AI_ENHANCE_VIEW: 'ai.enhance.view',
  AI_SESSION_VIEW: 'ai.session.view',
  AI_SESSION_MANAGE: 'ai.session.manage',
  AI_STREAM_ACCESS: 'ai.stream.access',
  AI_USAGE_VIEW: 'ai.usage.view',
  AI_USAGE_ALL: 'ai.usage.all', // View all users' usage

  // AI Actions (granular permissions for each action)
  AI_ACTION_IMPROVE: 'ai.action.improve',
  AI_ACTION_SUMMARIZE: 'ai.action.summarize',
  AI_ACTION_SHORTEN: 'ai.action.shorten',
  AI_ACTION_FIX_GRAMMAR: 'ai.action.fix_grammar',
  AI_ACTION_CHANGE_TONE: 'ai.action.change_tone',
  AI_ACTION_EXPAND: 'ai.action.expand',
  AI_ACTION_FREE_PROMPT: 'ai.action.free_prompt',

  // LLM Provider Management
  AI_PROVIDER_VIEW: 'ai.provider.view',
  AI_PROVIDER_MANAGE: 'ai.provider.manage',
  AI_PROVIDER_SELECT: 'ai.provider.select', // Choose provider for requests

  // User Management
  USER_CREATE: 'user.create',
  USER_VIEW: 'user.view',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_LIST: 'user.list',

  // Role & Permission Management
  ROLE_CREATE: 'role.create',
  ROLE_VIEW: 'role.view',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',
  ROLE_LIST: 'role.list',
  ROLE_ASSIGN: 'role.assign', // Assign roles to users

  PERMISSION_VIEW: 'permission.view',
  PERMISSION_MANAGE: 'permission.manage',

  // Session Management
  SESSION_VIEW_ALL: 'session.view.all', // View all users' sessions
  SESSION_DELETE_ALL: 'session.delete.all', // Delete any session
} as const

export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  // AI Operations
  [PERMISSIONS.AI_ENHANCE_CREATE]: 'Create AI text enhancement requests',
  [PERMISSIONS.AI_ENHANCE_VIEW]: 'View AI enhancement results',
  [PERMISSIONS.AI_SESSION_VIEW]: 'View AI enhancement sessions',
  [PERMISSIONS.AI_SESSION_MANAGE]: 'Manage (approve/reject/regenerate) AI sessions',
  [PERMISSIONS.AI_STREAM_ACCESS]: 'Access AI streaming responses',
  [PERMISSIONS.AI_USAGE_VIEW]: 'View own AI usage statistics',
  [PERMISSIONS.AI_USAGE_ALL]: "View all users' AI usage statistics",

  // AI Actions
  [PERMISSIONS.AI_ACTION_IMPROVE]: 'Use "Improve" AI action',
  [PERMISSIONS.AI_ACTION_SUMMARIZE]: 'Use "Summarize" AI action',
  [PERMISSIONS.AI_ACTION_SHORTEN]: 'Use "Make Shorter" AI action',
  [PERMISSIONS.AI_ACTION_FIX_GRAMMAR]: 'Use "Fix Grammar" AI action',
  [PERMISSIONS.AI_ACTION_CHANGE_TONE]: 'Use "Change Tone" AI action',
  [PERMISSIONS.AI_ACTION_EXPAND]: 'Use "Expand" AI action',
  [PERMISSIONS.AI_ACTION_FREE_PROMPT]: 'Use "Free Prompt" AI action',

  // LLM Provider Management
  [PERMISSIONS.AI_PROVIDER_VIEW]: 'View LLM provider settings',
  [PERMISSIONS.AI_PROVIDER_MANAGE]: 'Manage LLM provider configurations',
  [PERMISSIONS.AI_PROVIDER_SELECT]: 'Select specific LLM provider for requests',

  // User Management
  [PERMISSIONS.USER_CREATE]: 'Create new users',
  [PERMISSIONS.USER_VIEW]: 'View user details',
  [PERMISSIONS.USER_UPDATE]: 'Update user information',
  [PERMISSIONS.USER_DELETE]: 'Delete users',
  [PERMISSIONS.USER_LIST]: 'List all users',

  // Role & Permission Management
  [PERMISSIONS.ROLE_CREATE]: 'Create new roles',
  [PERMISSIONS.ROLE_VIEW]: 'View role details',
  [PERMISSIONS.ROLE_UPDATE]: 'Update roles',
  [PERMISSIONS.ROLE_DELETE]: 'Delete roles',
  [PERMISSIONS.ROLE_LIST]: 'List all roles',
  [PERMISSIONS.ROLE_ASSIGN]: 'Assign roles to users',

  [PERMISSIONS.PERMISSION_VIEW]: 'View permissions',
  [PERMISSIONS.PERMISSION_MANAGE]: 'Manage permissions',

  // Session Management
  [PERMISSIONS.SESSION_VIEW_ALL]: "View all users' AI sessions",
  [PERMISSIONS.SESSION_DELETE_ALL]: 'Delete any AI session',
}
