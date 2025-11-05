import { LLMProvider } from '@shared/interfaces/llm-provider.interface'
import { AIAction } from '../../prompt/prompt-engineer.service'
import { FieldContext } from '@shared/interfaces/context.interface'

export type SessionStatus = 'pending' | 'streaming' | 'completed' | 'cancelled' | 'error'

export interface AISession {
  sessionId: string
  userId: string
  status: SessionStatus
  originalText: string
  enhancedText?: string
  action: AIAction
  provider: LLMProvider
  context: FieldContext
  usage?: {
    inputTokens: number
    outputTokens: number
    cost: number
  }
  createdAt: Date
  completedAt?: Date
  error?: string
}
