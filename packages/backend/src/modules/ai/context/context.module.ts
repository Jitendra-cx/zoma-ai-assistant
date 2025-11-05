import { Module } from '@nestjs/common'
import { ContextAssemblerService } from './context-assembler.service'
import { DataSanitizerService } from './data-sanitizer.service'

@Module({
  providers: [ContextAssemblerService, DataSanitizerService],
  exports: [ContextAssemblerService, DataSanitizerService],
})
export class ContextModule {}
