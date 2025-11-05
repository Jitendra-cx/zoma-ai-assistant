import { Module } from '@nestjs/common'
import { PromptEngineerService } from './prompt-engineer.service'

@Module({
  providers: [PromptEngineerService],
  exports: [PromptEngineerService],
})
export class PromptModule {}
