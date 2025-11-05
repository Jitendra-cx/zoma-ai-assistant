import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsObject,
  ValidateNested,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator'
import { Type } from 'class-transformer'
import { FieldType, ContextOption } from '@shared/interfaces/context.interface'
import { AIAction } from '../prompt/prompt-engineer.service'

export class FieldContextDto {
  @IsEnum(['opportunity_description', 'project_note', 'table_cell', 'comment', 'custom_field'])
  @IsNotEmpty()
  fieldType: FieldType

  @IsString()
  @IsOptional()
  entityId?: string

  @IsString()
  @IsOptional()
  fieldId?: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>
}

export class EnhanceOptionsDto {
  @IsNumber()
  @Min(0)
  @Max(2)
  @IsOptional()
  temperature?: number

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxTokens?: number

  @IsOptional()
  stream?: boolean
}

export class EnhanceDto {
  @IsString()
  @IsNotEmpty()
  text: string

  @IsEnum([
    'improve',
    'make_shorter',
    'summarize',
    'fix_grammar',
    'change_tone',
    'free_prompt',
    'expand',
  ])
  @IsNotEmpty()
  action: AIAction

  @ValidateNested()
  @Type(() => FieldContextDto)
  @IsNotEmpty()
  context: FieldContextDto

  @IsArray()
  @IsOptional()
  @IsEnum(['opportunity_details', 'current_tab', 'related_fields', 'user_history'], {
    each: true,
  })
  includeContext?: ContextOption[]

  @IsString()
  @IsOptional()
  customPrompt?: string

  @IsString()
  @IsOptional()
  tone?: string
}
