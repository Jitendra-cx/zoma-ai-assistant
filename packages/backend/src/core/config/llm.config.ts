import { registerAs } from '@nestjs/config'

export default registerAs('llm', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  claudeApiKey: process.env.CLAUDE_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp', // Free model
  defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'gemini',
  fallbackProviders: (process.env.LLM_FALLBACK_PROVIDERS || 'claude,gemini').split(','),
  useMockProvider:
    (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') &&
    process.env.USE_MOCK_LLM_PROVIDER === 'true',
}))
