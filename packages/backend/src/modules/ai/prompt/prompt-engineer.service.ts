import { Injectable } from '@nestjs/common'
import { AssembledContext } from '@shared/interfaces/context.interface'

export type AIAction =
  | 'improve'
  | 'make_shorter'
  | 'summarize'
  | 'fix_grammar'
  | 'change_tone'
  | 'free_prompt'
  | 'expand'

export interface PromptResult {
  systemPrompt: string
  userPrompt: string
}

@Injectable()
export class PromptEngineerService {
  /**
   * Build the system and user prompts for the AI assistant
   */
  buildPrompt(
    action: AIAction,
    context: AssembledContext,
    customPrompt?: string,
    tone?: string,
  ): PromptResult {
    const systemPrompt = this.getSystemPrompt(action)
    const userPrompt = this.buildUserPrompt(action, context, customPrompt, tone)

    return { systemPrompt, userPrompt }
  }

  /**
   * Get the system prompt for the AI assistant
   */
  private getSystemPrompt(action: AIAction): string {
    const basePrompt = `You are a helpful AI assistant that enhances text content.
Your goal is to improve text while maintaining its original meaning and intent.
Return only the enhanced text, without explanations or meta-commentary.`

    const actionPrompts: Record<AIAction, string> = {
      improve: `${basePrompt} Enhance clarity, readability, and professionalism.`,
      make_shorter: `${basePrompt} Condense the text while keeping all key points.`,
      summarize: `${basePrompt} Create a concise summary highlighting main points.`,
      fix_grammar: `${basePrompt} Correct grammar, spelling, and punctuation only. Don't change meaning.`,
      change_tone: `${basePrompt} Adjust tone as requested while keeping content intact.`,
      free_prompt: basePrompt,
      expand: `${basePrompt} Expand on key points with relevant details.`,
    }

    return actionPrompts[action] || basePrompt
  }

  /**
   * Build the user prompt for the AI assistant
   */
  private buildUserPrompt(
    action: AIAction,
    context: AssembledContext,
    customPrompt?: string,
    tone?: string,
  ): string {
    let prompt = ''

    // Add context if available
    if (context.formattedContext) {
      prompt += `Context:\n${context.formattedContext}\n\n`
    }

    // Add original text
    prompt += `Original Text:\n${context.primaryText}\n\n`

    // Add action-specific instruction
    if (action === 'free_prompt' && customPrompt) {
      prompt += `Task: ${customPrompt}\n\nPlease enhance the text according to the task above.`
    } else if (action === 'change_tone' && tone) {
      prompt += `Task: Change the tone to: ${tone}\n\nPlease modify the text accordingly.`
    } else {
      prompt += `Task: ${this.getActionDescription(action)}\n\nPlease perform the requested action on the text above.`
    }

    return prompt
  }

  /**
   * Get the description of the action
   */
  private getActionDescription(action: AIAction): string {
    const descriptions: Record<AIAction, string> = {
      improve: 'Enhance and improve this text',
      make_shorter: 'Make this text shorter while keeping key points',
      summarize: 'Summarize this text',
      fix_grammar: 'Fix grammar and spelling errors',
      change_tone: 'Change the tone',
      expand: 'Expand on the key points',
      free_prompt: 'Enhance according to custom instructions',
    }

    return descriptions[action] || 'Enhance this text'
  }
}
