import OpenAI from 'openai';
import { BaseProvider } from './BaseProvider';
import { LLMConfig, LLMMessage, LLMResponse, LLMStreamResponse } from '../types';

export class OpenAIProvider extends BaseProvider {
  private openai: OpenAI;

  constructor(config: LLMConfig) {
    super(config);
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  /**
   * 非流式处理
   */
  public async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    this.validateMessages(messages);

    return this.retry(async () => {
      const response = await this.openai.chat.completions.create({
        model: this.config.modelName,
        messages: messages as any, // OpenAI SDK类型转换
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: false,
      });

      const choice = response.choices[0];
      if (!choice || !choice.message) {
        throw new Error('No response from OpenAI');
      }

      return {
        content: choice.message.content || '',
        usage: response.usage,
        finish_reason: choice.finish_reason,
      };
    });
  }

  /**
   * 流式处理
   */
  public async *chatStream(messages: LLMMessage[]): AsyncIterable<LLMStreamResponse> {
    this.validateMessages(messages);

    const stream = await this.openai.chat.completions.create({
      model: this.config.modelName,
      messages: messages as any, // OpenAI SDK类型转换
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: true,
    });

    let accumulatedContent = '';
    let usage: any = null;

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (choice?.delta?.content) {
        accumulatedContent += choice.delta.content;
        
        yield {
          content: choice.delta.content,
          done: false,
          usage: chunk.usage || usage,
        };
      }

      if (choice?.finish_reason) {
        yield {
          content: '',
          done: true,
          usage: chunk.usage || usage,
          finish_reason: choice.finish_reason,
        };
        break;
      }
    }
  }
}
