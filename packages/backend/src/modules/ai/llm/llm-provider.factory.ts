import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ILLMProvider, LLMProvider } from '@shared/interfaces/llm-provider.interface'
import { OpenAIProvider } from './providers/openai.provider'
import { ClaudeProvider } from './providers/claude.provider'
import { GeminiProvider } from './providers/gemini.provider'
import { MockProvider } from './providers/mock.provider'

/**
 * Factory to create the appropriate LLM provider based on the configuration
 */
@Injectable()
export class LLMProviderFactory {
  private readonly logger = new Logger(LLMProviderFactory.name)
  private readonly useMockProvider: boolean

  constructor(
    private configService: ConfigService,
    private openaiProvider: OpenAIProvider,
    private claudeProvider: ClaudeProvider,
    private geminiProvider: GeminiProvider,
    private mockProvider: MockProvider,
  ) {
    this.useMockProvider = this.configService.get<boolean>('llm.useMockProvider')
  }

  /**
   * Create the configured LLM provider
   */
  create(provider: LLMProvider): ILLMProvider {
    switch (provider) {
      case 'openai':
        return this.openaiProvider
      case 'claude':
        return this.claudeProvider
      case 'gemini':
        return this.geminiProvider
      case 'mock':
        return this.mockProvider
      default:
        throw new Error(`Unknown LLM provider: ${provider}`)
    }
  }

  getDefault(): ILLMProvider {
    const defaultProvider = this.configService.get<LLMProvider>('llm.defaultProvider')
    return this.create(defaultProvider)
  }

  async getAvailableProvider(): Promise<ILLMProvider> {
    // In development, try mock provider first if explicitly requested
    if (this.useMockProvider) {
      this.logger.log('Using mock provider (development mode, useMockProvider=true)')
      return this.mockProvider
    }

    // Try default provider first
    const defaultProvider = this.configService.get<LLMProvider>('llm.defaultProvider')
    const defaultInstance = this.create(defaultProvider)

    if (await defaultInstance.isAvailable()) {
      return defaultInstance
    }

    this.logger.warn(`Default provider ${defaultProvider} unavailable, trying fallback providers`)

    // Try fallback providers
    const fallbackProviders = this.configService.get<string[]>('llm.fallbackProviders') || []

    for (const providerName of fallbackProviders) {
      try {
        const provider = this.create(providerName as LLMProvider)
        if (await provider.isAvailable()) {
          this.logger.log(`Using fallback provider: ${providerName}`)
          return provider
        }
      } catch (error) {
        this.logger.error(`Failed to check provider ${providerName}`, error)
      }
    }

    // In development, fallback to mock provider if no other providers are available
    if (this.useMockProvider) {
      this.logger.warn(
        'No real LLM providers available, falling back to mock provider (development mode)',
      )
      return this.mockProvider
    }

    throw new Error('No LLM providers available')
  }
}
