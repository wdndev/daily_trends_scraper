import { LLMMessage, LLMConfig, LLMResponse, LLMStreamResponse } from '../types';

export abstract class BaseProvider {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * 非流式处理 - 返回完整响应
   */
  public abstract chat(messages: LLMMessage[]): Promise<LLMResponse>;

  /**
   * 流式处理 - 返回异步迭代器
   */
  public abstract chatStream(messages: LLMMessage[]): AsyncIterable<LLMStreamResponse>;

  /**
   * 构建系统消息
   */
  protected buildSystemMessage(content: string): LLMMessage {
    return {
      role: 'system',
      content,
    };
  }

  /**
   * 构建用户消息
   */
  protected buildUserMessage(content: string): LLMMessage {
    return {
      role: 'user',
      content,
    };
  }

  /**
   * 构建助手消息
   */
  protected buildAssistantMessage(content: string): LLMMessage {
    return {
      role: 'assistant',
      content,
    };
  }

  /**
   * 验证消息格式
   */
  protected validateMessages(messages: LLMMessage[]): void {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }

    for (const message of messages) {
      if (!message.role || !message.content) {
        throw new Error('Each message must have role and content properties');
      }

      if (!['system', 'user', 'assistant', 'function'].includes(message.role)) {
        throw new Error(`Invalid role: ${message.role}`);
      }
    }
  }

  /**
   * 重试机制
   */
  protected async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (i < maxRetries - 1) {
          console.log(`重试第 ${i + 1} 次...`);
          await this.delay(1000 * Math.pow(2, i)); // 指数退避
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * 延迟函数
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 