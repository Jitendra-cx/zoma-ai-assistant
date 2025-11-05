import { Module } from '@nestjs/common'
import { AIController } from './ai.controller'
import { AIService } from './ai.service'
import { LLMModule } from './llm/llm.module'
import { ContextModule } from './context/context.module'
import { PromptModule } from './prompt/prompt.module'
import { SSEModule } from './sse/sse.module'
import { SessionModule } from './session/session.module'
import { RateLimitModule } from '@core/services/rate-limit/rate-limit.module'

@Module({
  imports: [LLMModule, ContextModule, PromptModule, SSEModule, SessionModule, RateLimitModule],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
