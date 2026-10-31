/**
 * Chat Message Interface
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * LLM Completion Options Interface
 */
export interface LlmCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  model?: string;
}

/**
 * LLM Provider Interface
 */
export interface ILlmProvider {
  /**
   * Generate completion
   * @param options LlmCompletionOptions
   * @returns string
   */
  generateCompletion(options: LlmCompletionOptions): Promise<string>;
}

/**
 * SSE Streaming Event Payloads
 */
export interface SseStatusEvent {
  type: 'status';
  message: string;
}

export interface SseTokenEvent {
  type: 'token';
  token: string;
}

export interface SseProductsEvent {
  type: 'products';
  products: any[];
  productIds: number[];
}

export interface SseDoneEvent {
  type: 'done';
}

export type SseAiEvent = SseStatusEvent | SseTokenEvent | SseProductsEvent | SseDoneEvent;
