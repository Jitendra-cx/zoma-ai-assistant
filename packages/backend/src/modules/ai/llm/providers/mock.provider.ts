import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  ILLMProvider,
  LLMCompletionRequest,
  LLMChunk,
  LLMProvider,
} from '@shared/interfaces/llm-provider.interface'

/**
 * Dummy text samples for testing/development
 */
const DUMMY_TEXTS = [
  'This is a sample enhanced text that demonstrates how the AI assistant improves your content. ',
  'It provides suggestions and refinements to make your writing more clear, concise, and engaging. ',
  'The system analyzes your input and generates improvements that maintain your original intent. ',
  'You can use this for testing streaming functionality without making actual API calls. ',
  'Each chunk is delivered with realistic delays to simulate real-world streaming behavior. ',
  'This helps developers test the frontend integration and streaming mechanisms efficiently. ',
  'The dummy text includes varied sentence structures and lengths to mimic real AI responses. ',
  'Feel free to customize the dummy text or add more samples as needed for your testing scenarios. ',
]

/**
 * Default dummy text for streaming
 */
const DEFAULT_DUMMY_TEXT =
  'This is a stream of dummy text for testing purposes. It simulates the streaming behavior of an LLM provider without making actual API calls. Each chunk is delivered with a small delay to mimic real-world streaming. You can customize this text or use your own dummy content for development and testing.'

/**
 * Mock/Development Provider
 * Provides dummy streaming responses for testing and development
 * without making actual API calls to LLM services
 */
@Injectable()
export class MockProvider implements ILLMProvider {
  private readonly logger = new Logger(MockProvider.name)
  private readonly chunkDelayMs = 200 // Delay between chunks in milliseconds
  private readonly chunkSize = 5 // Number of words per chunk

  constructor(private configService: ConfigService) {
    const useMockProvider = this.configService.get<boolean>('llm.useMockProvider')
    if (!useMockProvider) {
      this.logger.warn(
        'To use MockProvider, set USE_MOCK_PROVIDER=true and NODE_ENV=development in the environment variables',
      )
    }
  }

  getName(): LLMProvider {
    return 'mock'
  }

  async isAvailable(): Promise<boolean> {
    // Mock provider is always available if useMockProvider is true
    return this.configService.get<boolean>('llm.useMockProvider')
  }

  estimateTokens(text: string): number {
    // Simple token estimation (same as other providers)
    return Math.ceil(text.length / 4)
  }

  /**
   * Generates dummy text based on request context
   */
  private generateDummyText(request: LLMCompletionRequest): string {
    const prompt = request.prompt.toLowerCase()

    // If prompt suggests specific content, generate relevant dummy text
    if (prompt.includes('improve') || prompt.includes('enhance')) {
      return DUMMY_TEXTS.join('')
    }

    if (prompt.includes('translate')) {
      return 'This is a translated version of your text. The translation maintains the original meaning while adapting to the target language naturally. '
    }

    if (prompt.includes('summarize')) {
      return 'Here is a concise summary of the key points: The main concepts are presented clearly, important details are highlighted, and the overall message is preserved in a more compact form. '
    }

    // Use default text or repeat it for longer outputs
    const baseText = DEFAULT_DUMMY_TEXT
    const maxTokens = request.maxTokens || 1000
    const estimatedTokens = this.estimateTokens(baseText)

    if (estimatedTokens < maxTokens) {
      // Repeat text to reach desired length
      const repetitions = Math.ceil(maxTokens / estimatedTokens)
      return baseText.repeat(Math.min(repetitions, 3)) // Limit to 3 repetitions
    }

    return baseText
  }

  /**
   * Chunks text into smaller pieces for streaming
   */
  private chunkText(text: string): string[] {
    const words = text.split(' ')
    const chunks: string[] = []

    for (let i = 0; i < words.length; i += this.chunkSize) {
      const chunk = words.slice(i, i + this.chunkSize).join(' ')
      if (chunk.trim()) {
        chunks.push(chunk + ' ')
      }
    }

    return chunks
  }

  /**
   * Streams dummy text based on the request
   */
  async *streamCompletion(request: LLMCompletionRequest): AsyncGenerator<LLMChunk> {
    const useMockProvider = this.configService.get<boolean>('llm.useMockProvider')
    if (!useMockProvider) {
      throw new Error(
        'MockProvider can only be used in development environment and useMockProvider is true',
      )
    }

    this.logger.debug('Using mock LLM provider for streaming (development mode)')

    try {
      // Generate dummy text based on request
      const textToStream = this.generateDummyText(request)

      // Split text into chunks
      const chunks = this.chunkText(textToStream)

      // Stream chunks with delays to simulate real streaming
      for (const chunk of chunks) {
        await new Promise((resolve) => setTimeout(resolve, this.chunkDelayMs))

        yield {
          text: chunk,
          tokens: this.estimateTokens(chunk),
        }
      }

      // Send final chunk with finish reason
      yield {
        text: '',
        tokens: 0,
        finishReason: 'stop',
      }
    } catch (error) {
      this.logger.error('Mock provider streaming error', error)
      throw error
    }
  }
}
