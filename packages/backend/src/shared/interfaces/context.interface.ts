export type FieldType =
  | 'opportunity_description'
  | 'project_note'
  | 'table_cell'
  | 'comment'
  | 'custom_field'

export type ContextOption =
  | 'opportunity_details'
  | 'current_tab'
  | 'related_fields'
  | 'user_history'

export interface FieldContext {
  fieldType: FieldType
  entityId?: string
  fieldId?: string
  text: string
  metadata?: Record<string, any>
}

export interface AssembledContext {
  primaryText: string
  metadata: {
    fieldType: FieldType
    fieldName?: string
    [key: string]: any
  }
  relatedData: {
    opportunity?: any
    project?: any
    relatedFields?: any[]
    currentTab?: string
    userHistory?: any[]
  }
  formattedContext?: string
}
