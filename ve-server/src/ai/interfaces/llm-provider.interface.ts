export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  model?: string;
}

export interface ILlmProvider {
  generateCompletion(options: LlmCompletionOptions): Promise<string>;
}
