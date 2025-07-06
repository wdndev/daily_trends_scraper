import { ChatCompletion, setEnvVariable } from '@baiducloud/qianfan';
import { BaseProvider } from './BaseProvider';
import { LLMMessage, LLMResponse, LLMStreamResponse, LLMConfig } from '../types';

/**
 * 千帆原始响应接口
 */
interface QianfanRawResponse {
  id: string;
  object: string;
  created: number;
  result: string;
  is_truncated: boolean;
  need_clear_history: boolean;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 千帆原始流式响应接口
 */
interface QianfanRawStreamResponse {
  id: string;
  object: string;
  created: number;
  sentence_id: number;
  is_end: boolean;
  is_truncated: boolean;
  result: string;
  need_clear_history: boolean;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 百度千帆Provider
 * 支持千帆大模型API调用，包括流式和非流式处理
 */
export class QianfanProvider extends BaseProvider {
  private client: ChatCompletion;

  constructor(config: LLMConfig) {
    super(config);

    const [apiKey, secretKey] = config.apiKey.split(':');
    // 设置环境变量
    setEnvVariable('QIANFAN_ACCESS_KEY', apiKey);
    setEnvVariable('QIANFAN_SECRET_KEY', secretKey);

    // 初始化千帆客户端
    this.client = new ChatCompletion();
  }

  /**
   * 非流式处理
   */
  public async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    this.validateMessages(messages);

    return this.retry(async () => {
      const response = await this.client.chat({
        messages: messages as any, // 千帆SDK类型转换
        stream: false,
      }, this.config.modelName);

      const qianfanResponse = response as QianfanRawResponse;

      return {
        content: qianfanResponse.result,
        usage: qianfanResponse.usage,
        finish_reason: qianfanResponse.is_truncated ? 'length' : 'stop',
      };
    });
  }

  /**
   * 流式处理
   */
  public async *chatStream(messages: LLMMessage[]): AsyncIterable<LLMStreamResponse> {
    this.validateMessages(messages);

    const stream = await this.client.chat({
      messages: messages as any, // 千帆SDK类型转换
      stream: true,
    }, this.config.modelName);

    let accumulatedContent = '';
    let usage: any = null;

    for await (const chunk of stream as AsyncIterableIterator<QianfanRawStreamResponse>) {
      if (chunk.result) {
        accumulatedContent += chunk.result;
        
        yield {
          content: chunk.result,
          done: false,
          usage: chunk.usage || usage,
        };
      }

      if (chunk.is_end) {
        yield {
          content: '',
          done: true,
          usage: chunk.usage || usage,
          finish_reason: chunk.is_truncated ? 'length' : 'stop',
        };
        break;
      }
    }
  }
  /**
   * 重载validateMessages方法，处理system消息
   */
  protected validateMessages(messages: LLMMessage[]): void {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }

    // 处理system消息，将其内容添加到第一个user消息前面
    const processedMessages: LLMMessage[] = [];
    let systemContent = '';
    let hasSystemMessage = false;
    let hasFirstUser = false;
    
    for (const message of messages) {
      if (!message.role || !message.content) {
        throw new Error('Each message must have role and content properties');
      }

      if (message.role === 'system') {
        if (hasSystemMessage) {
          throw new Error('Only one system message is allowed and it must be the first message');
        }
        systemContent = message.content;
        hasSystemMessage = true;
      } else if (['user', 'assistant', 'function'].includes(message.role)) {
        if (message.role === 'user' && !hasFirstUser && systemContent) {
          // 将system内容添加到第一个user消息前面
          processedMessages.push({
            role: 'user',
            content: `系统设定：${systemContent}\n\n${message.content}`,
          });
          hasFirstUser = true;
        } else {
          processedMessages.push(message);
        }
      } else {
        throw new Error(`Invalid role: ${message.role}`);
      }
    }

    // 更新原始messages数组
    messages.length = 0;
    messages.push(...processedMessages);
  }

  /**
   * 验证配置
   */
  public static validateConfig(config: LLMConfig): void {
    if (!config.apiKey) {
      throw new Error('Qianfan API Key is required');
    }
  }
} 