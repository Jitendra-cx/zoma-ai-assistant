import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common'
import { Response } from 'express'
import { RequestUser } from '@core/decorators/current-user.decorator'
import { RateLimitService } from '@core/services/rate-limit/rate-limit.service'
import { FieldContext } from '@shared/interfaces/context.interface'
import { ILLMProvider } from '@shared/interfaces/llm-provider.interface'
import { EnhanceDto } from './dto/enhance.dto'
import { ContextAssemblerService } from './context/context-assembler.service'
import { PromptEngineerService } from './prompt/prompt-engineer.service'
import { SessionManagerService } from './session/session-manager.service'
import { SSEService } from './sse/sse.service'
import { LLMProviderFactory } from './llm/llm-provider.factory'

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name)

  constructor(
    @Inject('LLM_PROVIDER') private readonly llmProvider: ILLMProvider,
    private readonly llmProviderFactory: LLMProviderFactory,
    private readonly contextAssembler: ContextAssemblerService,
    private readonly promptEngineer: PromptEngineerService,
    private readonly sessionManager: SessionManagerService,
    private readonly sseService: SSEService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async createEnhancementRequest(enhanceDto: EnhanceDto, userUId: string) {
    // Determine provider
    const provider = this.llmProvider.getName()

    // Create session
    const session = await this.sessionManager.create({
      userUId: userUId,
      originalText: enhanceDto.text,
      action: enhanceDto.action,
      provider: provider,
      context: {
        fieldType: enhanceDto.context.fieldType,
        entityId: enhanceDto.context.entityId,
        fieldId: enhanceDto.context.fieldId,
        text: enhanceDto.text,
        metadata: enhanceDto.context.metadata,
      } as FieldContext,
    })

    // Estimate tokens
    const estimatedTokens = this.llmProvider.estimateTokens(
      enhanceDto.text + (enhanceDto.customPrompt || ''),
    )

    // Get rate limit info
    const rateLimitInfo = await this.rateLimitService.getRateLimitInfo({
      identifier: userUId,
      type: 'requests',
    })

    const rateLimit = {
      remaining: rateLimitInfo.remaining,
      resetAt: rateLimitInfo.resetAtISO,
    }

    return {
      sessionId: session.sessionId,
      streamUrl: `/api/ai/stream/${session.sessionId}`,
      estimatedTokens,
      rateLimit,
    }
  }

  async streamEnhancement(sessionId: string, user: RequestUser, res: Response): Promise<void> {
    // Get session
    const session = await this.sessionManager.get(sessionId)
    if (!session) {
      this.sseService.sendError(res, new Error('Session not found'))
      return
    }

    // Verify ownership
    if (session.userUId !== user.uuid) {
      this.sseService.sendError(res, new Error('Unauthorized'))
      return
    }

    // Verify session is not cancelled
    if (session.status === 'cancelled') {
      this.sseService.sendError(res, new Error('Session is cancelled'), sessionId)
      return
    }

    // Setup SSE connection
    this.sseService.setupConnection(res, sessionId)

    try {
      // Update session status
      await this.sessionManager.update(sessionId, { status: 'streaming' })

      // Get LLM provider (use specified or default)
      const provider = this.llmProviderFactory.create(session.provider)

      // Assemble context (would use includeContext from request)
      const context = await this.contextAssembler.assemble(
        session.context,
        [], // TODO: Get from session or request
        user,
      )

      // Build prompt
      const { systemPrompt, userPrompt } = this.promptEngineer.buildPrompt(
        session.action,
        context,
        undefined, // TODO: Get customPrompt from session
        undefined, // TODO: Get tone from session
      )

      // Stream LLM response
      let fullResponse = ''
      const inputTokens = provider.estimateTokens(userPrompt + systemPrompt)
      let outputTokens = 0
      let isCancelled = false

      for await (const chunk of provider.streamCompletion({
        prompt: userPrompt,
        systemPrompt,
        temperature: 0.7,
        maxTokens: 1000,
      })) {
        // Check if session was cancelled during streaming
        const currentSession = await this.sessionManager.get(sessionId)
        if (currentSession?.status === 'cancelled') {
          isCancelled = true
          this.sseService.sendCancelled(res, sessionId)
          break
        }

        // Check if connection is still active
        if (!this.sseService.isSessionActive(sessionId)) {
          isCancelled = true
          break
        }

        fullResponse += chunk.text
        outputTokens += chunk.tokens || 0

        this.sseService.sendChunk(res, chunk)
        this.sseService.sendMetadata(res, {
          totalTokens: inputTokens + outputTokens,
          status: 'generating',
        })
      }

      // If cancelled, don't update to completed
      if (isCancelled) {
        // Session status is already 'cancelled', so just clean up
        return
      }

      // Calculate cost
      const cost = this.calculateCost(inputTokens, outputTokens, session.provider)

      // Update session
      await this.sessionManager.update(sessionId, {
        status: 'completed',
        enhancedText: fullResponse,
        usage: {
          inputTokens,
          outputTokens,
          cost,
        },
      })

      // Send completion
      this.sseService.sendDone(
        res,
        {
          sessionId,
          totalTokens: inputTokens + outputTokens,
          usage: {
            inputTokens,
            outputTokens,
            cost,
          },
        },
        sessionId,
      )
    } catch (error) {
      // Check if error is due to cancellation
      const currentSession = await this.sessionManager.get(sessionId)
      if (currentSession?.status === 'cancelled') {
        // Clean up connection tracking
        this.sseService.removeSession(sessionId)
        return // Don't update status or send error, session is already cancelled
      }

      this.logger.error('Streaming error', error)
      await this.sessionManager.update(sessionId, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      this.sseService.sendError(res, error, sessionId)
    } finally {
      // Clean up connection tracking if still active (shouldn't be if properly closed)
      this.sseService.removeSession(sessionId)
    }
  }

  async getSession(sessionId: string, userId: string) {
    const session = await this.sessionManager.get(sessionId)
    if (!session) {
      throw new NotFoundException('Session not found')
    }

    if (session.userUId !== userId) {
      throw new NotFoundException('Session not found')
    }

    return session
  }

  async cancelSession(sessionId: string, userId: string) {
    // Verify ownership before cancelling
    const session = await this.sessionManager.get(sessionId)
    if (!session) {
      throw new NotFoundException('Session not found')
    }
    if (session.userUId !== userId) {
      throw new NotFoundException('Session not found')
    }

    // Check if session is already completed or cancelled
    if (session.status === 'completed' || session.status === 'cancelled') {
      return {
        message: `Session is already ${session.status}`,
        sessionId,
        status: session.status,
      }
    }

    // Mark session as cancelled
    await this.sessionManager.cancel(sessionId)

    // If there's an active SSE connection, close it
    const connectionClosed = this.sseService.closeSession(sessionId)

    return {
      message: 'Session cancelled',
      sessionId,
      streamStopped: connectionClosed,
    }
  }

  async getUsageStats(userUId: string) {
    // TODO: Implement usage tracking with userId
    this.logger.log(`Getting usage stats for user ${userUId}`)
    return {
      total: {
        requests: 0,
        tokens: 0,
        cost: 0,
      },
      period: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
      breakdown: {
        byAction: {},
        byProvider: {},
      },
    }
  }

  private calculateCost(inputTokens: number, outputTokens: number, provider: string): number {
    // Provider-specific pricing (per 1K tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      openai: { input: 0.01, output: 0.03 }, // GPT-4 Turbo
      claude: { input: 0.008, output: 0.024 }, // Claude 3.5 Sonnet
      gemini: { input: 0.001, output: 0.002 }, // Gemini Pro
    }

    const rates = pricing[provider] || pricing.openai
    return (inputTokens * rates.input + outputTokens * rates.output) / 1000
  }
}
