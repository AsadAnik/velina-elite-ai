import { Injectable, Logger } from '@nestjs/common';
import {
  ILlmProvider,
  LlmCompletionOptions,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class PollinationsProvider implements ILlmProvider {
  private readonly logger = new Logger(PollinationsProvider.name);
  private readonly endpoint = 'https://text.pollinations.ai/';

  /**
   * Generate completion using Pollinations AI
   * @param options LlmCompletionOptions
   * @returns string
   */
  // region Generate Completion
  async generateCompletion(options: LlmCompletionOptions): Promise<string> {
    const primaryModel = options.model || 'openai';
    // Fallback to 'mistral' if 'openai' times out or fails on free Pollinations endpoint
    const modelsToTry = [primaryModel, 'mistral'];
    let lastError: unknown = null;

    for (const model of modelsToTry) {
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
          signal: AbortSignal.timeout(20000),
        });

        if (response.ok) {
          const text = await response.text();
          if (text && text.trim().length > 0) {
            return text.trim();
          }
        } else {
          this.logger.warn(`Model ${model} returned status ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Pollinations AI model ${model} failed (${error instanceof Error ? error.message : String(error)}). Trying backup model...`,
        );
      }
    }

    this.logger.error(
      `All Pollinations AI models failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    );
    throw lastError || new Error('All LLM models failed to respond');
  }
}
