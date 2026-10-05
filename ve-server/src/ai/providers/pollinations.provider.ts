import { Injectable, Logger } from '@nestjs/common';
import {
  ILlmProvider,
  LlmCompletionOptions,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class PollinationsProvider implements ILlmProvider {
  private readonly logger = new Logger(PollinationsProvider.name);
  private readonly endpoint = 'https://text.pollinations.ai/';

  async generateCompletion(options: LlmCompletionOptions): Promise<string> {
    const model = options.model || 'openai';

    try {
      this.logger.log(`Calling Pollinations AI with model: ${model}`);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/plain, application/json',
        },
        body: JSON.stringify({
          messages: options.messages,
          model: model,
          seed: Math.floor(Math.random() * 100000),
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(
          `Pollinations AI responded with HTTP status ${response.status}: ${response.statusText}`,
        );
      }

      const text = await response.text();
      return text.trim();
    } catch (error) {
      this.logger.error(
        `Pollinations AI completion failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
