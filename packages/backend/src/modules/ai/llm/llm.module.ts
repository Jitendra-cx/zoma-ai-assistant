import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LLMProviderFactory } from './llm-provider.factory'
import { OpenAIProvider } from './providers/openai.provider'
import { ClaudeProvider } from './providers/claude.provider'
import { GeminiProvider } from './providers/gemini.provider'
import { MockProvider } from './providers/mock.provider'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    OpenAIProvider,
    ClaudeProvider,
    GeminiProvider,
    MockProvider,
    LLMProviderFactory,
    {
      provide: 'LLM_PROVIDER',
      useFactory: async (factory: LLMProviderFactory) => {
        return factory.getAvailableProvider()
      },
      inject: [LLMProviderFactory],
    },
    {
      provide: 'LLM_PROVIDER_FACTORY',
      useExisting: LLMProviderFactory,
    },
  ],
  exports: ['LLM_PROVIDER', 'LLM_PROVIDER_FACTORY', LLMProviderFactory],
})
export class LLMModule {}
