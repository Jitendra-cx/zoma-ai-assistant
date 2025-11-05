import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'
import {
  ILLMProvider,
  LLMCompletionRequest,
  LLMChunk,
  LLMProvider,
} from '@shared/interfaces/llm-provider.interface'

@Injectable()
export class OpenAIProvider implements ILLMProvider {
  private readonly logger = new Logger(OpenAIProvider.name)
  private client: OpenAI

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('llm.openaiApiKey')
    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured')
      return
    }

    this.client = new OpenAI({
      apiKey,
    })
  }

  getName(): LLMProvider {
    return 'openai'
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.client) return false
      // Test with a simple API call
      await this.client.models.list()
      return true
    } catch (error) {
      this.logger.error('OpenAI provider unavailable', error)
      return false
    }
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English
    return Math.ceil(text.length / 4)
  }

  async *streamCompletion(request: LLMCompletionRequest): AsyncGenerator<LLMChunk> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized')
    }

    try {
      const stream = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          ...(request.systemPrompt
            ? [{ role: 'system' as const, content: request.systemPrompt }]
            : []),
          { role: 'user' as const, content: request.prompt },
        ],
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: true,
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield {
            text: content,
            tokens: this.estimateTokens(content),
            finishReason: chunk.choices[0]?.finish_reason as any,
          }
        }
      }
    } catch (error) {
      this.logger.error('OpenAI streaming error', error)
      throw error
    }
  }
}
