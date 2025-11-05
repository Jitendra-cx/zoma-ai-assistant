export type LLMProvider = 'openai' | 'claude' | 'gemini' | 'mock'

export interface LLMCompletionRequest {
  prompt: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  stopSequences?: string[]
}

export interface LLMChunk {
  text: string
  tokens?: number
  finishReason?: 'stop' | 'length' | 'content_filter'
}

export interface ILLMProvider {
  streamCompletion(request: LLMCompletionRequest): AsyncGenerator<LLMChunk>
  estimateTokens(text: string): number
  getName(): LLMProvider
  isAvailable(): Promise<boolean>
}
