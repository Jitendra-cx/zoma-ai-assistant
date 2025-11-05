import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'
import {
  ILLMProvider,
  LLMCompletionRequest,
  LLMChunk,
  LLMProvider,
} from '@shared/interfaces/llm-provider.interface'

@Injectable()
export class ClaudeProvider implements ILLMProvider {
  private readonly logger = new Logger(ClaudeProvider.name)
  private client: Anthropic

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('llm.claudeApiKey')
    if (!apiKey) {
      this.logger.warn('Claude API key not configured')
      return
    }

    this.client = new Anthropic({
      apiKey,
    })
  }

  getName(): LLMProvider {
    return 'claude'
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.client) return false
      // Claude doesn't have a simple test endpoint, so we check if client exists
      return !!this.client
    } catch (error) {
      this.logger.error('Claude provider unavailable', error)
      return false
    }
  }

  estimateTokens(text: string): number {
    // Claude uses similar token estimation
    return Math.ceil(text.length / 4)
  }

  async *streamCompletion(request: LLMCompletionRequest): AsyncGenerator<LLMChunk> {
    if (!this.client) {
      throw new Error('Claude client not initialized')
    }

    try {
      const stream = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature ?? 0.7,
        system: request.systemPrompt,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
        stream: true,
      })

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield {
            text: chunk.delta.text,
            tokens: this.estimateTokens(chunk.delta.text),
          }
        }
      }
    } catch (error) {
      this.logger.error('Claude streaming error', error)
      throw error
    }
  }
}
