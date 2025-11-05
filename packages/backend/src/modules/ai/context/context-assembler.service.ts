import { Injectable, Logger } from '@nestjs/common'
import { FieldContext, ContextOption, AssembledContext } from '@shared/interfaces/context.interface'
import { DataSanitizerService } from './data-sanitizer.service'

/**
 * Service to assemble the context for the AI assistant
 */
@Injectable()
export class ContextAssemblerService {
  private readonly logger = new Logger(ContextAssemblerService.name)

  constructor(private readonly dataSanitizer: DataSanitizerService) {}

  /**
   * Assemble the context for the AI assistant
   * @param context - The context object
   * @param options - The options for the context
   * @param userPermissions - The user permissions
   * @returns The assembled context
   */
  async assemble(
    context: FieldContext,
    options: ContextOption[] = [],
    userPermissions?: any,
  ): Promise<AssembledContext> {
    const assembled: AssembledContext = {
      primaryText: context.text,
      metadata: {
        fieldType: context.fieldType,
        fieldId: context.fieldId,
        ...context.metadata,
      },
      relatedData: {},
    }

    try {
      // Assemble based on field type
      switch (context.fieldType) {
        case 'opportunity_description':
          await this.assembleOpportunityContext(context, options, assembled)
          break
        case 'project_note':
          await this.assembleProjectContext(context, options, assembled)
          break
        case 'table_cell':
          await this.assembleTableCellContext(context, options, assembled)
          break
        case 'comment':
          await this.assembleCommentContext(context, options, assembled)
          break
        default:
          this.logger.warn(`Unknown field type: ${context.fieldType}`)
      }

      // Sanitize data before sending to LLM
      const sanitized = this.dataSanitizer.sanitize(assembled, userPermissions || {})

      // Format for LLM consumption
      return this.formatForLLM(sanitized)
    } catch (error) {
      this.logger.error('Error assembling context', error)
      // Return basic context if assembly fails
      return {
        ...assembled,
        formattedContext: '',
      }
    }
  }

  /**
   * Assemble the context for the opportunity
   * @param context - The context object
   * @param options - The options for the context
   * @param assembled - The assembled context
   * @returns void
   */
  private async assembleOpportunityContext(
    context: FieldContext,
    options: ContextOption[],
    assembled: AssembledContext,
  ): Promise<void> {
    if (options.includes('opportunity_details') && context.entityId) {
      // TODO: Fetch opportunity from database/service
      // const opportunity = await this.opportunityService.getById(context.entityId)
      // assembled.relatedData.opportunity = opportunity

      // Mock data for now
      assembled.relatedData.opportunity = {
        id: context.entityId,
        name: 'Sample Opportunity',
        stage: 'Proposal',
      }
    }

    if (options.includes('related_fields') && context.entityId) {
      // TODO: Fetch related fields
      // assembled.relatedData.relatedFields = await this.getRelatedFields(context.entityId)
      assembled.relatedData.relatedFields = []
    }
  }

  private async assembleProjectContext(
    context: FieldContext,
    options: ContextOption[],
    assembled: AssembledContext,
  ): Promise<void> {
    if (options.includes('current_tab') && context.metadata?.currentTab) {
      assembled.relatedData.currentTab = context.metadata.currentTab
    }

    if (options.includes('opportunity_details') && context.entityId) {
      // TODO: Fetch project details
      // assembled.relatedData.project = await this.projectService.getById(context.entityId)
    }
  }

  private async assembleTableCellContext(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: FieldContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: ContextOption[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    assembled: AssembledContext,
  ): Promise<void> {
    // TODO: Implement table cell context assembly
    this.logger.debug('Table cell context assembly')
  }

  private async assembleCommentContext(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: FieldContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: ContextOption[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    assembled: AssembledContext,
  ): Promise<void> {
    // TODO: Implement comment context assembly
    this.logger.debug('Comment context assembly')
  }

  private formatForLLM(context: AssembledContext): AssembledContext {
    const parts: string[] = []

    if (context.relatedData.opportunity) {
      parts.push(`Opportunity: ${context.relatedData.opportunity.name || 'N/A'}`)
      if (context.relatedData.opportunity.stage) {
        parts.push(`Stage: ${context.relatedData.opportunity.stage}`)
      }
    }

    if (context.relatedData.project) {
      parts.push(`Project: ${context.relatedData.project.name || 'N/A'}`)
    }

    if (context.relatedData.currentTab) {
      parts.push(`Current Tab: ${context.relatedData.currentTab}`)
    }

    context.formattedContext = parts.length > 0 ? parts.join(', ') : ''
    return context
  }
}
