import { Injectable, Logger } from '@nestjs/common'
import { AssembledContext } from '@shared/interfaces/context.interface'

@Injectable()
export class DataSanitizerService {
  private readonly logger = new Logger(DataSanitizerService.name)

  sanitize(context: AssembledContext, userPermissions: any): AssembledContext {
    const sanitized = { ...context }

    // Remove financial details if user doesn't have permission
    if (sanitized.relatedData.opportunity && !userPermissions.canViewFinancials) {
      delete sanitized.relatedData.opportunity.amount
      delete sanitized.relatedData.opportunity.profitMargin
      delete sanitized.relatedData.opportunity.revenue
    }

    // Remove PII (Personally Identifiable Information)
    if (sanitized.relatedData.opportunity) {
      sanitized.relatedData.opportunity = this.removePII(sanitized.relatedData.opportunity)
    }

    if (sanitized.relatedData.project) {
      sanitized.relatedData.project = this.removePII(sanitized.relatedData.project)
    }

    return sanitized
  }

  /**
   * Remove PII (Personally Identifiable Information) from the data
   * @param data - The data to sanitize
   * @returns The sanitized data
   */
  private removePII(data: any): any {
    if (!data || typeof data !== 'object') return data

    const sanitized = { ...data }

    // Remove email addresses
    if (sanitized.email) {
      delete sanitized.email
    }

    // Remove phone numbers
    if (sanitized.phone) {
      delete sanitized.phone
    }

    // Remove SSN or other sensitive IDs
    if (sanitized.ssn) {
      delete sanitized.ssn
    }

    // Add more PII removal logic here...

    return sanitized
  }
}
