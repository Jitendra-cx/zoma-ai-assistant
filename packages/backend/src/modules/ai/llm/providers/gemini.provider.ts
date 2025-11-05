import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GoogleGenAI, ApiError } from '@google/genai'
import {
  ILLMProvider,
  LLMCompletionRequest,
  LLMChunk,
  LLMProvider,
} from '@shared/interfaces/llm-provider.interface'

@Injectable()
export class GeminiProvider implements ILLMProvider {
  private readonly logger = new Logger(GeminiProvider.name)
  private genAI: GoogleGenAI
  private modelName: string

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('llm.geminiApiKey')
    if (!apiKey) {
      this.logger.warn('Gemini API key not configured')
      return
    }

    this.genAI = new GoogleGenAI({ apiKey })
    this.modelName = this.configService.get<string>('llm.geminiModel') || 'gemini-2.0-flash-001'
  }

  getName(): LLMProvider {
    return 'gemini'
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.genAI) return false
      // Test with a simple API call
      const response = await this.genAI.models.list()
      return !!response
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        this.logger.error('Gemini provider unavailable', error.message)
        return false
      }
      this.logger.error('Gemini provider unavailable', error)
      return false
    }
  }

  estimateTokens(text: string): number {
    // Rough estimation for Gemini
    return Math.ceil(text.length / 4)

    // const response = await this.genAI.models.countTokens({
    //   model: this.modelName,
    //   contents: [{ role: 'user', parts: [{ text: text }] }],
    // })
    // return response.totalTokens
  }

  async *streamCompletion(request: LLMCompletionRequest): AsyncGenerator<LLMChunk> {
    if (!this.genAI) {
      throw new Error('Gemini client not initialized')
    }

    try {
      const prompt = request.systemPrompt
        ? `${request.systemPrompt}\n\n${request.prompt}`
        : request.prompt

      const stream = await this.genAI.models.generateContentStream({
        model: this.modelName,
        contents: prompt,
        config: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens,
        },
      })

      for await (const chunk of stream) {
        const text = chunk.text
        if (text) {
          yield {
            text,
            tokens: this.estimateTokens(text),
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        this.logger.error('Gemini provider unavailable', error.message)
        throw new Error(error.message)
      } else {
        this.logger.error('Gemini streaming error', error)
      }
      throw error
    }
  }
}
